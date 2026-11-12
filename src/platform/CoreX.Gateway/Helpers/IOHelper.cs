namespace CoreX.Gateway.Helpers;

internal static class Fs
{
    // Base
    private static readonly string localAppData             = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    private static readonly string appData                  = Path.Combine(localAppData, "CoreX");

    public static readonly string CachePath                 = Path.Combine(appData, "cache");
    public static readonly string SessionPath               = Path.Combine(CachePath, "session.json");
    public static readonly string DataPath                  = Path.Combine(appData, "data");
    public static readonly string SystemLogsPath            = Path.Combine(appData, "logs", @"system");
    public static readonly string NetworkLogsPath           = Path.Combine(appData, "logs", @"network");
    public static readonly string ProfilerLogsPath          = Path.Combine(appData, "logs", @"profiler");
    public static readonly string TempRoot                  = Path.GetTempPath();

    // Directories
    public static readonly DirectoryInfo CacheDir           = new(CachePath);
    public static readonly DirectoryInfo DataDir            = new(DataPath);
    public static readonly DirectoryInfo SystemLogsDir      = new(SystemLogsPath);
    public static readonly DirectoryInfo NetworkLogsDir     = new(NetworkLogsPath);
    public static readonly DirectoryInfo ProfilerLogsDir    = new(ProfilerLogsPath);
    public static readonly DirectoryInfo TempDir            = new(TempRoot);

    // Project Paths
    public static readonly string RootPath                  = Path.GetFullPath(Path.Combine("..", "..", ".."));
    public static readonly string TRootPath                 = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".."));
    public static readonly string PlatformPath              = Path.GetFullPath(".");
    public static readonly string CorePath                  = Path.GetFullPath(Path.Combine("..", "core"));
    public static readonly string ConfigPath                = Path.Combine(TRootPath, "config");
    public static readonly string CredentialPath            = Path.Combine(TRootPath, "config", "user-credentials.json");
    public static readonly string SharedDirPath             = Path.Combine(RootPath, "shared");

    public static void Init()
    {
        CacheDir.Create();
        DataDir.Create();
        SystemLogsDir.Create();
        NetworkLogsDir.Create();
        ProfilerLogsDir.Create();
    }
}