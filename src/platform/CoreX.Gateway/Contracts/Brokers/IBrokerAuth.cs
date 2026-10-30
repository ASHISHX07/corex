namespace CoreX.Gateway.Contracts;



internal interface IBrokerAuthClient
{
    bool IsAutheniticated();
    Task<string> GetAuthCodeAsync(CancellationToken? cancellationToken);
    Task<string> GetTokenAsync(CancellationToken? cancellationToken);
}