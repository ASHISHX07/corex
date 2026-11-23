namespace CoreX.Gateway.Brokers;

[JsonSourceGenerationOptions(JsonSerializerDefaults.Strict),
    JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
[JsonSerializable(typeof(UpstoxProfileInfo))]
[JsonSerializable(typeof(UpstoxProfileInfo.UserData))]
[JsonSerializable(typeof(UpstoxOptionContracts))]
[JsonSerializable(typeof(UpstoxOptionContracts.Contract))]
[JsonSerializable(typeof(UpstoxMarketQuoteResponse))]
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

internal sealed record UpstoxOptionContracts(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("data")] List<UpstoxOptionContracts.Contract> Contracts
)
{
    [property: JsonPropertyName("saved_at")]
    public DateTimeOffset SavedAt { get; set; } = Time.GetTime().GetLocalNow();

    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Skip)]
    internal sealed record Contract(
        [property: JsonPropertyName("instrument_key")] string InstrumentKey,
        [property: JsonPropertyName("expiry")] DateOnly Expiry,
        [property: JsonPropertyName("weekly")] bool IsWeekly,
        [property: JsonPropertyName("instrument_type")] string InstrumentType,
        [property: JsonPropertyName("strike_price")] decimal StrikePrice
    );
}

internal sealed record UpstoxMarketQuoteResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("data")] Dictionary<string, UpstoxMarketQuoteResponse.InstrumentQuote> InstrumentData
)
{
    internal sealed record InstrumentQuote(
        [property: JsonPropertyName("instrument_token")] string InstrumentToken,
        [property: JsonPropertyName("ohlc")] OhlcData? Ohlc = null,
        [property: JsonPropertyName("depth")] DepthData? Depth = null,
        [property: JsonPropertyName("timestamp")] string? Timestamp = null,
        [property: JsonPropertyName("symbol")] string? Symbol = null,
        [property: JsonPropertyName("last_price")] double? Ltp = null,
        [property: JsonPropertyName("volume")] long? Volume = null,
        [property: JsonPropertyName("average_price")] double? AvgPrice = null,
        [property: JsonPropertyName("oi")] double? Oi = null,
        [property: JsonPropertyName("net_change")] double? Change = null,
        [property: JsonPropertyName("total_buy_quantity")] double? TotalBuyQty = null,
        [property: JsonPropertyName("total_sell_quantity")] double? TotalSellQty = null,
        [property: JsonPropertyName("lower_circuit_limit")] double? LowerCircuit = null,
        [property: JsonPropertyName("upper_circuit_limit")] double? UpperCircuit = null,
        [property: JsonPropertyName("last_trade_time"), JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] long? LastTradedTime = null,
        [property: JsonPropertyName("oi_day_high")] double? OiDayHigh = null,
        [property: JsonPropertyName("oi_day_low")] double? OiDayLow = null,
        [property: JsonPropertyName("prev_close_price")] double? PrevClose = null,
        [property: JsonPropertyName("year_high")] double? YearHigh = null,
        [property: JsonPropertyName("year_low")] double? YearLow = null,
        [property: JsonPropertyName("previous_oi")] double? PrevOi = null,
        [property: JsonPropertyName("indicative_equilibrium_price")] double? IEP = null,
        [property: JsonPropertyName("reference_price")] double? ReferencePrice = null,
        [property: JsonPropertyName("indicative_equilibrium_quantity")] int? IEQ = null,
        [property: JsonPropertyName("indicative_imbalance_quantity_total")] int? IIQT = null,
        [property: JsonPropertyName("indicative_imbalance_quantity_market")] int? IIQM = null,
        [property: JsonPropertyName("cas_eligible")] bool? CasEligible = null
    );

    internal sealed record OhlcData(
        [property: JsonPropertyName("open")] double? Open = null,
        [property: JsonPropertyName("high")] double? High = null,
        [property: JsonPropertyName("low")] double? Low = null,
        [property: JsonPropertyName("close")] double? Close = null,
        [property: JsonPropertyName("volume")] long? Volume = null,
        [property: JsonPropertyName("ts")] long? TimeStamp = null
    );

    internal sealed record DepthData(
        [property: JsonPropertyName("buy")] OrderBookEntry[]? Buy = null,
        [property: JsonPropertyName("sell")] OrderBookEntry[]? Sell = null
    );

    internal sealed record OrderBookEntry(
        [property: JsonPropertyName("quantity")] int Quantity,
        [property: JsonPropertyName("price")] double Price,
        [property: JsonPropertyName("orders")] int Orders
    );
}
