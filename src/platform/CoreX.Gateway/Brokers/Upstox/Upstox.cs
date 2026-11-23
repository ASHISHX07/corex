namespace CoreX.Gateway.Brokers;

internal class Upstox(
    HttpClient httpClient,
    IBrokerAuthenticator brokerAuthenticator,
    IOptions<BrokerOptions> brokerConfig,
    ILogger<Upstox> logger) : IBroker
{
    private readonly BrokerOptions _brokerOptions = brokerConfig.Value;
    private readonly HttpClient _httpclient = httpClient;
    private Session? _session;
    private UpstoxProfileInfo? _profileInfo;
    private static string _upstoxCachePath = Path.Combine(Fs.CachePath, "upstox");

    // ---------- ACCOUNT RELATED --------------------------------------------------
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

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("[PLATFORM] - Logged in as {Username}", _profileInfo.Data.Username);
        }

        await GetOptionInstrumentsAsync(cancellationToken);
        var stream = new UpstoxMarketDataStreams(_httpclient, _brokerOptions);

        await stream.QuoteStreamAsync(["NSE_EQ|INE848E01016"], cancellationToken);
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

        if (!profile.Data.IsActive)
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account is not active");
        }
        else if (!profile.Data.Exchanges.Contains("NSE")
            || !profile.Data.Exchanges.Contains("BSE")
            || !profile.Data.Exchanges.Contains("NFO")
            || !profile.Data.Exchanges.Contains("BFO")
            )
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account lacks one of the listed exchanges\n\tNSE, BSE, NFO, BFO\n\tBefore proceeding please ensure this segments are enabled in your upstox account");
        }
        else if (!profile.Data.Products.Contains("D")
            || !profile.Data.Products.Contains("I")
            || !profile.Data.Products.Contains("CO")
            || !profile.Data.Products.Contains("OCO"))
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account lacks one of the listed products\n\tDelivery, Cover Order, Intraday, OCO\n\tBefore proceeding please ensure this products are enabled in your upstox account");
        }
        else if (!profile.Data.OrderTypes.Contains("MARKET")
            || !profile.Data.OrderTypes.Contains("LIMIT")
            || !profile.Data.OrderTypes.Contains("SL")
            || !profile.Data.OrderTypes.Contains("SL-M"))
        {
            throw new InvalidOperationException("[PLATFORM] - Your upstox account lacks one of the listed order types\n\tMARKET, LIMIT, SL, SL-M\n\tBefore proceeding please ensure this order types are enabled in your upstox account");
        }

        return (response.StatusCode, profile);
    }

    public async Task<List<UpstoxOptionContracts>> GetOptionInstrumentsAsync(CancellationToken cancellationToken = default)
    {
        List<UpstoxOptionContracts> indexInstruments = new();

        foreach (string index in _brokerOptions.IndexInstrumentKeys.Distinct(StringComparer.Ordinal))
        {
            string cacheName = index.Replace("|", "-").Replace(" ", "");
            string path = Path.Combine(_upstoxCachePath, $"{cacheName}.option-contracts.json");
            var upstoxInstruments = await JsonHandler.ReadJsonAsync(path, UpstoxResponseJsonContext.Default.UpstoxOptionContracts, cancellationToken);

            if (upstoxInstruments is null || !DateOnly.FromDateTime(upstoxInstruments.SavedAt.LocalDateTime).IsSameDay())
            {
                string query = $"instrument_key={Uri.EscapeDataString(index)}";
                var uriBuilder = new UriBuilder(_httpclient.BaseAddress!)
                {
                    Path = _brokerOptions.Endpoints.OptionContracts,
                    Query = query
                };

                logger.LogInformation("[PLATFORM] - Getting upstox option contracts for {InstrumentKey}", index);

                using var response = await _httpclient.GetAsync(uriBuilder.Uri, cancellationToken);
                response.EnsureSuccessStatusCode();
                logger.LogInformation("[PLATFORM] - Retrieved upstox option contracts for {InstrumentKey}", index);

                var instruments = await response.Content.ReadFromJsonAsync(UpstoxResponseJsonContext.Default.UpstoxOptionContracts, cancellationToken);
                await JsonHandler.WriteJsonAsync(path, instruments, UpstoxResponseJsonContext.Default.UpstoxOptionContracts, cancellationToken);
                indexInstruments.Add(instruments!);
            }
            else
            {
                indexInstruments.Add(upstoxInstruments);
            }
        }

        return indexInstruments;
    }


}
