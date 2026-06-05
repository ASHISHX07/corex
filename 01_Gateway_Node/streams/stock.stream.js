import { fyersModel } from 'fyers-api-v3';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeMkdir } from '../helpers/fs.helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../runtime/logs/stock-stream-logs');

async function stockStream(app_id, access_token, logger, interval = 1000) {

    const fyers = new fyersModel({"path": safeMkdir(logDir), "enableLogging": logger});
    fyers.setAppId(app_id);
    fyers.setAccessToken(access_token);
    
    const symbols = ["NSE:NIFTY50-INDEX", "NSE:NIFTYBANK-INDEX"];

    setInterval(() => {
        fyers.getQuotes(symbols)
        .then(
            (response)=>{
            response.d.forEach(s => console.log(s.v));
        })
        .catch((err)=>{
            if(err.code == -15) {
                console.log("invalid/outdated access token");
                process.exit(0);
            }
        });
    }, interval);
}

export default stockStream;