namespace CoreX.Gateway.Brokers;

internal sealed class UpstoxAuthenticator : IBrokerAuthenticator
{
    private readonly Credentials _credentials;
    // private readonly HttpClient _httpClient;

    internal UpstoxAuthenticator(Credentials credentials)
    {
        _credentials = credentials;
        // _httpClient = httpClient;
    }

    // internal async Task<string> GetAuthCodeAsync(CancellationToken? cancellationToken)
    // {
        
    // }
}