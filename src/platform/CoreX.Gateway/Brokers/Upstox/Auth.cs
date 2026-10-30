internal class UpstoxAuthClient(HttpClient httpClient) : IBrokerAuthClient
{
    private bool IsAuthorized { get; set; }

    public bool IsAutheniticated()
    {
        return IsAuthorized;
    }

    public async Task<string> GetAuthCodeAsync(CancellationToken? cancellationToken)
    {
        
    }

    public async Task<string> GetTokenAsync(CancellationToken? cancellationToken)
    {
        
    }
}