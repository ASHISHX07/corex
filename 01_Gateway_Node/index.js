import path from "path";
import fs from "fs";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { ensureAccessToken } from "./connections/fyers_connect.js";
import apiManager from "./helpers/apiPulse.js";
import headerGenerator from "./generators/headerGenerator.js";
import optionPoll from "./streams/optionApiPolls.stream.js";
import { optionAndIndicsStream } from "./streams/optionChain.stream.js";
import expiryGuard from "./timers/expiryGuard.js";
import { initShm, setReady, closeProcess } from "./shm/shmWriter.js";
import { initReader, startSignalWatch } from "./shm/shmReader.js";

// for absolute path and ENV variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const APP_ID    = process.env.FYERS_APP_ID;
const STOP_FLAG = path.resolve(__dirname, '../Data/stop.flag');

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let _shuttingDown = false;
function gracefulShutdown() {
    if (_shuttingDown) return;
    _shuttingDown = true;
    console.log('[NODE] Shutting down — setting systemStatus = 0...');
    closeProcess();                        // signals C++ Core to exit cleanly
    if (fs.existsSync(STOP_FLAG)) fs.unlinkSync(STOP_FLAG);
    setTimeout(() => process.exit(0), 1000);
}

// Launcher writes Data/stop.flag → we pick it up here
const _stopWatcher = setInterval(() => {
    if (fs.existsSync(STOP_FLAG)) gracefulShutdown();
}, 500);

// Also handle direct Ctrl+C when running Node standalone (not via launcher)
process.on('SIGINT',  gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ── Boot ──────────────────────────────────────────────────────────────────────
await expiryGuard();
headerGenerator();
initShm();
initReader();
startSignalWatch(50);

const API           = new apiManager();
const access_token  = await ensureAccessToken();

const liveSpot = await optionPoll(APP_ID, access_token, API, 1000);

optionAndIndicsStream({
    app_id:       APP_ID,
    access_token,
    initialSpot:  liveSpot,
    litemode:     false,
    logger:       false
});

setTimeout(setReady, 2000);
