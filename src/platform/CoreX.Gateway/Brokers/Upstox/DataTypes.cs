namespace CoreX.Gateway.Brokers;

[JsonSourceGenerationOptions(JsonSerializerDefaults.Strict)]
[JsonSerializable(typeof(UpstoxProfileInfo))]
[JsonSerializable(typeof(UpstoxProfileInfo.UserData))]
internal partial class UpstoxResponseJsonContext : JsonSerializerContext
{
}

internal sealed record UpstoxProfileInfo(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("data")] UpstoxProfileInfo.UserData Data
)
{
    internal sealed record UserData(
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("exchanges")] string[] Exchanges,
        [property: JsonPropertyName("products")] string[] Products,
        [property: JsonPropertyName("broker")] string Broker,
        [property: JsonPropertyName("user_id")] string UserId,
        [property: JsonPropertyName("user_name")] string Username,
        [property: JsonPropertyName("order_types")] string[] OrderTypes,
        [property: JsonPropertyName("user_type")] string UserType,
        [property: JsonPropertyName("poa")] bool? Poa,
        [property: JsonPropertyName("ddpi")] bool IsDdpiActivated,
        [property: JsonPropertyName("is_active")] bool IsActive
    );
}