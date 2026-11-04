namespace CoreX.Gateway.Helpers;

/// <summary>
/// Client-side crypto for the CoreX Auth Server (API v2). Identical for every broker.
/// Usage: using var keys = CorexCryptography.GenerateKeyPair();
///        -> send keys.PublicKey when creating the session
///        -> keys.Decrypt(sessionId, envelope) when the result arrives.
/// </summary>

internal static class CorexCryptography
{
    private static readonly byte[] HkdfInfo = "corex-token-v2"u8.ToArray();

    internal static KeyPair GenerateKeyPair() => new();

    /// <summary>A throwaway keypair for ONE login. The private half never leaves this object.</summary>
    internal sealed class KeyPair : IDisposable
    {
        private readonly ECDiffieHellman _key = ECDiffieHellman.Create(ECCurve.NamedCurves.nistP256);

        internal KeyPair()
        {
            var q = _key.ExportParameters(false).Q;
            PublicKey = ToBase64Url([0x04, .. q.X!, .. q.Y!]);      // raw point: 0x04 + X (32 bytes) + Y (32 bytes)
        }

        /// <summary>Send this to the server as "clientPublicKey".</summary>
        internal string PublicKey { get; }

        /// <summary>Returns the plaintext JSON bytes: { accessToken, tokenType, expiresAt, profile }.</summary>
        internal byte[] Decrypt(string sessionId, EncryptedTokenEnvelope envelope)
        {
            if (envelope.Version != 2) throw new CryptographicException("Unsupported envelope version.");

            byte[] serverPoint = FromBase64Url(envelope.EphemeralPublicKey);   // server's one-time public key (65 bytes)
            byte[] data = FromBase64Url(envelope.CipherText);                  // encrypted JSON + 16-byte integrity tag
            if (serverPoint.Length != 65 || data.Length < 16) throw new CryptographicException("Malformed envelope.");

            // 1. Shared secret: my private key + server's one-time public key (the server derived the same one).
            using var server = ECDiffieHellman.Create(new ECParameters
            {
                Curve = ECCurve.NamedCurves.nistP256,
                Q = new ECPoint { X = serverPoint[1..33], Y = serverPoint[33..65] }
            });
            byte[] secret = _key.DeriveRawSecretAgreement(server.PublicKey);

            // 2. Turn the secret into an AES key. The session id is mixed in, so the key is unique per login.
            byte[] session = Encoding.UTF8.GetBytes(sessionId);
            byte[] aesKey = HKDF.DeriveKey(HashAlgorithmName.SHA256, secret, 32, salt: session, info: HkdfInfo);

            // 3. Decrypt and verify. Any tampering, or a wrong session id, throws CryptographicException.
            byte[] plain = new byte[data.Length - 16];
            using var aes = new AesGcm(aesKey, 16);
            aes.Decrypt(FromBase64Url(envelope.Iv), data[..^16], data[^16..], plain, session);
            return plain;
        }

        public void Dispose() => _key.Dispose();
    }

    private static string ToBase64Url(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] FromBase64Url(string value) =>
        Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/').PadRight((value.Length + 3) / 4 * 4, '='));
}

internal sealed record EncryptedTokenEnvelope(
    [property: JsonPropertyName("v")] int Version,
    [property: JsonPropertyName("alg")] string Algorithm,
    [property: JsonPropertyName("epk")] string EphemeralPublicKey,
    [property: JsonPropertyName("iv")] string Iv,
    [property: JsonPropertyName("ct")] string CipherText
);