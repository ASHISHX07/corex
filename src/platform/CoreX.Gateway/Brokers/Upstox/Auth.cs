namespace CoreX.Gateway.Brokers;

internal sealed class UpstoxAuthenticator(HttpClient httpClient, IOptions<CoreXServerOptions> serverOptions) : IBrokerAuthenticator
{
    private readonly string BrokerName = "upstox";
    private readonly HttpClient _httpclient = httpClient;
    private readonly CoreXServerOptions _serverOptions = serverOptions.Value;
    private readonly Credentials credentials = JsonHandler.ReadJson(Fs.CredentialPath, CoreXServerPayloadJsonContext.Default.Credentials) ??
            throw new NotSupportedException("[PLATFORM] - Failed to load credentials.");
    
    private string SessionId = string.Empty;

    public async Task AuthenticateAsync(CancellationToken cancellationToken = default)
    {
        _httpclient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", credentials.CoreXClientKey);

        var payload = new BrokerAuthPayload(
            Broker: BrokerName,
            Credentials: new BrokerAuthPayload.BrokerCredentials(
                AppId: credentials.BrokerAppId,
                AppSecret: credentials.BrokerAppSecret
            )
        );

        Console.WriteLine("[PLATFORM] - Upstox client authenticating...");

        using var response = await _httpclient.PostAsJsonAsync(
            _serverOptions.Endpoints.CreateAuthSession,
            payload,
            CoreXServerPayloadJsonContext.Default.BrokerAuthPayload,
            cancellationToken
        );

        if (response.IsSuccessStatusCode)
        {
            var sessionResponse = await response.Content.ReadFromJsonAsync(CoreXServerPayloadJsonContext.Default.BrokerAuthSessionResponse, cancellationToken) ??
                throw new NoNullAllowedException("[PLATFORM] - possibly null value in session response");

            SessionId = sessionResponse.SessionId;

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = sessionResponse?.AuthorizationUrl,
                    UseShellExecute = true
                });
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
                Process.Start("open", sessionResponse.AuthorizationUrl);
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                Process.Start("xdg-open", sessionResponse.AuthorizationUrl);
            else throw new PlatformNotSupportedException("[PLATFORM] - Unsupported platform\n\tSupported Platforms - Windows, MacOS, Linux");

            Console.WriteLine("[PLATFORM] - Waiting for server response...");
        }
        else
        {
            var sessionResponse = await response.Content.ReadFromJsonAsync(CoreXServerPayloadJsonContext.Default.CoreXServerError, cancellationToken) ??
                throw new NoNullAllowedException("[PLATFORM] - possibly null value in session response");

            throw new HttpRequestException($"[PLATFORM] - CoreX server error: {sessionResponse.Error}\n\t{sessionResponse.Message}");
        }

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_serverOptions.TimeoutSeconds));
        try
        {
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, cts.Token);
            using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(_serverOptions.PollIntervalMs));

            string SessionRetrievalEndpoint = _serverOptions.Endpoints.GetAuthSessionResult.Replace("<sessionId>", SessionId);

            while (await timer.WaitForNextTickAsync(linkedCts.Token))
            {
                using var message = await _httpclient.PostAsync(SessionRetrievalEndpoint, null, linkedCts.Token);

                if (message.StatusCode == HttpStatusCode.Accepted)
                    continue;

                if (!message.IsSuccessStatusCode)
                {
                    var error = await message.Content.ReadFromJsonAsync(CoreXServerPayloadJsonContext.Default.CoreXServerError, linkedCts.Token);
                    throw new HttpRequestException($"CoreX server error: {error?.Error}\n{error?.Message}", null, message.StatusCode);
                }

                var successResponse = await message.Content.ReadFromJsonAsync(CoreXServerPayloadJsonContext.Default.BrokerAuthSuccessResponse, linkedCts.Token) ??
                    throw new JsonException("[PLATFORM] - Invalid authentication response");

                var token = successResponse.Token.AccessToken;

                if (string.IsNullOrWhiteSpace(token))
                    throw new JsonException("[PLATFORM] - Authentication response contains no access token");

                Session session = new()
                {
                    Broker = BrokerName,
                    Token = token,
                    SavedAt = Time.GetTime().GetLocalNow().ToString("dd-MM-yyyy h:mm:ss tt")
                };

                await CacheHandler.WriteSessionAsync(session, linkedCts.Token);

                return;
            }
        }
        catch (OperationCanceledException) when (cts.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException("[AUTHENTICATION] - Authentication timed out");
        }
    }
}