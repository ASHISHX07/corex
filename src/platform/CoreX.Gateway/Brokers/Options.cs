namespace CoreX.Gateway.Brokers;

[JsonSerializable(typeof(Credentials))]
internal partial class CredentialsJsonContext : JsonSerializerContext
{
}

// internal sealed record Credentials(
//     string CoreXClientKey,
//     string BrokerAppId,
//     string BrokerAppSecret
// );

// public sealed class CredentialsOption
// {
//     public string CoreXClientKey { get; set; } = "";
//     public string BrokerAppId { get; set; } = "";
//     public string BrokerAppSecret { get; set; } = "";
// }

// public class Credentials(string corexClientKey, string brokerAppId, string brokerAppSecret)
// {
//     protected string CoreXClientKey { get; } = corexClientKey;
//     protected string BrokerAppId { get; } = brokerAppId;
//     protected string BrokerAppSecret { get; } = brokerAppSecret;
// }

internal sealed class CoreXOptions
{
    
}

internal sealed class BrokerOptions
{
    
}