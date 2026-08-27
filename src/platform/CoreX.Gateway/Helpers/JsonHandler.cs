namespace CoreX.Gateway.Helpers;

internal sealed class JsonData
{
    private Dictionary<short, string>? _jsonObject = new();
    JsonSerializerOptions serializerOptions = new() { WriteIndented = true, IndentSize = 4 };

    public void AddSymbol(in short key, in string value) =>
        _jsonObject?.Add(key, value);

    public void RemoveSymbol(in short key) => 
        _jsonObject?.Remove(key);

    public string ToJsonString() =>
        JsonSerializer.Serialize(_jsonObject, serializerOptions);
}

internal static class JsonHandler
{
    
}