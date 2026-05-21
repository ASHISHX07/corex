import { fyersModel } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../../helpers/ensureAndMkdir.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../Data/logs/stream_logs/option-chain-logs');

async function optionChainStream(app_id, access_token, symbol, strikeCount, getGreeks = true, interval = 4000, logger = false, timeStamp = ``) {
    
    const fyers = new fyersModel({"path": ensureAndMkdir(logDir), "enableLogging": logger});
    fyers.setAppId(app_id);
    fyers.setAccessToken(access_token);

    const data = {
        "symbol": symbol,
        "strikecount": strikeCount,
        "timestamp": timeStamp,
        "greeks": getGreeks ? 1 : undefined
    }

    const poll = async () => {
        try {
            let optionData = await fyers.getOptionChain(data);
            // console.log(optionData.data);
            console.log(JSON.stringify(optionData, null, 2));
        }
        catch (err) {
            console.error("Failed Polling in option-chain.stream.js: ", err);
        }
        finally {
            setTimeout(poll, interval);
        }
    }
    poll();
}

export default optionChainStream;