namespace CoreX.Gateway.Helpers;

internal static class Logger
{
    #pragma warning disable IDE0071
    private static readonly string _systemLogPath = Path.Combine(Fs.LogsPath, @"system", $"{Date.GetDate().ToString("DD-MM-YYYY")}.log");
    private static readonly string _networkLogPath = Path.Combine(Fs.LogsPath, @"network", $"{Date.GetDate().ToString("DD-MM-YYYY")}.log");
    #pragma warning restore IDE0071

    public static void WriteSystemLog(string content) =>
        File.AppendAllText(_systemLogPath, $"{content + Environment.NewLine}");

    public static void WriteNetworkLog(string content) =>
        File.AppendAllText(_networkLogPath, $"{content + Environment.NewLine}");
}