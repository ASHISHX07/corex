namespace CoreX.Gateway;

internal static class CoreXDi
{
    internal static void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        string BrokerName = configuration["ActiveBroker"] ?? 
            throw new InvalidOperationException("[PLATFORM] - Failed to get Broker name.");

        services
            .AddOptions<CoreXOptions>()
            .Bind(configuration.GetSection("CoreXAuthServer"));

        services
            .AddOptions<BrokerOptions>()
            .Bind(configuration.GetSection($"Brokers:{BrokerName}"));


        services.AddHttpClient("UpstoxAuthClient", client =>
        {
            // client.BaseAddress = new Uri();
        });

        services.AddTransient<IBrokerAuthenticator>(sp =>
        {
            if (BrokerName.ToUpper().Trim() == "UPSTOX")
            {
                Credentials credentials = JsonHandler.ReadJson<Credentials>(Fs.CredentialPath, CredentialsJsonContext.Default) ??
                    throw new InvalidOperationException($"[PLATFORM] - Missing credentials for {BrokerName}");

                return new UpstoxAuthenticator(credentials);
            }

            throw new NotSupportedException("[PLATFORM] - Invalid Broker.");
        });
    }
}