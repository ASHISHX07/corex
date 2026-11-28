internal class UpstoxDataStreams(
    HttpClient httpClient,
    BrokerOptions brokerConfig
    //ILogger<Upstox> logger
    ) : IMarketDataStreams
{
    private UpstoxWSFeedV3 UpstoxWsClient = new(httpClient, brokerConfig);

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
        throw new NotImplementedException();
    }
}

internal class UpstoxWSFeedV3(HttpClient httpClient, BrokerOptions brokerConfig)
{
    
    internal async Task GetWSDataFeedClientAsync(CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetByteArrayAsync(brokerConfig.Endpoints.WsFeedAuthEndpoint, cancellationToken);
        string? WsDataFeedUri = ExtractRedirectUri(response);

        if (string.IsNullOrEmpty(WsDataFeedUri))
        {
            throw new InvalidOperationException("[PLATFORM] - Failed to get Websocket authorized redirect Uri");
        }

        using ClientWebSocket socket = new();
        await socket.ConnectAsync(new Uri(WsDataFeedUri), cancellationToken);
    }

    internal async Task GetWsPortfolioFeedAsync(CancellationToken cancellationToken = default)
    {
        var response = await httpClient.GetByteArrayAsync(brokerConfig.Endpoints.WsPortfolioFeedAuthEndpoint, cancellationToken);
        string? WsPortfolioFeedUri = ExtractRedirectUri(response);

        using ClientWebSocket socket = new();
    }

    private string? ExtractRedirectUri(ReadOnlySpan<byte> utf8Json)
    {
        var reader = new Utf8JsonReader(utf8Json);
        while(reader.Read())
        {
            if (reader.TokenType == JsonTokenType.PropertyName &&
                reader.ValueTextEquals("authorized_redirect_uri"u8))
            {
                if (reader.Read() && reader.TokenType == JsonTokenType.String) return reader.GetString();
            }
        }
        return null;
    }
}