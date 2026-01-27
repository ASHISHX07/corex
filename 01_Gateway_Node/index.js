// bridge imports
import { createRequire } from "node:module";

import { getAuthCodeM, getAccessToken } from "./connections/fyers_connect.js";
import getProfileInfo from "./account/profile_info.js";
import { readFileSync } from "node:fs";
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import ensureAndRead from "./helpers/ensureAndRead.helper.js";
// import optionChainStream from "./streams/api-streams/option-chain.stream.js";
// import marketStatus from "./market/marketStatus.js";
import niftyStream from "./streams/sockets/indics/nifty.socket.js";
// import stockStream from "./streams/stock.stream.js"
// import exampleSocket from "./streams/sockets/example.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({path: path.resolve(__dirname, '../.env')});    // Load .env from the Root Directory
const accessTokenFilePath = path.resolve(__dirname, '../Data/cache/access_token.txt');
const authCodeFilePath = path.resolve(__dirname, '../Data/cache/auth_code.txt');
const bridge = require('./build/shm_bridge.node');

const appId = process.env.FYERS_APP_ID
let accessToken = ensureAndRead(accessTokenFilePath);

if(!accessToken) {
    let authCode = ensureAndRead(authCodeFilePath);
    if(!authCode) {
        await getAuthCodeM(appId);
    }
    await getAccessToken(appId);
    accessToken = readFileSync(accessTokenFilePath, 'utf8');
}
let validate = await getProfileInfo(appId, accessToken, true, false)
if(validate) {
    console.log("\nauthentication done\n")
}
else {
    
}

// await stockStream(appId, access_token);

// await niftyStream(appId, accessToken);

// await marketStatus(appId, accessToken, true);

// optionChainStream(appId, accessToken, "MCX:CRUDEOILM26JAN5300CE", 1, 4000);

console.log("[NODE] Accessing shared memory buffer");
const rawBuffer = bridge.getSharedBuffer();

const intView = new Int32Array(rawBuffer.buffer, rawBuffer.byteOffset, 3); // first 3 ints
const floatView = new Float32Array(rawBuffer.buffer, rawBuffer.byteOffset + 12, 4);
console.log(`Shared memory intialized`);

console.log("[Node] Starting Nifty Stream with Memory Access...");

niftyStream(appId, accessToken, intView, floatView)

// <================================================== Bridge Implementation ==================================================>

// Create a "View" using your Struct layout
// bufferHeader has: 3 ints (4 bytes each) + 4 floats (4 bytes each) = 28 bytes total
// Offsets:
// int instrumentToken -> Bytes 0-3
// int feedTimeAtExchg -> Bytes 4-7
// ...
// float ltp           -> Bytes 12-15

// const intView = new Int32Array(rawBuffer.buffer, rawBuffer.byteOffset, 3); // first 3 ints
// const floatView = new Float32Array(rawBuffer.buffer, rawBuffer.byteOffset + 12, 4);
// console.log(`Shared memory intialized`);

// Test: Read what C++ writes

setInterval(() => {
    // Read values directly from RAM (written by C++)
    const ltp = floatView[0]; // Struct 'ltp'
    const oi = floatView[1];  // Struct 'oi'
    
    // Print to prove it's alive
    console.log(`[Node Read] C++ says -> LTP: ${ltp.toFixed(2)} | OI: ${oi.toFixed(2)}`);

    // 5. SEND BACK: Write something to C++
    // Let's pretend we got a new market price
    floatView[0] = Math.random() * 1000; // changing LTP randomly
}, 1000);