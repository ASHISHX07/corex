// bridge imports
import { createRequire } from "node:module";

import { getAuthCodeM, getAccessToken } from "./connections/fyers_connect.js";
import getProfileInfo from "./account/profile_info.js";
import { readFileSync } from "node:fs";
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import ensureAndRead from "./helpers/ensureAndRead.helper.js";
import { weeklyOptionSymbolName, monthlyOptionSymbolName } from "./helpers/symbology.js";
// import optionChainStream from "./streams/api-streams/option-chain.stream.js";
// import marketStatus from "./market/marketStatus.js";
import niftyStream from "./streams/sockets/indics/nifty.socket.js";
// import stockStream from "./streams/stock.stream.js"
// import exampleSocket from "./streams/sockets/example.js";
import optionChainStream from "./streams/sockets/optionChain.stream.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({path: path.resolve(__dirname, '../.env')});    // Load .env from the Root Directory
const accessTokenFilePath = path.resolve(__dirname, '../Data/cache/access_token.txt');
const authCodeFilePath = path.resolve(__dirname, '../Data/cache/auth_code.txt');

const bridge = require('./build/shm_bridge.node');

const controllerBuffer = bridge.getControllerBuffer();
const controllerBufferView = new Float64Array(controllerBuffer.buffer, controllerBuffer.byteOffset);

console.log(`[NODE] Data Stream Linked. Size: ${optionChainBufferView.length} doubles.`);

const CTRL_IDX = {
    systemStatus: 0,
    socketSymbolCount: 1,
    tbtSocketSymbolCount: 2,
    apiSymbolCount: 3,
    marketDepthCount: 4
}

let symbolArray = [126203254000, "NSE:NIFTY2620325400CE", 126203252501, "NSE:NIFTY2620325250PE"];
let memNeeded = symbolArray.length * 20 * 8;
console.log(`[NODE] Allocating ${memNeeded} bytes for ${symbolArray.length / 2} symbols.`);
controllerBufferView[CTRL_IDX.systemStatus] = 0;

controllerBufferView[CTRL_IDX.socketSymbolCount] = symbolArray.length / 2;

const optionChainBuffer = bridge.getOptionChainBuffer(memNeeded);
const optionChainBufferView = new Float64Array(optionChainBuffer.buffer, optionChainBuffer.byteOffset);

const appId = process.env.FYERS_APP_ID
let accessToken = ensureAndRead(accessTokenFilePath);

if(!accessToken) {
    let authCode = ensureAndRead(authCodeFilePath);
    if(!authCode) {
        await getAuthCodeM(appId);
    }
    await getAccessToken(appId);
}
accessToken = readFileSync(accessTokenFilePath, 'utf8');
let validate = await getProfileInfo(appId, accessToken, true, false)
if(validate) {
    console.log("\nauthentication done\n")
}
else {
    console.log("failed to authenticate, please try again");
    process.exit(0);
}

let symbol = weeklyOptionSymbolName("NSE", "NIFTY", 26, 2, 3, 25400, "CE");
console.log(symbol);

// await stockStream(appId, access_token);

// await niftyStream(appId, accessToken);

// await marketStatus(appId, accessToken, true);

// optionChainStream(appId, accessToken, "MCX:CRUDEOILM26JAN5300CE", 1, 4000);

console.log("[NODE] Accessing shared memory buffer");

// niftyStream(appId, accessToken, intView, floatView)
optionChainStream(appId, accessToken, optionChainBufferView, symbolArray, false);


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

// setInterval(() => {
//     // Read values directly from RAM (written by C++)
//     const ltp = floatView[0]; // Struct 'ltp'
//     const oi = floatView[1];  // Struct 'oi'
    
//     // Print to prove it's alive
//     console.log(`[Node Read] C++ says -> LTP: ${ltp.toFixed(2)} | OI: ${oi.toFixed(2)}`);

//     // 5. SEND BACK: Write something to C++
//     // Let's pretend we got a new market price
//     floatView[0] = Math.random() * 1000; // changing LTP randomly
// }, 1000);

console.log("[NODE] System Fully Loaded. Signaling C++ to Start.");
controllerView[CTRL_IDX.STATUS] = 1; // READY!