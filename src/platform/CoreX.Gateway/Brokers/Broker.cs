namespace CoreX.Gateway.Brokers;

[JsonSerializable(typeof(Credentials))]
[JsonSourceGenerationOptions(JsonSerializerDefaults.Strict)]
internal partial class CredentialsJsonContextJsonContext : JsonSerializerContext
{
}

internal sealed record Credentials(
    string CoreXClientKey,
    string BrokerAppId,
    string BrokerAppSecret
);

// Credentials? credentials = await JsonHandler.ReadJsonAsync<Credentials>(
//     Fs.CredentialPath,
//     CoreXJsonContext.Default
// );