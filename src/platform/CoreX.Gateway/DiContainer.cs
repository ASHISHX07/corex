namespace CoreX.Gateway;

internal static class CoreXDi
{
    internal static void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        string broker = configuration["Broker"]
            ?? throw new InvalidOperationException("[PLATFORM] - Broker configuration (name) is missing");

        services
            .AddOptions<CoreXOptions>()
            .Bind(configuration.GetSection("CoreX"));

        services
            .AddOptions<BrokerOptions>()
            .Bind(configuration.GetSection("Broker"));

        services
            .AddTransient<IBrokerAuthenticator>(
                
            );
    }
}