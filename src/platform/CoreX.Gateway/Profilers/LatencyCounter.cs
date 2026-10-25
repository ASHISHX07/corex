namespace CoreX.Gateway.Profilers;

internal static class PerformanceProfiler
{
    private static readonly string ProfilerLogFilePath = Path.Combine(Fs.ProfilerLogsPath, $"{Date.GetDate():dd-MM-yyyy}.log");

    private static readonly FileStreamOptions _options = new()
    {
        Mode = FileMode.Append,
        Access = FileAccess.Write,
        Share = FileShare.Read,
        Options = FileOptions.Asynchronous | FileOptions.SequentialScan
    };

    private static readonly StreamWriter ProfilerLogWriter = new(ProfilerLogFilePath, Encoding.UTF8, _options)
    {
        AutoFlush = true,
    };
    
    private static long _start = default;
    internal enum Ticker : byte
    {
        Ticks,
        Microseconds,
        Milliseconds
    }

    [Conditional("PERF_PROFILE")]
    public static void StartTicker()
    {
        Console.ForegroundColor = ConsoleColor.Blue;
        Console.WriteLine("[PROFILER] - Start");
        Console.ResetColor();

        _start = default;
        _start = Stopwatch.GetTimestamp();
    }

    [Conditional("PERF_PROFILE")]
    public static void FinishTicker(Ticker ticker = Ticker.Milliseconds)
    {
        TimeSpan stop = Stopwatch.GetElapsedTime(_start);

        long ticks = ticker switch
        {   
            Ticker.Ticks => stop.Ticks,
            Ticker.Microseconds => (long)stop.TotalMicroseconds,
            Ticker.Milliseconds => (long)stop.TotalMilliseconds,
            _ => throw new ArgumentException("Invalid Ticker")
        };
        
        Console.ForegroundColor = ConsoleColor.Blue;
        Console.WriteLine($"[PROFILER] - Finish\n    Took - {ticks} {ticker}.");
        Console.ResetColor();
    }

    [Conditional("PERF_PROFILE")]
    public static void FinishTicker(string component, Ticker ticker = Ticker.Milliseconds)
    {
        TimeSpan stop = Stopwatch.GetElapsedTime(_start);

        long ticks = ticker switch
        {   
            Ticker.Ticks => stop.Ticks,
            Ticker.Microseconds => (long)stop.TotalMicroseconds,
            Ticker.Milliseconds => (long)stop.TotalMilliseconds,
            _ => throw new ArgumentException("Invalid Ticker")
        };
        
        Console.ForegroundColor = ConsoleColor.Blue;
        Console.WriteLine($"[PROFILER] - Finish\n    Took - {ticks} {ticker}.");
        Console.ResetColor();

        ProfilerLogWriter.WriteLineAsync($"[{component}]        - {ticks} {ticker}");
    }

    public static async Task Close()
    {
        await ProfilerLogWriter.DisposeAsync();
    }
}