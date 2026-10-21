namespace CoreX.Gateway.Contracts;

internal abstract class BaseHttpClient
{
    protected readonly HttpClient httpClient;

    protected BaseHttpClient(HttpClient client)
    {
        httpClient = client ?? throw new ArgumentNullException(nameof(client));
    }
}
