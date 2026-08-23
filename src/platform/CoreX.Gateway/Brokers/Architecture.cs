namespace CoreX.Gateway.Architecture;

internal enum Brokers : byte
{
    Zerodha,
    Upstox,
    Fyers,
    Groww,
    AngelOne
}

internal interface IAuthFlow
{
    protected Brokers? Broker { get; init; }
    protected string AcessToken { get; init; }
    protected string Sha256Hash { get; init; }

    public bool AuthenticateUser(out string access_token);
    public bool IsAccessTokenValid(ref string access_token);
}