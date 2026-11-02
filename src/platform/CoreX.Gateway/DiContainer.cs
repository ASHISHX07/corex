namespace CoreX.Gateway;

internal static class CoreXDi
{
    internal static void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<CoreXOptions>()
            .Bind(configuration.GetSection("CoreX"));

        services
            .AddOptions<BrokerOptions>()
            .Bind(configuration.GetSection("Broker"));

        string BrokerName = configuration["Broker:Name"]?.ToUpper()?.Trim() ?? 
            throw new InvalidOperationException("[PLATFORM] - Failed to get Broker name.");

        services.AddTransient<IBrokerAuthenticator>(sp =>
        {
            if (BrokerName == "UPSTOX")
            {
                Credentials credentials = JsonHandler.ReadJson<Credentials>(Fs.CredentialPath, CredentialsJsonContext.Default) ??
                    throw new InvalidOperationException($"[PLATFORM] - Missing credentials for {BrokerName}");
                    
                return new UpstoxAuthenticator(credentials);
            }

            throw new NotSupportedException("[PLATFORM] - Invalid Broker.");
        });
    }
}