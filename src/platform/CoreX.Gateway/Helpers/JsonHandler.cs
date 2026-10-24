namespace CoreX.Gateway.Helpers;

internal static class JsonHandler
{    
    public static async Task WriteJsonAsync<T>(string path, T obj, JsonSerializerContext context)
    {
        if (context.GetTypeInfo(typeof(T)) is not JsonTypeInfo<T> typeInfo)
            throw new NotSupportedException($"[PLATFORM] - No generated JSON metadata found for {typeof(T).Name}.");

        

        // string JsonString = JsonSerializer.Serialize<T>(obj, (JsonTypeInfo<T>)context.GetTypeInfo(typeof(T)));
    }
}