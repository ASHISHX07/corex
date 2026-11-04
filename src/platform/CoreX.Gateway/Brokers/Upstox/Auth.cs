namespace CoreX.Gateway.Brokers;

internal sealed class UpstoxAuthenticator(HttpClient httpClient, IOptions<CoreXServerOptions> options) : IBrokerAuthenticator
{
    private readonly HttpClient _httpclient = httpClient;
    private readonly CoreXServerOptions _options = options.Value;

    private readonly Credentials? credentials = JsonHandler.ReadJson<Credentials>(Fs.CredentialPath, CredentialsJsonSerializerContext.Default);

    public async Task<string> AuthenticateAsync(CancellationToken cancellationToken = default)
    {
        string CoreXClientKey = credentials?.CoreXClientKey ??
            throw new InvalidOperationException("[PLATFORM] - Missing CoreX client key");
        string BrokerAppId    = credentials?.BrokerAppId ??
            throw new InvalidOperationException("[PLATFORM] - Missing broker app id");
        string BrokerAppSecret = credentials?.BrokerAppSecret ??
            throw new InvalidOperationException("[PLATFORM] - Missing broker app secret");

        using var publicKey = CorexCryptography.GenerateKeyPair();

        _httpclient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CoreXClientKey);

        var SessionCreationPayload = new
        {
            broker = "upstox",
            appId = BrokerAppId,
            appSecret = BrokerAppSecret,
            clientPublicKey = publicKey.PublicKey
        };
        
        //HttpResponseMessage responseMessage = await _httpclient.PostAsJsonAsync<SessionCreationPayload>()
        //throw new NotImplementedException();
    }

    // Create Session

    //private static async Task<ApiErrorResponse?> ReadErrorAsync(HttpResponseMessage response, CancellationToken token = default)
    //{
    //    try
    //    {
    //        //return await response.Content.ReadFromJsonAsync<ApiErrorResponse>(cancellationToken: token);
    //    }
    //    catch (JsonException)
    //    {
    //        return null;
    //    }
    //}

    private sealed record CreateSessionRequest(
        [property: JsonPropertyName("broker")] string Broker,
        [property: JsonPropertyName("appId")] string AppId,
        [property: JsonPropertyName("appSecret")] string AppSecret,
        [property: JsonPropertyName("clientPublicKey")] string ClientPublicKey
    );

    private sealed record SessionResponse(
        [property: JsonPropertyName("sessionId")] string SessionId,
        [property: JsonPropertyName("authorizationUrl")] string AuthorizationUrl,
        [property: JsonPropertyName("expiresAt")] DateTimeOffset ExpiresAt
    );

    private sealed record PollResponse(
        [property: JsonPropertyName("status")] string? status,
        [property: JsonPropertyName("error")] string? Error,
        [property: JsonPropertyName("encrypted")] EncryptedTokenEnvelope? Encrypted
    );

    private sealed record ApiErrorResponse(
        [property: JsonPropertyName("error")] string? Error
    );

    private sealed record SessionContext(
        string CoreXClientKey,
        SessionResponse Response
    );
}