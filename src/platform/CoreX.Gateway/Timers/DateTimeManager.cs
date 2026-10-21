namespace CoreX.Gateway.Timers;

internal static class Date
{
    private static DateOnly _date = new DateOnly();

    public static DateOnly GetDate()
    {
        return _date;
    }
}

internal static class Time
{
    private static TimeProvider _time = TimeProvider.System;

    public static TimeProvider GetTime()
    {
        return _time;
    }
}
