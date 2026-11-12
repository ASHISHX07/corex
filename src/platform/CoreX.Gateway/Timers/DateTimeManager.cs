namespace CoreX.Gateway.Timers;

internal static class Date
{
    private static DateOnly CurrentDate => DateOnly.FromDateTime(DateTimeOffset.UtcNow.DateTime);

    public static DateOnly GetDate()
    {
        return CurrentDate;
    }
}

internal static class Time
{
    private static readonly TimeProvider _time = TimeProvider.System;

    public static TimeProvider GetTime()
    {
        return _time;
    }
}
