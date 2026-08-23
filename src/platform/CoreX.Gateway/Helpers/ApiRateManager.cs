namespace CoreX.Gateway.Helpers;

internal class ApiManager
{
    // Backing fields for Interlocked to use
    private int _dataPolls = default;
    private int _orderPolls = default;

    public int DataPolls => _dataPolls;
    public int OrderPolls => _orderPolls;

    // Interlocked guarantees thread-safety across multiple CPU cores
    public void DApiCall() => Interlocked.Increment(ref _dataPolls);
    public void OApiCall() => Interlocked.Increment(ref _orderPolls);

    public void NewSession()
    {
        Interlocked.Exchange(ref _dataPolls, 0);
        Interlocked.Exchange(ref _orderPolls, 0);
    }

    public void CloseSession()
    {

    }
}