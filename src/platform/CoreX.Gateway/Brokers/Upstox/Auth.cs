namespace CoreX.Gateway.Brokers;

internal class UpstoxAuthenticator(IOptions<CredentialsOption> options)
    : Credentials(options.Value.CoreXClientKey, options.Value.BrokerAppId, options.Value.BrokerAppSecret),
    IBrokerAuthenticator
{
    public async Task<string> GetAuthCodeAsync(CancellationToken? cancellationToken)
    {
        return string.Empty;
    }

    public async Task<string> GetTokenAsync(CancellationToken? cancellationToken)
    {
        return string.Empty;
    }
}