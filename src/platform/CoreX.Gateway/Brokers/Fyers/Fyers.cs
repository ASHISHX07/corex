using FyersCSharpSDK;
using HyperSyncLib;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace CoreX.Gateway.Brokers;

internal class Fyers
{
    const string ClientId = "QSXMT8C3KC-100";
    const string SecretId = "ATF24JBJDH";
    const string RedirectUri = "http://127.0.0.1:3000/callback";

    static string BuildLoginUrl()
    {
        var parameters = new Dictionary<string, string>
        {
            ["client_id"] = ClientId,
            ["redirect_uri"] = RedirectUri,
            ["response_type"] = "code",
            ["state"] = "CoreX"
        };

        string query = string.Join(
            "&",
            parameters.Select(x => $"{Uri.EscapeDataString(x.Key)}={Uri.EscapeDataString(x.Value)}")
        );

        return $"https://api-t1.fyers.in/api/v3/generate-authcode?{query}";
    }
}