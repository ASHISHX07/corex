namespace CoreX.Gateway.Data;

[JsonSourceGenerationOptions(WriteIndented = true, IndentSize = 4)]
[JsonSerializable(typeof(Session))]
internal partial class SessionJsonSerializerContext : JsonSerializerContext
{
}

internal struct Session
{
    public string Broker { get; set; }
    public string Token { get; set; }
    public string Date { get; set; }
    public string StartedAt { get; set; }
    public string StoppedAt { get; set; }
}
