namespace CoreX.Gateway.Timers;

internal static class Timer
{
    private static long _start = default;
    public static TimeSpan Stop { get; set; } = default;
    public static DateTimeOffset dateTime = TimeProvider.System.GetLocalNow();

    public static void StartTimer()
    {
        _start = Stopwatch.GetTimestamp();
    }

    public static void StopTimer(bool saveLog = true)
    {
        Stop = Stopwatch.GetElapsedTime(_start);
        if (saveLog) Console.WriteLine(Stop);
    }
}
