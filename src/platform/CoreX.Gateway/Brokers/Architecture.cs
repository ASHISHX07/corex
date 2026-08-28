namespace CoreX.Gateway.Architecture;

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