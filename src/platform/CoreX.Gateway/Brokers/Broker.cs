namespace CoreX.Gateway.Brokers;

internal enum Brokers : byte
{
    Zerodha,
    Fyers,
    Groww,
    Upstox,
    AngelOne
}

internal enum Exchange : byte
{
    NSE,
    BSE,
    MCX
}

internal enum Index : byte
{
    NIFTY,
    BANKNIFTY,
    FINNIFTY,
    MIDCPNIFTY,
    NIFTYNXT50,
    SENSEX,
    BANKEX
}

internal interface IBrokerAdapter
{
    public Brokers? _brokerId { get; init; }
    public string? _accessToken { get; protected set; }
}