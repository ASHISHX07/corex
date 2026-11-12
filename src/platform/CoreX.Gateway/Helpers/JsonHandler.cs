namespace CoreX.Gateway.Helpers;

internal static class JsonHandler
{
    public static void WriteJson<T>(string path, T obj, JsonTypeInfo<T> typeInfo)
    {
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

    public static async Task WriteJsonAsync<T>(string path, T obj, JsonTypeInfo<T> typeInfo, CancellationToken cancellationToken = default)
    {
        await using var WriteStream = new FileStream(
            path,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 4096,
            useAsync: true
        );

        await JsonSerializer.SerializeAsync(WriteStream, obj, typeInfo, cancellationToken);
    }

    public static T? ReadJson<T>(string path, JsonTypeInfo<T> typeInfo)
    {
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

    public static async Task<T?> ReadJsonAsync<T>(string path, JsonTypeInfo<T> typeInfo, CancellationToken cancellationToken = default)
    {
        await using var ReadStream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 4096,
            useAsync: true
        );

        return await JsonSerializer.DeserializeAsync(ReadStream, typeInfo, cancellationToken);
    }
}