namespace CoreX.Gateway.Brokers;

internal sealed class UpstoxAuthenticator : IBrokerAuthenticator
{
    private readonly Credentials _credentials;

    internal UpstoxAuthenticator(Credentials credentials)
    {
        _credentials = credentials;
    }

    internal async Task<string> GetAuthCodeAsync(CancellationToken? cancellationToken)
    {
        
    }
}