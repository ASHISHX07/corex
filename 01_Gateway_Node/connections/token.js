import crypto from 'node:crypto';

function generateAppIdHash(appId, appSecret) {
    return crypto
        .createHash('sha256')
        .update(`${appId}:${appSecret}`)
        .digest('hex');
}

export async function exchangeForToken(appId, appSecret, authCode) {
    const appIdHash = generateAppIdHash(appId, appSecret);

    const response = await fetch('https://api-t1.fyers.in/api/v3/validate-authcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            appIdHash,
            code: authCode
        })
    });

    if (!response.ok) {
        throw new Error(`[AUTH] Token exchange HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.s !== 'ok' || !data.access_token) {
        throw new Error(`[AUTH] Token exchange failed: ${data.message || JSON.stringify(data)}`);
    }

    console.log('[AUTH] Access token received successfully.');
    return data.access_token;

}