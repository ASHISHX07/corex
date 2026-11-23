namespace CoreX.Gateway.Contracts;

internal interface IMarketDataStreams
{
    Task GetQuoteAsync(string[] instruments, CancellationToken cancellationToken);
    Task QuoteStreamAsync(string[] instruments, CancellationToken cancellationToken);
    //Task OptionChainPollStream(CancellationToken cancellationToken);
    //Task OptionChainWsStream(CancellationToken cancellationToken);
}
