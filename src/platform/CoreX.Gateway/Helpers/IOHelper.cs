namespace CoreX.Gateway.Helpers;

internal static class Fs
{
    private static string _rootPath = @"../../../";
    // private static string? _basePath = null;

    public static void Init()
    {
        Directory.CreateDirectory(Path.Combine(_rootPath, "cache"));
        Directory.CreateDirectory(Path.Combine(_rootPath, "temp"));
    }
}