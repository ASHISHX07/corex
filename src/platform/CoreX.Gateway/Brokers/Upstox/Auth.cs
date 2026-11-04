namespace CoreX.Gateway.Brokers;

internal sealed class UpstoxAuthenticator(HttpClient httpClient, IOptions<CoreXServerOptions> options) : IBrokerAuthenticator
{
    private readonly HttpClient _httpclient = httpClient;
    private readonly CoreXServerOptions _options = options.Value;

    private readonly Credentials? credentials = JsonHandler.ReadJson<Credentials>(Fs.CredentialPath, CredentialsJsonSerializerContext.Default);

    public async Task<string> AuthenticateAsync(CancellationToken cancellationToken = default)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, new Uri(_httpclient.BaseAddress!, _options.AuthSessionCreation));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "");

        throw new NotImplementedException();
    }
}