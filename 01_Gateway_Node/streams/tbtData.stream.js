import { fyersTbtSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import { URL } from "url";
import { safeMkdir } from "../helpers/fs.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../runtime/logs/tbt-depth-logs');

function tbtDataSocket(appId, accessToken, symbols = [], onTbtTick, logger = false) {

    const socket = new fyersTbtSocket(`${appId}:${accessToken}`, safeMkdir(logDir), logger, false);

    if (symbols.length < 1 || symbols.length > 15) {
        console.error('TBT socket can only subscribe minimum 1 and maximum 15 per channel');
    }

    socket.on("open", () => {
        socket.subscribe(["NSE:NIFTY2660923400PE"], '1', 'depth');
        socket.switchChannel([], ['1']);
    });
    
    socket.on("depth", (ticker, data) => {
        console.log("DEPTH", ticker, data);
    });
    
    socket.on("error",        (err) => console.error('[NODE] TBT Error:', err));
    socket.on("servererror",  (msg) => console.error('[NODE] Server error:', msg));
    socket.on("close",        () => console.log("[NODE] TBT Closed"));

    socket.autoreconnect(10);
    socket.connect();
}

export default tbtDataSocket;