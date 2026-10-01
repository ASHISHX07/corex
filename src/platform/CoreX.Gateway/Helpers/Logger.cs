namespace CoreX.Gateway.Helpers;

internal static class Logger
{
    #pragma warning disable IDE0071
    private static readonly string _systemLogPath = Path.Combine(Fs.logs, @"system", $"{Timers.Timer.dateTime.ToString("dd-mm-yyyy")}.log");
    #pragma warning restore IDE0071

    public static void WriteSystem(string content)
    {
        File.AppendAllText(_systemLogPath, $"{content + Environment.NewLine}");
    }

}

internal static class SystemLogWriter
{
    private static readonly string _path = Path.Combine(Fs.logs, @"system");
    
    public static void Write(string content)
    {
        File.AppendAllText(_path, content);
    }
}

internal static class NetworkLogWriter
{
    
}