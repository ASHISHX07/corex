import { fyersTbtSocket } from "fyers-api-v3";
import { readFileSync } from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../helpers/ensureAndMkdir.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bufferLayoutPath = path.resolve(__dirname, '../../Config/shm_layout.json')
const layout = JSON.parse(readFileSync(bufferLayoutPath, 'utf8'))
const logDir = path.join(__dirname, '../../../Data/logs/stream_logs/tbt-data-logs');

async function tbtDataSocket(appId, accessToken, symbols = [], bufferView, diffOnly = false, logger = false) {

    const socket = new fyersTbtSocket(`${appId}:${accessToken}`, ensureAndMkdir(logDir), logger, diffOnly);

    if (symbols.length < 1 || symbols.length > 15) {
        console.error('TBT socket can only subscribe minimum 1 and maximum 15 per channel');
    }

    socket.on("error", (errmsg) => {
        console.log(`[NODE] TBT SOCKET ERROR: ${errmsg}`);
    });
    
    socket.on("open", () => {
        socket.subscribe(symbols, '1', 'depth');
        socket.switchChannel([], ['1']);
    });

    socket.on("depth", (ticker, data) => {
        // console.log("DEPTH", ticker, data);
    });

    socket.on("close", () => {
        console.log("closed");
    });

    socket.on("servererror", (msg) => {
        console.log("[NODE] TBT SOCKET SERVER ERROR", msg)
    });

    socket.autoreconnect(10);
    socket.connect();
}

export default tbtDataSocket;