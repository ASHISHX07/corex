namespace CoreX.Gateway.Contracts;



internal interface IBrokerAuth
{
    bool IsAutheniticated();
    Task GetAuthCode(CancellationToken? cancellationToken);
    Task GetToken(CancellationToken? cancellationToken);
}