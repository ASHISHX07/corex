import { fyersModel } from 'fyers-api-v3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeMkdir } from '../helpers/fs.helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: path.resolve(__dirname, '../../.env')});    // Load .env from the Root Directory
const logDir = path.join(__dirname, '../../runtime/stock-stream-logs');

async function stockStream(app_id, access_token, logger, interval = 1000) {

    const fyers = new fyersModel({"path": safeMkdir(logDir), "enableLogging": logger});
    fyers.setAppId(app_id);
    fyers.setAccessToken(access_token);
    
    setInterval(() => {
        fyers.getQuotes(["NSE:NIFTY50-INDEX", "NSE:NIFTYBANK-INDEX"])
        .then(
            (response)=>{
            console.log(response);
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