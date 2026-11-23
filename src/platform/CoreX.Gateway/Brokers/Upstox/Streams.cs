namespace CoreX.Gateway.Brokers;

internal class UpstoxMarketDataStreams(
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

        UriBuilder uriBuilder = new(httpClient.BaseAddress!)
        {
            Path = brokerConfig.Endpoints.GetQuotes,
            Query = query
        };

        using var response = await httpClient.GetAsync(uriBuilder.Uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var Quote = await response.Content.ReadFromJsonAsync(UpstoxResponseJsonContext.Default.UpstoxMarketQuoteResponse, cancellationToken);
        Console.WriteLine(Quote?.InstrumentData.Values);
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
}
