internal class UpstoxDataStreams(
    HttpClient httpClient,
    BrokerOptions brokerConfig
    //ILogger<Upstox> logger
    ) : IMarketDataStreams
{
    public async Task GetQuoteAsync(string[] instruments, CancellationToken cancellationToken = default)
    {
        if (instruments.Length is < 1 or > 500)
            throw new ArgumentException("Upstox quotes require between 1 and 500 instruments per request.", nameof(instruments));

        string keys = string.Join(",", instruments.Select(Uri.EscapeDataString));
        string query = $"instrument_key={keys}";

        UriBuilder uriBuilder = new(brokerConfig.BaseUri)
        {
            Path = brokerConfig.Endpoints.GetQuotes,
            Query = query
        };

        using var response = await httpClient.GetAsync(uriBuilder.Uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var Quote = await response.Content.ReadFromJsonAsync(UpstoxResponseJsonContext.Default.UpstoxMarketQuoteResponse, cancellationToken);
    }

    public async Task QuoteStreamAsync(string[] instruments, CancellationToken cancellationToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(brokerConfig.ApiPollIntervalMs));

        do
        {
            await GetQuoteAsync(instruments, cancellationToken);
        }
        while (await timer.WaitForNextTickAsync(cancellationToken));
    }

    public async Task OptionChainPollStream(CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public async Task OptionChainWsStream(CancellationToken cancellationToken)
    {

    }
}

internal class UpstoxWSFeedv3(BrokerOptions brokerConfig)
{
    private readonly UriBuilder _wsDataFeedEndpointUri = new(brokerConfig.BaseUri)
    {
        Path = brokerConfig.Endpoints.WsFeedEndpoint
    };

    private readonly UriBuilder _wsPortfolioFeedUri = new(brokerConfig.BaseUri)
    {
        Path = brokerConfig.Endpoints.PortfolioFeedEndpoint
    };

    internal async Task WsDataFeedAsync()
    {
        using ClientWebSocket socket = new();
    }

    internal async Task WsPortfolioFeedAsync()
    {
        using ClientWebSocket socket = new();
    }
}