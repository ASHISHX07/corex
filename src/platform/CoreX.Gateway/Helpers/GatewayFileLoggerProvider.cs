namespace CoreX.Gateway.Helpers;

internal sealed class GatewayFileLoggerProvider : ILoggerProvider
{
    private readonly object _writeLock = new();

    public ILogger CreateLogger(string categoryName)
    {
        bool isNetwork = categoryName.StartsWith("System.Net.Http.HttpClient.", StringComparison.Ordinal)
            || categoryName == "CoreX.Gateway.Network"
            || categoryName.StartsWith("CoreX.Gateway.Network.", StringComparison.Ordinal);

        return new FileLogger(this, categoryName, isNetwork ? Fs.NetworkLogsPath : Fs.SystemLogsPath);
    }

    // Log calls open and close their files, so the provider holds no file handles.
    public void Dispose() { }

    private void Append(string directory, DateTimeOffset timestamp, string entry)
    {
        string path = Path.Combine(directory, $"{timestamp:dd-MM-yyyy}.log");

        lock (_writeLock)
        {
            try
            {
                File.AppendAllText(path, entry);
            }
            catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
            {
                Console.Error.WriteLine($"Could not write to log file '{path}': {exception.Message}");
            }
        }
    }

    private sealed class FileLogger(GatewayFileLoggerProvider provider, string category, string directory) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => logLevel != LogLevel.None;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (!IsEnabled(logLevel))
                return;

            var timestamp = Time.GetTime().GetLocalNow();
            string entry = $"{timestamp:O} [{logLevel}] {category}[{eventId.Id}] {formatter(state, exception)}{Environment.NewLine}";
            if (exception is not null)
                entry += $"{exception}{Environment.NewLine}";

            provider.Append(directory, timestamp, entry);
        }
    }
}
