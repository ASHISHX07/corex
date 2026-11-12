namespace CoreX.Gateway;

internal static class CoreXDi
{
    internal static void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        string BrokerName = configuration["ActiveBroker"] ?? 
            throw new InvalidOperationException("[PLATFORM] - Failed to get Broker name.");

        if (string.IsNullOrWhiteSpace(BrokerName))
            throw new InvalidOperationException("[PLATFORM] - Broker name cannot be empty.");

        // Public configuration
        services
            .AddOptions<CoreXServerOptions>()
            .Bind(configuration.GetSection("CoreXServer"))
            .Validate(options => 
                Uri.TryCreate(options.BaseUri, UriKind.Absolute, out var CoreXServerBaseUri) &&
                CoreXServerBaseUri.Scheme == Uri.UriSchemeHttps,
                "[PLATFORM] - Invalid CoreX server base uri")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Endpoints.CreateAuthSession), "[PLATFORM] - AuthSessionCreation cannot be empty.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Endpoints.GetAuthSessionResult), "[PLATFORM] - GetAuthSessionResult cannot be empty.")
            .Validate(options => options.PollIntervalMs > 0, "[PLATFORM] - PollIntervalMs must be greater than zero.")
            .Validate(options => options.TimeoutSeconds > 0, "[PLATFORM] - TimeOutSeconds must be greater than zero.")
            .ValidateOnStart();

        services
            .AddOptions<BrokerOptions>()
            .Bind(configuration.GetSection($"Brokers:{BrokerName}"));

        switch (BrokerName.Trim().ToUpperInvariant())
        {
            case "UPSTOX":
                services.AddHttpClient<IBrokerAuthenticator, UpstoxAuthenticator>((sp, client) =>
                {
                    var options = sp.GetRequiredService<IOptions<CoreXServerOptions>>().Value;

                    if (!Uri.TryCreate(options.BaseUri, UriKind.Absolute, out var baseUri) || baseUri.Scheme != Uri.UriSchemeHttps)
                        throw new InvalidOperationException("[PLATFORM] - Invalid CoreX Server Base URI");
                    
                    client.BaseAddress = baseUri;
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                });

                services.AddHttpClient<IBroker, Upstox>((sp, client) =>
                {
                    var options = sp.GetRequiredService<IOptions<BrokerOptions>>().Value;

                    if (!Uri.TryCreate(options.BaseUri, UriKind.Absolute, out var baseUri) || baseUri.Scheme != Uri.UriSchemeHttps)
                        throw new InvalidOperationException("[PLATFORM] - Invalid Broker Base URI");

                    client.BaseAddress = baseUri;
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                });
                break;

            default:
                throw new NotSupportedException($"[PLATFORM] - Broker '{BrokerName}' is not supported.");
        }
    }
}