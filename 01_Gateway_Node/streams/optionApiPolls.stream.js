import { fyersModel } from 'fyers-api-v3'
import { fileURLToPath } from 'url';
import path from 'path';
import { safeRead, safeMkdir } from '../helpers/fs.helper.js';
import { getExpiryTimeStamp } from '../generators/optionGenerator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../Config/option-config.json');
const logPath = path.resolve(__dirname, '../../runtime/logs/option-poll');
const config = JSON.parse(safeRead(configPath));

/**
 * Polls Fyers option chain API at a fixed interval.
 * Returns OI, greeks, and LTP for all strikes around ATM.
 *
 * @param {string} appId
 * @param {string} accessToken
 * @param {apiManager} apiManagerInstance   - call counter instance from index.js
 * @param {function} onData                 - callback(data) called on each successful poll
 * @param {number} interval                 - ms between polls, default 5000
 */

async function optionPoll(appId, accessToken, apiManagerInstance, onData, interval = 5000) {

    const fyers = new fyersModel({path: safeMkdir(logPath), enableLogging: true});
    fyers.setAppId(appId);
    fyers.setAccessToken(accessToken);

    const { exchange, underlying, visibility } = config;

    // Fyers option chain API uses the index symbol, not individual strikes
    const indexSymbol = `${exchange}:${underlying === 'NIFTY' ? 'NIFTY50' : underlying}-INDEX`;

    const poll = async () => {
        
        apiManagerInstance.dApiCall();

        try {
            const result = await fyers.getOptionChain({
                symbol: indexSymbol,
                strikecount: visibility,
                timestamp: String(getExpiryTimeStamp() ?? ''),
                greeks: 1
            });

            if (result.code == 200) {
                onData(result.data);
            }
            else {
                console.error('[NODE] optionPoll bad response: ', result);
            }
        }
        catch (err) {
            console.error('[NODE] optionPoll error: ', err.message());
        }
        finally {
            setTimeout(poll, interval)
        }
    };

    poll();

}

export default optionPoll;