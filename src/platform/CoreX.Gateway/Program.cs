//using FyersCSharpSDK;
//using System.Security.AccessControl;

//namespace CoreX.Gateway;

internal class CoreXPlatfrom
{
    internal static async Task<int> Main()
    {
    
        Console.WriteLine("CoreX Starting...");

        Fs.Init();
        return 0;
    }
}



// using System.Diagnostics;
// using System.Net;
// using System.Security.Cryptography;
// using System.Text;
// using System.Net.Http.Json;

// const string ClientId = "AppId";
// const string SecretKey = "Secret";
// const string RedirectUri = "http://127.0.0.1:3000/callback";

// using var listener = new HttpListener();

// listener.Prefixes.Add(
//     "http://127.0.0.1:3000/callback/"
// );

// listener.Start();

// Console.WriteLine("[AUTH] Callback server started.");
// Console.WriteLine("[AUTH] Waiting for FYERS login...");


// // ------------------------------------------------------------
// // Build FYERS login URL
// // ------------------------------------------------------------

// var parameters = new Dictionary<string, string>
// {
//     ["client_id"] = ClientId,
//     ["redirect_uri"] = RedirectUri,
//     ["response_type"] = "code",
//     ["state"] = "corex"
// };

// string query = string.Join(
//     "&",
//     parameters.Select(
//         x =>
//             $"{Uri.EscapeDataString(x.Key)}=" +
//             $"{Uri.EscapeDataString(x.Value)}"
//     )
// );

// string loginUrl =
//     $"https://api-t1.fyers.in/api/v3/generate-authcode?{query}";


// // ------------------------------------------------------------
// // Open browser
// // ------------------------------------------------------------

// Console.WriteLine("[AUTH] Opening browser...");

// Process.Start(new ProcessStartInfo
// {
//     FileName = loginUrl,
//     UseShellExecute = true
// });


// // ------------------------------------------------------------
// // Wait for FYERS redirect
// // ------------------------------------------------------------

// Console.WriteLine("[AUTH] Waiting for callback...");

// HttpListenerContext context =
//     await listener.GetContextAsync();


// // ------------------------------------------------------------
// // Read callback parameters
// // ------------------------------------------------------------

// string? authCode =
//     context.Request.QueryString["auth_code"];

// string? status =
//     context.Request.QueryString["s"];

// Console.WriteLine($"[AUTH] Status: {status}");


// // ------------------------------------------------------------
// // Validate callback
// // ------------------------------------------------------------

// if (string.IsNullOrWhiteSpace(authCode) ||
//     status != "ok")
// {
//     Console.WriteLine("[AUTH] Authentication failed.");

//     string html = """
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <title>CoreX</title>
//         </head>
//         <body>
//             <h1>✗ Authentication Failed</h1>
//             <p>CoreX did not receive a valid authorization code.</p>
//             <p>You can close this window.</p>
//         </body>
//         </html>
//         """;

//     byte[] bytes =
//         Encoding.UTF8.GetBytes(html);

//     context.Response.ContentType =
//         "text/html; charset=utf-8";

//     context.Response.ContentLength64 =
//         bytes.Length;

//     await context.Response.OutputStream
//         .WriteAsync(bytes);

//     context.Response.Close();

//     return;
// }


// // ------------------------------------------------------------
// // Success
// // ------------------------------------------------------------

// Console.WriteLine("[AUTH] Authorization code received.");
// Console.WriteLine($"[AUTH] Code: {authCode}");

// string successHtml = """
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <title>CoreX</title>
//     </head>
//     <body>
//         <h1>✓ CoreX Authentication Successful</h1>
//         <p>Authorization code received successfully.</p>
//         <p>You can close this window.</p>
//     </body>
//     </html>
//     """;

// byte[] successBytes =
//     Encoding.UTF8.GetBytes(successHtml);

// context.Response.ContentType =
//     "text/html; charset=utf-8";

// context.Response.ContentLength64 =
//     successBytes.Length;

// await context.Response.OutputStream
//     .WriteAsync(successBytes);

// context.Response.Close();


// // ------------------------------------------------------------
// // Exchange auth code for access token
// // ------------------------------------------------------------

// using var http = new HttpClient();

// using var sha256 =
//     SHA256.Create();

// byte[] hashInput =
//     Encoding.UTF8.GetBytes(
//         $"{ClientId}:{SecretKey}"
//     );

// byte[] hash =
//     sha256.ComputeHash(hashInput);

// string appIdHash =
//     Convert.ToHexString(hash)
//         .ToLowerInvariant();

// var tokenPayload = new
// {
//     grant_type = "authorization_code",
//     appIdHash,
//     code = authCode
// };

// Console.WriteLine("[AUTH] Requesting access token...");

// HttpResponseMessage tokenResponse =
//     await http.PostAsJsonAsync(
//         "https://api-t1.fyers.in/api/v3/validate-authcode",
//         tokenPayload
//     );

// string tokenJson =
//     await tokenResponse.Content.ReadAsStringAsync();

// Console.WriteLine();
// Console.WriteLine("========== FYERS RESPONSE ==========");
// Console.WriteLine(tokenJson);
// Console.WriteLine("====================================");
