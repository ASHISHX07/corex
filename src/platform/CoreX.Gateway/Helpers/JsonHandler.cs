namespace CoreX.Gateway.Helpers;

/// <summary>
/// JSON reader/writer, supports both synchronous and asynchronous operations (AOT compatible)
/// </summary>
internal static class JsonHandler
{
    /// <summary>
    /// Synchronous Json Writer, create a new file if the file doesn't exists at given path, overwrites otherwise
    /// </summary>
    /// <typeparam name="T">Type of the object</typeparam>
    /// <param name="path">Path</param>
    /// <param name="obj">Object of given type T</param>
    /// <param name="typeInfo">Json type info for the given type T</param>
    public static void WriteJson<T>(string path, T obj, JsonTypeInfo<T> typeInfo)
    {
        EnsureDirectory(path);

        using var writeStream = new FileStream(
            path,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 4096,
            useAsync: false
        );

        JsonSerializer.Serialize(writeStream, obj, typeInfo);
    }

    /// <summary>
    /// Asynchronous Json Writer, create a new file if the file doesn't exists at given path, overwrites otherwise
    /// </summary>
    /// <typeparam name="T">Type of the object</typeparam>
    /// <param name="path">Path</param>
    /// <param name="obj">Object of Given type T</param>
    /// <param name="typeInfo">Json type info for the given type T</param>
    /// <param name="cancellationToken">Cancellation token (OPTIONAL)</param>
    /// <returns>A Task representing asynchronous write operation</returns>
    public static async Task WriteJsonAsync<T>(string path, T obj, JsonTypeInfo<T> typeInfo, CancellationToken cancellationToken = default)
    {
        EnsureDirectory(path);

        await using var writeStream = new FileStream(
            path,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 4096,
            useAsync: true
        );

        await JsonSerializer.SerializeAsync(writeStream, obj, typeInfo, cancellationToken);
    }

    /// <summary>
    /// Synchronous Json Reader
    /// </summary>
    /// <typeparam name="T">Type of the object</typeparam>
    /// <param name="path">Path to the object</param>
    /// <param name="typeInfo">Json type info for the given type T</param>
    /// <returns>An object of type T if the file exists at given path, null otherwise</returns>
    public static T? ReadJson<T>(string path, JsonTypeInfo<T> typeInfo)
    {
        if (!File.Exists(path)) return default;

        using var readStream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 4096,
            useAsync: false
        );

        return JsonSerializer.Deserialize(readStream, typeInfo);
    }

    /// <summary>
    /// Asynchronous Json Reader
    /// </summary>
    /// <typeparam name="T">Type of the object</typeparam>
    /// <param name="path">Path to the object</param>
    /// <param name="typeInfo">Json type info for the given type T</param>
    /// <param name="cancellationToken">Cancellation token (OPTIONAL)</param>
    /// <returns>An object of type T if the file exists at given path, null otherwise</returns>
    public static async Task<T?> ReadJsonAsync<T>(string path, JsonTypeInfo<T> typeInfo, CancellationToken cancellationToken = default)
    {
        if (!File.Exists(path)) return default;

        await using var readStream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 4096,
            useAsync: true
        );

        return await JsonSerializer.DeserializeAsync(readStream, typeInfo, cancellationToken);
    }

    private static void EnsureDirectory(string path)
    {
        string? directory = Path.GetDirectoryName(path);

        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);
    }
}