namespace CoreX.Gateway.Helpers;

internal static class Logger
{
    private static readonly string _systemLogPath = Path.Combine(Fs.SystemLogsPath, $"{Date.GetDate():dd-MM-yyyy}.log");
    private static readonly string _networkLogPath = Path.Combine(Fs.NetworkLogsPath, $"{Date.GetDate():dd-MM-yyyy}.log");

    private static FileStreamOptions _options = new()
    {
        Mode = FileMode.Append,
        Access = FileAccess.Write,
        Share = FileShare.Read,
        Options = FileOptions.Asynchronous | FileOptions.SequentialScan
    };

    private static readonly StreamWriter _systemLogWriterStream = new(_systemLogPath, Encoding.UTF8, _options)
    {
        AutoFlush = true
    };

    private static readonly StreamWriter _networkLogWriterStream = new(_networkLogPath, Encoding.UTF8, _options)
    {
        AutoFlush = true
    };

    public static async Task WriteSystemLogAsync(string component, string content) =>
        await _systemLogWriterStream.WriteLineAsync($"{Time.GetTime().GetLocalNow()} - [{component}]{Environment.NewLine}{content}");

    public static async Task WriteNetworkLogAsync(string component, string content) =>
        await _networkLogWriterStream.WriteLineAsync($"{Time.GetTime().GetLocalNow()} - [{component}]{Environment.NewLine}{content}");

    public static async Task CloseAsync()
    {
        await _systemLogWriterStream.DisposeAsync();
        await _networkLogWriterStream.DisposeAsync();
    }
}