import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import { safeRead, safeMkdir } from "../helpers/fs.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../runtime/logs/option-chain-logs');

async function optionAndIndicsStream({app_id, access_token, symbolMap, onTick, litemode, logger}) {

    const reverseMap = new Map();
    for (const [instrument, symbol] of symbolMap) {
        reverseMap.set(symbol, instrument);
    }

    const symbolArr = [...reverseMap.keys()];
    const instrumentArr = [...reverseMap.values()];
    let options = symbolArr.length;

    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, safeMkdir(logDir), true);

    socket.on("connect", () => {
        socket.subscribe(symbolArr);
        socket.mode(litemode ? socket.LiteMode : socket.FullMode);
        socket.autoreconnect(10);
    })

    socket.on("message", (message) => {
        const updates = Array.isArray(message) ? message : [message];

        for (const packet of updates) {
            const instrument = reverseMap.get(packet.symbol);
            if (instrument === undefined) continue;
            
            const type = instrument < 10 ? 'index' : 'option';
            onTick(type, instrument, packet);
        }
        
    });

    socket.on("error", (error) => {
        console.log("Socket Error: ", error);
    });

    socket.on("close", () => {
        console.log("Socket closed");
    });

    socket.autoreconnect(10);
    socket.connect();
}

export {
    optionAndIndicsStream
}