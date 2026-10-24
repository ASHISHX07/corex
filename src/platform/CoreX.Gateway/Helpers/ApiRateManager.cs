namespace CoreX.Gateway.Helpers;

[JsonSourceGenerationOptions(WriteIndented = true, IndentSize = 4)]
[JsonSerializable(typeof(ApiManager))]
internal partial class ApiManagerSerializerContext : JsonSerializerContext
{
}

internal class ApiManager
{
    // Backing fields for Interlocked to use
    private int _dataPolls = default;
    private int _orderPolls = default;

    public int DataPolls => _dataPolls;
    public int OrderPolls => _orderPolls;

    // [JsonConstructor]
    public ApiManager()
    {

    }

    public int DataPoll
    {
        get
        {
            return _dataPolls;
        }

        set
        {
            
        }
    }

    // Interlocked guarantees thread-safety across multiple threads
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