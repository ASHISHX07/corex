namespace CoreX.Gateway.Helpers;

internal static class JsonHandler
{
    private static JsonSerializerOptions _serializerOption = new()
    {
        WriteIndented = true,
        IndentSize = 4,
        NumberHandling = JsonNumberHandling.Strict
        
    };

    // public static bool SerializeToJsonString(in string path, in string data)
    // {
    //     string json = JsonSerializer.Serialize(data, _serializerOption);



    //     return true;
    // }
}