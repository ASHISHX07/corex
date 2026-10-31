namespace CoreX.Gateway.Contracts;



internal interface IBrokerAuthenticator
{
    Task<string> GetAuthCodeAsync(CancellationToken? cancellationToken);
    Task<string> GetTokenAsync(CancellationToken? cancellationToken);
}