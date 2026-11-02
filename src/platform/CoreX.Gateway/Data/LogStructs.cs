namespace CoreX.Gateway.Data;

[JsonSerializable(typeof(Session))]
[JsonSourceGenerationOptions(WriteIndented = true, IndentSize = 4)]
internal partial class SessionJsonSerializerContext : JsonSerializerContext
{
}

internal struct Session
{
    public string Broker { get; set; }
    public string Token { get; set; }
    public string Date { get; set; }
    public string LastRun { get; set; }
    public string RunDuration { get; set; }
}
