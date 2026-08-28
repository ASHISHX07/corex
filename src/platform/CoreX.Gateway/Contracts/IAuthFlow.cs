namespace CoreX.Gateway.Contracts;

internal interface IBrokerAuth
{
    /// <summary>Full login URL to open in the browser</summary>
    /// <returns>string: URL</returns>
    string BuildLoginUrl();

    /// <summary>Extract the one time code from the URL</summary>
    /// <param name="redirectUrl">The target URL string from which to extract the code</param>
    /// <returns>string: Authcode/code</returns>
    string ExtractCodeFromRedirect(in string redirectUrl);

    /// <summary>Exchange code for access token</summary>
    /// <param name="code">Extracted Authcode/code</param>
    /// <returns>string: Access-Token/Token</returns>
    Task<string> ExchangeCodeForTokenAsync(in string code);

    /// <summary>Build the authorization header value for API calls</summary>
    /// <param name="accessToken">Access-Token/Token</param>
    /// <returns>string: authorization header</returns>
    string BuildAuthHeader(in string accessToken);

    /// <summary>Check if cached token is still valid</summary>
    /// <param name="accessToken">Access-Token/Token</param>
    /// <returns>bool: true if valid, false otherwise</returns>
    Task<bool> ValidateTokenAsync(in string accessToken);
}