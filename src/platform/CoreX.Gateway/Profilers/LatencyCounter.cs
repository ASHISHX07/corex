namespace CoreX.Gateway.Profilers;

internal static class PerformanceProfiler
{
    private static long _start = default;
    internal enum Ticker : byte
    {
        Ticks,
        Milliseconds,
        Microseconds
    }

    [Conditional("PERF_PROFILE")]
    public static void StartTicker()
    {
        _start = default;
        _start = Stopwatch.GetTimestamp();
    }

    [Conditional("PERF_PROFILE")]
    public static void FinishTicker(Ticker ticker, bool logger = false)
    {
        TimeSpan stop = Stopwatch.GetElapsedTime(_start);

        long ticks = ticker switch
        {   
            Ticker.Ticks => stop.Ticks,
            Ticker.Milliseconds => (long)stop.TotalMilliseconds,
            Ticker.Microseconds => stop.Microseconds,
            _ => throw new ArgumentException("Invalid Ticker")
        };

        if (logger)
        {
            
        }
        
        Console.WriteLine($"[PROFILER]\n  Took - {ticks} Microseconds.");
    }
}