namespace CoreX.Gateway.Contracts;



internal interface IBrokerAuthenticator
{
    Task AuthenticateAsync(CancellationToken cancellationToken = default);
}