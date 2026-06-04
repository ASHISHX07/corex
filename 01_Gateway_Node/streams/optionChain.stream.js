import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import { safeRead, safeMkdir } from "../helpers/fs.helper.js";
import { buildOptionSymbols, snapToATM, STRIKE_GAP } from "../generators/optionGenerator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../runtime/logs/option-chain-logs');
const configPath = path.resolve(__dirname, '../../Config/option-config.json');
const config = JSON.parse(safeRead(configPath));

async function optionAndIndicsStream({app_id, access_token, onTick, litemode, logger}) {

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

        socket.unsubscribe(oldSyms.filter(s => !newSyms.includes(s)));
        socket.subscribe(newSyms.filter(s => !oldSyms.includes(s)));

        buildReverseMap(map);
        currentAtm = newAtm;
        console.log(`[ATM SHIFT] -> ${newAtm}`);
    }

    const { map } = buildOptionSymbols(currentAtm);
    buildReverseMap(map);

    const instrumentArr = [...reverseMap.values()];
    let options = instrumentArr.length;

    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, safeMkdir(logDir), true);

    socket.on("connect", () => {
        socket.subscribe([...reverseMap.keys()]);
        socket.mode(litemode ? socket.LiteMode : socket.FullMode);
    });

    socket.on("message", (message) => {
        
        const updates = Array.isArray(message) ? message : [message];

        for (const packet of updates) {
            const instrument = reverseMap.get(packet.symbol);
            if (instrument === undefined) continue;
            
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

    return { reCenter };
}

export { optionAndIndicsStream };