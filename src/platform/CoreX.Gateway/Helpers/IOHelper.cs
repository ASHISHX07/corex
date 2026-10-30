namespace CoreX.Gateway.Helpers;

internal static class Fs
{
    // Base
    private static readonly string _baseAppData             = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    private static readonly string AppData                  = Path.Combine(_baseAppData, @"CoreX");

    // Inside App-Data Paths (Base)
    public static readonly string CachePath                 = Path.Combine(AppData, @"cache");
    public static readonly string DataPath                  = Path.Combine(AppData, @"data");
    public static readonly string TempPath                  = Path.Combine(AppData, @"temp");
    public static readonly string SystemLogsPath            = Path.Combine(AppData, @"logs", @"system");
    public static readonly string NetworkLogsPath           = Path.Combine(AppData, @"logs", @"network");
    public static readonly string ProfilerLogsPath          = Path.Combine(AppData, @"logs", @"profiler");

    // Directories
    public static readonly DirectoryInfo CacheDir           = new(CachePath);
    public static readonly DirectoryInfo DataDir            = new(DataPath);
    public static readonly DirectoryInfo TempDir            = new(TempPath);
    public static readonly DirectoryInfo SystemLogsDir      = new(SystemLogsPath);
    public static readonly DirectoryInfo NetworkLogsDir     = new(NetworkLogsPath);
    public static readonly DirectoryInfo ProfilerLogsDir    = new(ProfilerLogsPath);

    // Project Paths
    public static readonly string RootPath                  = @"..\..\..\";
    public static readonly string PlatformPath              = @".\";
    public static readonly string CorePath                  = @"..\core";
    public static readonly string ConfigPath                = Path.Combine(RootPath, @"config");
    public static readonly string CredentialPath            = Path.Combine(RootPath, @"config", @"user-credentials.json");
    public static readonly string AppConfigPath             = Path.Combine(RootPath, @"config", @"appsettings.json");
    public static readonly string BrokerConfigPath          = Path.Combine(RootPath, @"config", @"broker.config.json");
    public static readonly string SharedDirPath             = Path.Combine(RootPath, @"shared");

    // Files
    private static readonly FileInfo CredentialsJsonFile    = new(CredentialPath);
    public static FileInfo AppConfigJsonFile                = new(AppConfigPath);
    public static FileInfo BrokerConfigJsonFile             = new(BrokerConfigPath);

    public static void Init()
    {
        if (!AppConfigJsonFile.Exists)
            throw new FileNotFoundException($"[PLATFORM] - Missing {AppConfigJsonFile.Name} at {AppConfigJsonFile.DirectoryName}");
            
        if (!CredentialsJsonFile.Exists)
            throw new FileNotFoundException($"[PLATFORM] - Missing {CredentialsJsonFile.Name} at {CredentialsJsonFile.DirectoryName}");

        if (!BrokerConfigJsonFile.Exists)
            throw new FileNotFoundException($"[PLATFORM] - Missing {BrokerConfigJsonFile.Name} at {BrokerConfigJsonFile.DirectoryName}");

        CacheDir.Create();
        DataDir.Create();
        TempDir.Create();
        SystemLogsDir.Create();
        NetworkLogsDir.Create();
        ProfilerLogsDir.Create();

        CacheDir.Refresh();
        DataDir.Refresh();
        TempDir.Refresh();
        SystemLogsDir.Refresh();
        NetworkLogsDir.Refresh();
        ProfilerLogsDir.Refresh();
    }
}