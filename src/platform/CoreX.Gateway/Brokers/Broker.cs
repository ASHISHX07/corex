namespace CoreX.Gateway.Brokers;

[JsonSerializable(typeof(Credentials))]
[JsonSourceGenerationOptions(JsonSerializerDefaults.Strict)]
internal partial class CredentialsJsonSerializerContext : JsonSerializerContext
{
}

internal sealed record Credentials(string CoreXClientKey, string BrokerAppId, string BrokerAppSecret)
{
    public override string ToString() =>
        "Credentials { [REDACTED] }";
}

