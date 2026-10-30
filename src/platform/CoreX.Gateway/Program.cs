namespace CoreX.Gateway;

internal class CoreXPlatfrom
{
    internal static async Task Main(string[] args)
    {
        Fs.Init();

        var environment = Assembly.GetEntryAssembly()?.GetCustomAttributes<AssemblyMetadataAttribute>().FirstOrDefault(x => x.Key == "CoreXEnvironment")?.Value
            ?? throw new InvalidOperationException("[PLATFORM] - CoreXEnvironment is not configured");

        HostApplicationBuilder builder = Host.CreateApplicationBuilder(
            new HostApplicationBuilderSettings
            {
                Args = args,
                EnvironmentName = environment,
                ApplicationName = "CoreX-Gateway"
            }
        );

        builder.Configuration.AddJsonFile(Path.GetFullPath(Fs.CredentialPath), optional: false, reloadOnChange: true);
        builder.Configuration.AddJsonFile(Path.GetFullPath(Fs.BrokerConfigPath), optional: false, reloadOnChange: true);

        CoreXDi.RegisterServices(builder.Services, builder.Configuration);

        await Logger.CloseAsync();
        await PerformanceProfiler.CloseAsync();
    }
}
