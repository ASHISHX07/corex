import { fyersDataSocket } from 'fyers-api-v3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from '../../../helpers/ensureAndMkdir.helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: path.resolve(__dirname, '../../../../.env')});    // Load .env from the Root Directory
const logDir = path.join(__dirname, '../../../../Data/logs/stream_logs');

async function niftyStream(app_id, access_token, intView, floatView, logger = false) {
    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, ensureAndMkdir(logDir), logger) 

    socket.on("connect", function(){
        socket.subscribe(['NSE:NIFTY50-INDEX'])
        socket.mode(socket.FullMode)
        console.log("[Socket] Subscribed to Nifty 50");
    })

    socket.on("message", function(message) {
        // Fyers sends data as an array of objects or a single object
        // We handle both just in case
        const data = Array.isArray(message) ? message[0] : message;

        if (data && data.ltp) {
            // --- CRITICAL: WRITE TO SHARED MEMORY ---
            
            // 1. Update LTP (Float View Index 0)
            floatView[0] = data.ltp; 
            
            // 2. Update Volume (Float View Index 3) - if available
            if (data.vol_traded_today) {
                floatView[3] = data.vol_traded_today;
            }

            // 3. Update Exchange Time (Int View Index 1)
            if (data.last_traded_time) {
                intView[1] = data.last_traded_time;
            }
            
            // Optional: Print infrequently to keep console clean
            console.log(`[Socket] Wrote LTP: ${data.ltp} to Shared Memory`);
        }
    })

    socket.on("error",function(message) {
        console.log("erroris",message);
    })

    socket.on("close",function() {
        console.log("socket closed");
    })

    socket.connect()
    
}

export default niftyStream;