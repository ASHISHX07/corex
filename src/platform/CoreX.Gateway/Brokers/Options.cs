namespace CoreX.Gateway.Brokers;

internal sealed class CredentialsOption
{
    public string CoreXClientKey { get; set; } = "";
    public string BrokerAppId { get; set; } = "";
    public string BrokerAppSecret { get; set; } = "";
}

public class Credentials(string corexClientKey, string brokerAppId, string brokerAppSecret)
{
    protected string CoreXClientKey { get; } = corexClientKey;
    protected string BrokerAppId { get; } = brokerAppId;
    protected string BrokerAppSecret { get; } = brokerAppSecret;
}