import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import ensureBridge from "./helpers/ensureBridge.js";
import { execFileSync } from "child_process";

// for absolute path and ENV variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Must run synchronously before any SHM import — generates headers + compiles if needed or not available
ensureBridge();

const { initShm, setReady, closeProcess } = await import('./shm/shmWriter.js');
const { initReader, startSignalWatch }    = await import('./shm/shmReader.js');
const expiryGuard                         = (await import('./timers/expiryGuard.js')).default;
const { ensureAccessToken }               = await import('./connections/fyers_connect.js');
const apiManager                          = (await import('./helpers/apiPulse.js')).default;
const optionPoll                          = (await import('./streams/optionApiPolls.stream.js')).default;
const { optionAndIndicsStream }           = await import('./streams/optionChain.stream.js');

// ── Boot ──────────────────────────────────────────────────────────────────────
const APP_ID    = process.env.FYERS_APP_ID;

await expiryGuard();
initShm();
initReader();
startSignalWatch(50);

const API           = new apiManager();
const access_token  = await ensureAccessToken();
const liveSpot      = await optionPoll(APP_ID, access_token, API, 1000);

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
    API.finish();
    // give streams ~500ms to flush their last tick before exit
    await new Promise(r => setTimeout(r, 500));
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM',() => shutdown('SIGTERM')); 
