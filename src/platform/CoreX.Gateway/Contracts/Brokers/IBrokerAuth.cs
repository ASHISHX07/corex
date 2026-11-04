namespace CoreX.Gateway.Contracts;



internal interface IBrokerAuthenticator
{
    Task<string> AuthenticateAsync(CancellationToken cancellationToken = default);
}