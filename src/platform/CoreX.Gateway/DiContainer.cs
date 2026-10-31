namespace CoreX.Gateway;

internal static class CoreXDi
{
    internal static void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        string CorexServerBaseUri = configuration["corexServerBaseUri:corexAuthEndpoint"]
            ?? throw new InvalidOperationException("[PLATFORM] - Missing broker baseUri in broker.config.json");
    }
}