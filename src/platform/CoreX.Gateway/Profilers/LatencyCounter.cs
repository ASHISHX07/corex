namespace CoreX.Gateway.Profilers;

internal static class PerformanceProfiler
{
    private static long start = default;

    [Conditional("PERF_PROFILE")]
    public static void StartMonitoring()
    {
        start = Stopwatch.GetTimestamp();
    }

    [Conditional("PERF_PROFILE")]
    public static void StopMonitoring(bool saveLog = false)
    {
        if (saveLog)
        {
            
        }
        Console.WriteLine($"[PROFILER]\n  Took - {Stopwatch.GetElapsedTime(start)}");
    }
}