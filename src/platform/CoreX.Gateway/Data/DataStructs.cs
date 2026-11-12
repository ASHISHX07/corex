namespace CoreX.Gateway.Data;

[JsonSerializable(typeof(Session))]
[JsonSourceGenerationOptions(JsonSerializerDefaults.Strict, WriteIndented = true, IndentSize = 4, PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
internal partial class CoreXDataSerializerContext : JsonSerializerContext
{
}

internal struct Session
{
    public string Broker { get; set; }
    public string Token { get; set; }
    public string SavedAt { get; set; }
}