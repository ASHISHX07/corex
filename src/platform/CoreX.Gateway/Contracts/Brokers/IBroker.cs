namespace CoreX.Gateway.Contracts;

internal interface IBroker
{
    Task<(HttpStatusCode? StatusCode, UpstoxProfileInfo? Profile)> TryGetProfileInfoAsync(CancellationToken cancellationToken = default);
    Task LoginAsync(CancellationToken cancellationToken = default);
}