namespace CoreX.Gateway;

internal class CoreXPlatfrom
{

    internal static async Task Main(string[] args)
    {
        HostApplicationBuilder builder = Host.CreateApplicationBuilder(
            new HostApplicationBuilderSettings
            {
                ApplicationName = "CoreX",
                EnvironmentName = "Development",
                Args = args,
                ContentRootPath = AppContext.BaseDirectory
            }
        );

        // builder.Configuration.AddJsonFile(Fs.CredentialPath);
        Console.WriteLine(builder.Configuration["brokerAppSecret"]);
        IHost host = builder.Build();

        await host.RunAsync();

        Fs.Init();
        
        await Logger.Close();
        await PerformanceProfiler.Close();
    }
}
