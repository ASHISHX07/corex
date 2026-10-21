namespace CoreX.Gateway.Brokers;

internal class Upstox
{
    
}

internal static class UpstoxHttpHandler : HttpHandler
{
    private static readonly HttpClient httpClient = new()
    {
        BaseAddress = new Uri("https://api.upstox.com/v3"),
        Timeout = TimeSpan.FromSeconds(120)
    };

    private static readonly Uri AuthEndpoint = new(httpClient.BaseAddress, "login/authorization/dialog");

    public override Task<HttpResponseMessage> GetReqAsync(CancellationToken cancellationToken)
    {

    }

    public override Task<HttpResponseMessage> PostReqAsync(CancellationToken cancellationToken)
    {

    }
}