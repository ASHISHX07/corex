namespace CoreX.Gateway.Helpers;

internal static class JsonHandler
{
    private static JsonSerializerOptions _serializerOption = new()
    {
        WriteIndented = true,
        IndentSize = 4,
        NumberHandling = JsonNumberHandling.Strict
    };
    
    
}