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
                ApplicationName = "CoreX-Gateway",
                ContentRootPath = AppContext.BaseDirectory
            }
        );
        
        CoreXDi.RegisterServices(builder.Services, builder.Configuration);

        using IHost host = builder.Build();

        await Logger.CloseAsync();
        await PerformanceProfiler.CloseAsync();
    }
}
