namespace CoreX.Gateway.Helpers;

internal static class JsonHandler
{
    public static void WriteJson<T>(string path, T obj, JsonSerializerContext context)
    {
        if (context.GetTypeInfo(typeof(T)) is not JsonTypeInfo<T> typeInfo)
            throw new NotSupportedException($"[PLATFORM] - No generated JSON metadata found for {typeof(T).Name}.");

        using var WriteStream = new FileStream(
            path,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 4096,
            useAsync: false
        );

        JsonSerializer.Serialize(WriteStream, obj, typeInfo);
    }

    public static async Task WriteJsonAsync<T>(string path, T obj, JsonSerializerContext context)
    {
        if (context.GetTypeInfo(typeof(T)) is not JsonTypeInfo<T> typeInfo)
            throw new NotSupportedException($"[PLATFORM] - No generated JSON metadata found for {typeof(T).Name}.");

        await using var WriteStream = new FileStream(
            path,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 4096,
            useAsync: true
        );

        await JsonSerializer.SerializeAsync(WriteStream, obj, typeInfo);
    }

    public static T? ReadJson<T>(string path, JsonSerializerContext context)
    {
        if (context.GetTypeInfo(typeof(T)) is not JsonTypeInfo<T> typeInfo)
            throw new NotSupportedException($"[PLATFORM] - No generated JSON metadata found for {typeof(T).Name}.");

        using var ReadStream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 4096,
            useAsync: false
        );

        return JsonSerializer.Deserialize(ReadStream, typeInfo);
    }

    public static async Task<T?> ReadJsonAsync<T>(string path, JsonSerializerContext context)
    {
        if (context.GetTypeInfo(typeof(T)) is not JsonTypeInfo<T> typeInfo)
            throw new NotSupportedException($"[PLATFORM] - No generated JSON metadata found for {typeof(T).Name}.");

        await using var ReadStream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 4096,
            useAsync: true
        );

        return await JsonSerializer.DeserializeAsync(ReadStream, typeInfo);
    }
}