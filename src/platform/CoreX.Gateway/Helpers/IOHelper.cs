namespace CoreX.Gateway.Helpers;

internal static class Fs
{
    // Base
    private static readonly string _baseAppData         = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    private static readonly string AppData              = Path.Combine(_baseAppData, @"CoreX");

    // Inside App-Data (Base)
    public static readonly string CachePath             = Path.Combine(AppData, @"cache");
    public static readonly string DataPath              = Path.Combine(AppData, @"data");
    public static readonly string TempPath              = Path.Combine(AppData, @"temp");
    public static readonly string LogsPath              = Path.Combine(AppData, @"logs");

    // Directories
    public static readonly DirectoryInfo CacheDir       = new(CachePath);
    public static readonly DirectoryInfo DataDir        = new(DataPath);
    public static readonly DirectoryInfo TempDir        = new(TempPath);
    public static readonly DirectoryInfo LogsDir        = new(LogsPath);

    // Project Paths
    public static readonly string RootPath              = @"../../../";
    public static readonly string PlatformPath          = @"./";
    public static readonly string CorePath              = @"../core";
    public static readonly string AppConfigPath         = Path.Combine(RootPath, @"config", @"appsettings.json");
    public static readonly string CredentialPath         = Path.Combine(RootPath, @"config", @"credentials.json");
    public static readonly string SharedDirPath        = Path.Combine(RootPath, @"shared");

    // Files
    public static FileInfo AppConfigJson                = new(AppConfigPath);
    public static FileInfo CredentialsJson              = new(CredentialPath);

    public static void Init()
    {
        if (!AppConfigJson.Exists)
            throw new FileNotFoundException($"[PLATFORM] - Missing {AppConfigJson.Name} at {AppConfigJson.DirectoryName}");
            
        if (!CredentialsJson.Exists)
            throw new FileNotFoundException($"[PLATFORM] - Missing {CredentialsJson.Name} at {CredentialsJson.DirectoryName}");

        CacheDir.Create();
        DataDir.Create();
        TempDir.Create();
        LogsDir.Create();

        CacheDir.Refresh();
        DataDir.Refresh();
        TempDir.Refresh();
        LogsDir.Refresh();
    }
}