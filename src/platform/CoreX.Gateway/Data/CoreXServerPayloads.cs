namespace CoreX.Gateway.Data;

[JsonSourceGenerationOptions(
    JsonSerializerDefaults.Strict,
    WriteIndented = false,
    RespectRequiredConstructorParameters = true,
    RespectNullableAnnotations = true)]
[JsonSerializable(typeof(Credentials))]
[JsonSerializable(typeof(CoreXServerOptions))]
[JsonSerializable(typeof(CoreXServerOptions.CoreXServerEndpoints))]
[JsonSerializable(typeof(BrokerAuthPayload))]
[JsonSerializable(typeof(BrokerAuthPayload.BrokerCredentials))]
[JsonSerializable(typeof(BrokerAuthSessionResponse))]
[JsonSerializable(typeof(BrokerAuthSuccessResponse))]
[JsonSerializable(typeof(BrokerAuthSuccessResponse.TokenInfo))]
[JsonSerializable(typeof(BrokerAuthSuccessResponse.ProfileInfo))]
[JsonSerializable(typeof(CoreXServerError))]
[JsonSerializable(typeof(BrokerOptions))]
[JsonSerializable(typeof(BrokerOptions.BrokerEndpoints))]
internal partial class CoreXServerPayloadJsonContext : JsonSerializerContext
{
}

internal sealed record Credentials(string CoreXClientKey, string BrokerAppId, string BrokerAppSecret)
{
    public override string ToString() =>
        "Credentials { [REDACTED] }";
}

internal sealed class CoreXServerOptions
{
    public string BaseUri { get; set; } = string.Empty;
    public CoreXServerEndpoints Endpoints { get; set; } = new();
    public int PollIntervalMs { get; set; }
    public int TimeoutSeconds { get; set; }

    internal sealed class CoreXServerEndpoints
    {
        public string CreateAuthSession {  get; set; } = string.Empty;
        public string GetAuthSessionResult {  get; set; } = string.Empty;
    }
}

internal sealed record BrokerAuthPayload(
    [property: JsonPropertyName("broker")] string Broker,
    [property: JsonPropertyName("credentials")] BrokerAuthPayload.BrokerCredentials Credentials
)
{
    internal sealed record BrokerCredentials(
        [property: JsonPropertyName("appId")] string AppId,
        [property: JsonPropertyName("appSecret")] string AppSecret
    );
}

internal sealed record BrokerAuthSessionResponse(
    [property: JsonPropertyName("sessionId")] string SessionId,
    [property: JsonPropertyName("authorizationUrl")] string AuthorizationUrl,
    [property: JsonPropertyName("sessionExpiresAt")] string SessionExpiry
);

internal sealed record BrokerAuthSuccessResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("broker")] string Broker,
    [property: JsonPropertyName("token")] BrokerAuthSuccessResponse.TokenInfo Token,
    [property: JsonPropertyName("profile")] BrokerAuthSuccessResponse.ProfileInfo Profile
)
{
    internal sealed record TokenInfo(
        [property: JsonPropertyName("accessToken")] string AccessToken,
        [property: JsonPropertyName("tokenType")] string TokenType,
        [property: JsonPropertyName("tokenExpiresAt")] string TokenExpiry
    );

    internal sealed record ProfileInfo(
        [property: JsonPropertyName("userId")] string UserId,
        [property: JsonPropertyName("userName")] string Username,
        [property: JsonPropertyName("email")] string Email
    );
}

internal sealed record CoreXServerError(
    [property: JsonPropertyName("error")] string? Error,
    [property: JsonPropertyName("message")] string? Message
);

internal sealed record BrokerOptions
{
    public string BaseUri { get; set; } = string.Empty;
    public string[] IndexInstrumentKeys { get; set; } = [];
    public BrokerEndpoints Endpoints { get; set; } = new();
    public int ApiPollIntervalMs { get; set; }

    internal sealed class BrokerEndpoints
    {
        public string UserProfile { get; set; } = string.Empty;
        public string OptionContracts { get; set; } = string.Empty;
        public string GetQuotes { get; set; } = string.Empty;
    }
}