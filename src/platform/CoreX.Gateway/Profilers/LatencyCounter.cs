namespace CoreX.Gateway.Profilers;

#if DEBUG
internal static class DebugProfiler
{
    static long start = Stopwatch.GetTimestamp();

    [Conditional("DEBUG")]
    public static void StartMonitoring()
    {
        
    }
}
#endif