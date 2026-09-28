namespace CoreX.Gateway.Helpers;

internal static class AppPaths
{
    public static string Root { get; } = "";

    public static string Cache =>
        Path.Combine(Root, "cache");
}

internal static class CacheHandler
{
    private static string? CacheDirectory { get; }

    static CacheHandler()
    {
        CacheDirectory = Path.Combine(
            AppContext.BaseDirectory,
            "cache"
        );

        Directory.CreateDirectory( CacheDirectory );
    }
}