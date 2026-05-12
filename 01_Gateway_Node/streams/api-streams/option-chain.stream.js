import { fyersModel } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../../helpers/ensureAndMkdir.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../Data/logs/stream_logs/option-chain-logs');

async function optionChainStream(app_id, access_token, symbol, strikeCount, interval = 4000, logger = false, timeStamp = ``) {
    
    const fyers = new fyersModel({"path": ensureAndMkdir(logDir), "enableLogging": logger});
    fyers.setAppId(app_id);
    fyers.setAccessToken(access_token);

    const poll = async () => {
        try {
            let optionData = await fyers.getOptionChain({"symbol": symbol, "strikecount": strikeCount, "timestamp": timeStamp, "greeks": 1});
            console.log(JSON.stringify(optionData.data, '', 2));
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