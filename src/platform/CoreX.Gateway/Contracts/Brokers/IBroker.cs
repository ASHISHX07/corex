namespace CoreX.Gateway.Contracts;

internal interface IBroker
{
    Task LoginAsync(CancellationToken cancellationToken = default);
}
