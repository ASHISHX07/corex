namespace CoreX.Gateway.Contracts;

internal enum Brokers : byte
{
    Zerodha,
    Fyers,
    Groww,
    Upstox,
    AngelOne
}

internal interface IBrokerAdapter
{
    public Brokers? _brokerId { get; init; }
    public string? _accessToken { get; protected set; }
}

internal interface IBrokerAuthenticator
{
    Task<bool> AuthenticateUser(CancellationToken cancellationToken);
    Task<bool> ValidateUser(CancellationToken cancellationToken);
}