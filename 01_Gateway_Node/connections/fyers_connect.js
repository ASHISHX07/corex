import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import open from "open";
import { startAuthServer } from "./auth_server.js";
import { exchangeForToken } from "./token.js";
import { loadCacheToken, saveToken, clearSession } from "./session.js";
import getProfileInfo from "../account/profile_info.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const APP_ID = process.env.FYERS_APP_ID;
const APP_SECRET = process.env.FYERS_SECRET_ID;
const REDIRECT_URI = process.env.FYERS_REDIRECT_URL;
const PORT = process.env.PORT;

function buildLoginUrl() {
    const params = new URLSearchParams({
        client_id: APP_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        state: 'corex'
    })
    return `https://api-t1.fyers.in/api/v3/generate-authcode?${params.toString()}`;
}

async function runAuthFlow() {
    const serverPromise = startAuthServer(PORT);
    await open(buildLoginUrl());

    const auth_code = await serverPromise;
    const access_token = await exchangeForToken(APP_ID, APP_SECRET, auth_code);
    await saveToken(access_token);
    return access_token;
}

async function ensureAccessToken() {
    const cachedToken = await loadCacheToken();

    if (cachedToken) {
        const isValid = await getProfileInfo(APP_ID, cachedToken, true, true) ;

        if(isValid) {
            return cachedToken;
        }
        console.log('[AUTH] Cached token rejected by Fyers. Re-authenticating...');
        clearSession();
    }

    try {
        return await runAuthFlow();
    }
    catch (err) {
        console.log('[AUTH] Cached token rejected by Fyers. Re-authenticating...');
        clearSession();
    }
}

export {
    ensureAccessToken
}