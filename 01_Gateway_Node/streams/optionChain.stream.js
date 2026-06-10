import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import { safeRead, safeMkdir } from "../helpers/fs.helper.js";
import { buildOptionSymbols, snapToATM, STRIKE_GAP } from "../generators/optionGenerator.js";
import { setSymbols } from "../helpers/activeSymbols.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../runtime/logs/option-chain-logs');
const configPath = path.resolve(__dirname, '../../Config/option-config.json');
const config = JSON.parse(safeRead(configPath));

function optionAndIndicsStream({app_id, access_token, onTick, litemode, logger}) {

    const gap = STRIKE_GAP[config.underlying] ?? 100;
    let currentAtm = snapToATM(config.spotPrice, gap);
    let reverseMap = new Map();

    function buildReverseMap(map) {
        reverseMap.clear();
        for (const [instrument, symbol] of map) reverseMap.set(symbol, instrument);
    }

    function reCenter(newSpot) {
        
        const newAtm = snapToATM(newSpot, gap);
        if(Math.abs(newAtm - currentAtm) < gap) return;

        const { map } = buildOptionSymbols(newSpot);
        const oldSyms = [...reverseMap.keys()].filter(s => !s.includes('INDEX'));
        const newSyms = [...map.values()].filter(s => !s.includes('INDEX'));
        
        const newSymSet = new Set(newSyms);
        const oldSymSet = new Set(oldSyms);

        const toUnsub = oldSyms.filter(s => !newSymSet.has(s));
        const toSub = newSyms.filter(s => !oldSymSet.has(s));

        socket.unsubscribe(toUnsub);
        socket.subscribe(toSub);

        buildReverseMap(map);
        setSymbols(map);
        currentAtm = newAtm;
        console.log(`[ATM SHIFT] -> ${newAtm}`);
    }

    const { map } = buildOptionSymbols(currentAtm);
    buildReverseMap(map);
    setSymbols(map);

    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, safeMkdir(logDir), logger);

    socket.on("connect", () => {
        socket.subscribe([...reverseMap.keys()]);
        socket.mode(litemode ? socket.LiteMode : socket.FullMode);
    });

    socket.on("message", (message) => {
        
        const updates = Array.isArray(message) ? message : [message];

        for (const packet of updates) {
            const instrument = reverseMap.get(packet.symbol);
            if (instrument === undefined) continue;
            if (instrument < 10) reCenter(packet.ltp)
            onTick(instrument < 10 ? 'index' : 'option', instrument, packet);
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