import { fyersModel } from 'fyers-api-v3'
import { fileURLToPath } from 'url';
import path from 'path';
import { safeMkdir } from '../helpers/fs.helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, '../../runtime/logs/depth-poll');

/**
 * Polls Fyers option depth API at a fixed interval.
 * Returns depth with OHLCV data.
 *
 * @param {string} appId
 * @param {string} accessToken
 * @param {apiManager} apiManagerInstance   - call counter instance from index.js
 * @param {function} onData                 - callback(data) called on each successful poll
 * @param {number} interval                 - ms between polls, default 5000
 */

async function depthPoll(appId, accessToken, symbol, apiManagerInstance, onData, interval = 5000) {
    
    const fyers = new fyersModel({path: safeMkdir(logPath), enableLogging: true});
    fyers.setAppId(appId);
    fyers.setAccessToken(accessToken);

    const poll = async () => {

        const symbols = getSymbols();

        try {
            apiManagerInstance.dApiCall();
            const result = await fyers.getMarketDepth({
                "symbol": symbol,
                "ohlcv_flag": 1
            });

            if (result.s === 'ok') {
                onData(result.d);
            }
            else {
                console.error('[NODE] Depth poll bad response: ', result);
            }
        }
        catch (error) {
            console.error('[NODE] option depth error: ', error);
        }
        finally {
            setTimeout(poll, interval);
        }
    };
    poll();
}

export default depthPoll;