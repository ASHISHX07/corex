namespace CoreX.Gateway.Helpers;

internal static class Fs
{
    private static readonly string _baseAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    private static readonly string AppData      = Path.Combine(_baseAppData, @"CoreX");

    public static readonly string Cache         = Path.Combine(AppData, @"cache");
    public static readonly string Data          = Path.Combine(AppData, @"data");
    public static readonly string Temp          = Path.Combine(AppData, @"temp");
    public static readonly string logs          = Path.Combine(AppData, @"logs");

    public static readonly string RootPath      = @"../../../";
    public static readonly string PlatformPath  = @"./";
    public static readonly string CorePath      = @"../core";
    public static readonly string shared        = Path.Combine(RootPath, @"shared");

    public static void Init()
    {
        Directory.CreateDirectory(Cache);
        Directory.CreateDirectory(Data);
        Directory.CreateDirectory(Temp);
        Directory.CreateDirectory(logs);
    }
}