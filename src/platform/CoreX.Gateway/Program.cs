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
        
        builder.Logging.Services.AddSingleton<ILoggerProvider, GatewayFileLoggerProvider>();
        CoreXDi.RegisterServices(builder.Services, builder.Configuration);

        using IHost host = builder.Build();

        var stoppingToken = host.Services.GetRequiredService<IHostApplicationLifetime>().ApplicationStopping;

        try
        {
            await host.StartAsync(stoppingToken);
            var broker = host.Services.GetRequiredService<IBroker>();
            await broker.LoginAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // A host shutdown cancels the active HTTP request or timer wait.
        }
        finally
        {
            try
            {
                await host.StopAsync();
            }
            finally
            {
                await PerformanceProfiler.CloseAsync();
            }
        }
    }
}
