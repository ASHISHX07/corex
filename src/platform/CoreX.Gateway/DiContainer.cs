using System.Buffers.Text;

namespace CoreX.Gateway;

internal static class CoreXDi
{
    internal static void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        string BrokerName = configuration["ActiveBroker"]?.Trim() ?? 
            throw new InvalidOperationException("[PLATFORM] - Failed to get Broker name.");

        if (string.IsNullOrWhiteSpace(BrokerName))
            throw new InvalidOperationException("[PLATFORM] - Broker name cannot be empty.");

        // Public configuration
        services
            .AddOptions<CoreXServerOptions>()
            .Bind(configuration.GetSection("CoreXServer"))
            .Validate(options => 
                Uri.TryCreate(options.BaseUri, UriKind.Absolute, out var CoreXServerBaseUri) &&
                CoreXServerBaseUri.Scheme == Uri.UriSchemeHttp,
                "Invalid CoreX server base uri")
            .Validate(options => !string.IsNullOrWhiteSpace(options.AuthSessionCreation), "AuthSessionCreation cannot be empty.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.GetAuthSessionResult), "GetAuthSessionResult cannot be empty.")
            .Validate(options => options.PollIntervalMs > 0, "PollIntervalMs must be greater than zero.")
            .Validate(options => options.TimeOutSeconds > 0, "TimeOutSeconds must be greater than zero.")
            .ValidateOnStart();

        services
            .AddOptions<BrokerOptions>()
            .Bind(configuration.GetSection($"Brokers:{BrokerName}"));

        switch (BrokerName.ToUpperInvariant())
        {
            case "UPSTOX":
                services.AddHttpClient<IBrokerAuthenticator, UpstoxAuthenticator>((sp, client) =>
                {
                    var options = sp.GetRequiredService<IOptions<CoreXServerOptions>>().Value;

                    if (!Uri.TryCreate(options.BaseUri, UriKind.Absolute, out var baseUri) || baseUri.Scheme != Uri.UriSchemeHttps)
                        throw new InvalidOperationException("[PLATFORM] - Invalid CoreX Server Base URI");
                    
                    client.BaseAddress = baseUri;
                    client.Timeout = TimeSpan.FromSeconds(options.TimeOutSeconds);
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                });
                break;

            default:
                throw new NotSupportedException($"[PLATFORM] - Broker '{BrokerName}' is not supported.");
        }
    }
}