namespace CoreX.Gateway.Brokers;

internal class Upstox(HttpClient httpClient, IBrokerAuthenticator brokerAuthenticator, IOptions<BrokerOptions> config) : IBroker
{
    private readonly BrokerOptions _brokerOptions = config.Value;
    private readonly HttpClient _httpclient = httpClient;
    private Session? _session;
    private UpstoxProfileInfo? _profileInfo;

    public async Task LoginAsync(CancellationToken cancellationToken = default)
    {
        var (statusCode, profile) = await TryGetProfileInfoAsync(cancellationToken);

        if (statusCode == HttpStatusCode.OK && profile is not null)
        {
            _profileInfo = profile;
        }
        else
        {
            if (statusCode is not null && statusCode != HttpStatusCode.Unauthorized)
            {
                throw new HttpRequestException($"[PLATFORM] - Failed to retrieve Upstox profile. HTTP {(int)statusCode}", null, statusCode);
            }

            await brokerAuthenticator.AuthenticateAsync(cancellationToken);
            var (newStatusCode, newProfile) = await TryGetProfileInfoAsync(cancellationToken);

            if (newStatusCode != HttpStatusCode.OK || newProfile is null)
            {
                throw new InvalidOperationException(
                    "[PLATFORM] - Failed to validate newly acquired Upstox token");
            }

            _profileInfo = newProfile;
        }

        AccountValidator();
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"Logged in as: {_profileInfo.Data.Username}");
        Console.ResetColor();
    }

    public async Task<(HttpStatusCode? StatusCode, UpstoxProfileInfo? Profile)> TryGetProfileInfoAsync(CancellationToken cancellationToken = default)
    {
        _session = await CacheHandler.ReadSessionAsync(cancellationToken);

        if (_session is null)
            return (null, null);

        _httpclient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _session.Value.Token);

        using var response = await _httpclient.GetAsync(_brokerOptions.Endpoints.UserProfile, cancellationToken);

        if (!response.IsSuccessStatusCode)
            return (response.StatusCode, null);

        var profile = await response.Content.ReadFromJsonAsync(UpstoxResponseJsonContext.Default.UpstoxProfileInfo, cancellationToken)
            ?? throw new JsonException("[PLATFORM] - Upstox returned an empty/invalid profile response");

        return (response.StatusCode, profile);
    }

    private void AccountValidator()
    {
        if (_profileInfo is null)
            throw new InvalidOperationException("[PLATFORM] - no upstox account info available");

        if (!_profileInfo.Data.IsActive)
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account is not active");
        }
        else if (!_profileInfo.Data.Exchanges.Contains("NSE")
            || !_profileInfo.Data.Exchanges.Contains("BSE")
            || !_profileInfo.Data.Exchanges.Contains("NFO")
            || !_profileInfo.Data.Exchanges.Contains("BFO")
            )
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account lacks one of the listed exchanges\n\tNSE, BSE, NFO, BFO\n\tBefore proceeding please ensure this segments are enabled in your upstox account");
        }
        else if (!_profileInfo.Data.Products.Contains("D")
            || !_profileInfo.Data.Products.Contains("I")
            || !_profileInfo.Data.Products.Contains("CO")
            || !_profileInfo.Data.Products.Contains("OCO"))
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account lacks one of the listed products\n\tDelivery, Cover Order, Intraday, OCO\n\tBefore proceeding please ensure this products are enabled in your upstox account");
        }
        else if (!_profileInfo.Data.OrderTypes.Contains("MARKET")
            || !_profileInfo.Data.OrderTypes.Contains("LIMIT")
            || !_profileInfo.Data.OrderTypes.Contains("SL")
            || !_profileInfo.Data.OrderTypes.Contains("SL-M"))
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account lacks one of the listed order types\n\tMARKET, LIMIT, SL, SL-M\n\tBefore proceeding please ensure this order types are enabled in your upstox account");
        }
        else return;
    }
}
