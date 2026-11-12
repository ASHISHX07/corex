namespace CoreX.Gateway.Helpers;

internal static class CacheHandler
{
    public static async Task WriteSessionAsync(Session session, CancellationToken cancellationToken = default) =>
        await JsonHandler.WriteJsonAsync(Fs.SessionPath, session, CoreXDataSerializerContext.Default.Session, cancellationToken);

    public static async Task<Session?> ReadSessionAsync(CancellationToken cancellationToken = default)
    {
        if (!File.Exists(Fs.SessionPath))
            return null;
        else
            return await JsonHandler.ReadJsonAsync(Fs.SessionPath, CoreXDataSerializerContext.Default.Session, cancellationToken);
    }
}