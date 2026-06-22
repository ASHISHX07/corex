import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { ensureAccessToken } from "./connections/fyers_connect.js";
import apiManager from "./helpers/apiPulse.js";
import headerGenerator from "./generators/headerGenerator.js";
import optionPoll from "./streams/optionApiPolls.stream.js";
import { optionAndIndicsStream } from "./streams/optionChain.stream.js";
import expiryGuard from "./timers/expiryGuard.js";
import { initShm, setReady } from "./shm/shmWriter.js";
import { initReader, startSignalWatch } from "./shm/shmReader.js";
import { closeProcess } from "./shm/shmWriter.js";

// for absolute path and ENV variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APP_ID    = process.env.FYERS_APP_ID;

// ── Boot ──────────────────────────────────────────────────────────────────────
await expiryGuard();
headerGenerator();
initShm();
initReader();
startSignalWatch(50);

const API = new apiManager();
const access_token = await ensureAccessToken();

const liveSpot = await optionPoll(APP_ID, access_token, API, 1000);

optionAndIndicsStream({
    app_id: APP_ID,
    access_token,
    initialSpot: liveSpot,
    litemode: false,
    logger: false
});

setTimeout(setReady, 2000);

let close = false;

async function shutdown(signal) {
    if (close) return;
    close = true;
    closeProcess();     // sets systemStatus = 0 in SHM
    // give streams ~500ms to flush their last tick before exit
    await new Promise(r => setTimeout(r, 500));
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM',() => shutdown('SIGTERM')); 
