namespace CoreX.Gateway.Timers;

internal static class Date
{
    private static DateOnly CurrentDate => DateOnly.FromDateTime(DateTimeOffset.UtcNow.DateTime);

    public static DateOnly GetDate() => CurrentDate;

    public static bool IsSameDay(this DateOnly dateOnly) =>
        dateOnly == CurrentDate;
}

internal static class Time
{
    private static readonly TimeProvider _time = TimeProvider.System;

    public static TimeProvider GetTime() => _time;
    public static long GetUnixEpochMs() => _time.GetUtcNow().ToUnixTimeMilliseconds();
}
