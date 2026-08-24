namespace CoreX.Gateway.Architecture;

internal enum Brokers : byte
{
    Zerodha,
    Upstox,
    Fyers,
    Groww,
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

internal interface ISymbols
{
    Dictionary<short, string>? _symbolMap { get; protected set; }

    public bool Update();
    public bool ReSync();
    public short MapSymbol(in string symbolString);
    public string MapSymbol(in short index);
}

internal interface IAuthFlow
{
    protected Brokers? Broker { get; init; }
    protected string AcessToken { get; init; }
    protected string Sha256Hash { get; init; }

    public bool AuthenticateUser(out string access_token);
    public bool IsAccessTokenValid(ref string access_token);
}

internal interface IUserInfo
{
    protected string Name { get; init; }
    protected string Id { get; init; }
    protected double? Funds { get; set; }
    protected double? AvailableFunds { get; set; }
}

internal interface IDataStream
{
    public bool GetQuote(in short indexOfSymbol);
    public bool PollOptionChain();
    public bool GetMarketDepth();
}