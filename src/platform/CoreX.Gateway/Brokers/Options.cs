namespace CoreX.Gateway.Brokers;

internal sealed class CoreXServerOptions
{
    public required string BaseUri { get; set; }
    public required string AuthSessionCreation { get; set; }
    public required string GetAuthSessionResult { get; set; }
    public required long PollIntervalMs { get; set; }
    public required int TimeOutSeconds { get; set; }
}

internal sealed class BrokerOptions
{
    
}