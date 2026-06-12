import { fyersModel } from 'fyers-api-v3'
import { fileURLToPath } from 'url';
import path from 'path';
import { safeRead, safeMkdir } from '../helpers/fs.helper.js';
import { getExpiryTimeStamp } from '../generators/optionGenerator.js';
import { onPollData } from '../shm/shmWriter.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const configPath    = path.resolve(__dirname, '../../Config/option-config.json');
const logPath       = path.join(__dirname, '../../runtime/logs/option-poll');
const config        = JSON.parse(safeRead(configPath));

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

async function optionPoll(appId, accessToken, apiManagerInstance, interval = 5000) {

    const fyers = new fyersModel({path: safeMkdir(logPath), enableLogging: true});
    fyers.setAppId(appId);
    fyers.setAccessToken(accessToken);

    const { exchange, underlying, visibility } = config;

    // Fyers option chain API uses the index symbol, not individual strikes
    let indexUnderlying;
    let isLtpInit = true;

    switch (underlying) {
        case "NIFTY":       indexUnderlying  = "NIFTY50";     break;
        case "BANKNIFTY":   indexUnderlying  = "NIFTYBANK";   break;
        default:            indexUnderlying  = underlying;    break;
    }

    const indexSymbol = `${exchange}:${indexUnderlying ?? underlying}-INDEX`;

    const poll = async () => {
        
        try {
            apiManagerInstance.dApiCall();
            const result = await fyers.getOptionChain({
                symbol:         indexSymbol,
                strikecount:    visibility,
                timestamp:      String(getExpiryTimeStamp() ?? ''),
                greeks:         1
            });

            if (result.code == 200) {
                console.log(result.data);
                onPollData(result.data);
                return isLtpInit ? result.data.optionsChain[0].ltp : null;
            }
            else {
                console.error('[NODE] optionPoll bad response: ', result);
                return null;
            }
        }
        catch (err) {
            console.error('[NODE] optionPoll error: ', err);
            return null;
        }
        finally {
            setTimeout(poll, interval);
        }
    };

    isLtpInit = false;

    poll();

}

export default optionPoll;