namespace CoreX.Gateway.Data;

[JsonSourceGenerationOptions(WriteIndented = true, IndentSize = 4)]
[JsonSerializable(typeof(Session))]
internal partial class SessionJsonSerializerContext : JsonSerializerContext
{
}

internal struct Session
{
    string Broker { get; set; }
    string Token { get; set; }
    string Date { get; set; }
    string SavedAt { get; set; }
    int ApiCalls { get; set; }
}
