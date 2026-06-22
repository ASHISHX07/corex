import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import { safeMkdir } from "../helpers/fs.helper.js";
import { buildOptionSymbols, snapToATM, STRIKE_GAP } from "../generators/optionGenerator.js";
import { applySymbols, onSocketTick } from "../shm/shmWriter.js";
import { config } from "../helpers/loader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../runtime/logs/option-chain-logs');

function optionAndIndicsStream({app_id, access_token, initialSpot, litemode, logger}) {

    const gap = STRIKE_GAP[config.underlying] ?? 100;
    let currentAtm = snapToATM(initialSpot ?? config.spotPrice, gap);
    let currentSymbols = new Set();

    function reCenter(newSpot) {
        
        const newAtm = snapToATM(newSpot, gap);
        if(Math.abs(newAtm - currentAtm) < gap) return;

        const { atm, symbols } = buildOptionSymbols(newSpot);
        const newSymSet =  new Set(symbols.filter(s => !s.includes('INDEX')))
        const oldSymSet = new Set([...currentSymbols].filter(s => !s.includes('INDEX')));

        const toUnsub = [...oldSymSet].filter(s => !newSymSet.has(s));
        const toSub   = [...newSymSet].filter(s => !oldSymSet.has(s));

        socket.unsubscribe(toUnsub);
        socket.subscribe(toSub);

        currentSymbols = new Set(symbols);
        applySymbols(symbols);

        currentAtm = newAtm;
        // console.log(`[ATM SHIFT] -> ${newAtm}`);
    }

    const { atm, symbols } = buildOptionSymbols(currentAtm);
    currentSymbols = new Set(symbols);
    applySymbols(symbols);

    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, safeMkdir(logDir), logger);

    socket.on("connect", () => {
        socket.subscribe([...currentSymbols]);
        socket.mode(litemode ? socket.LiteMode : socket.FullMode);
    });

    socket.on("message", (message) => {
        const updates = Array.isArray(message) ? message : [message];
        for (const packet of updates) {
            if(!packet.symbol) continue;
            const isIndex = packet.type === 'if';
            if (isIndex) reCenter(packet.ltp)
            onSocketTick(isIndex, packet.symbol, packet);
            // console.log(message);
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

export { optionAndIndicsStream };