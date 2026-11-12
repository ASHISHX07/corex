namespace CoreX.Gateway;

internal class CoreXPlatfrom
{
    internal static async Task Main(string[] args)
    {
        using var cts = new CancellationTokenSource();

        ConsoleCancelEventHandler cancelHandler = (_, e) =>
        {
            e.Cancel = true; // Prevent immediate process termination
            Console.WriteLine("\n[PLATFORM] - Closing...");
            cts.Cancel();
        };

        Console.CancelKeyPress += cancelHandler;

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

        await host.StartAsync();

        //await host.Services.GetRequiredService<IBrokerAuthenticator>().AuthenticateAsync();
        //var (success, profile) = await host.Services.GetRequiredService<IBroker>().TryGetProfileInfoAsync();

        await host.Services.GetRequiredService<IBroker>().LoginAsync(cts.Token);

        Console.CancelKeyPress -= cancelHandler;

        await host.StopAsync();
        await Logger.CloseAsync();
        await PerformanceProfiler.CloseAsync();
    }
}
