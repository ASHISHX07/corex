// bridge imports
import { createRequire } from "node:module";

import { getAuthCodeM, getAccessToken } from "./connections/fyers_connect.js";
import getProfileInfo from "./account/profile_info.js";
import { writeFileSync } from "node:fs";
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import ensureAndRead from "./helpers/ensureAndRead.helper.js";
import headerGenerator from './helpers/headerGenerator.js'
// import { weeklyOptionSymbolName, monthlyOptionSymbolName } from "./helpers/symbology.js";
import { optionStream, indicsDataPoints, optionsDataPoints } from "./streams/options&indics.stream.js";
import tbtDataSocket from "./streams/tbtData.stream.js";

const appId = process.env.FYERS_APP_ID;

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

await headerGenerator();

dotenv.config({path: path.resolve(__dirname, '../.env')});    // Load .env from the Root Directory
const accessTokenFilePath = path.resolve(__dirname, '../Data/cache/access_token.txt');
const authCodeFilePath = path.resolve(__dirname, '../Data/cache/auth_code.txt');

const bridge = require('./build/shm_bridge.node');

const controllerBuffer = bridge.getControllerBuffer();
const controllerBufferView = new Int32Array(controllerBuffer.buffer, controllerBuffer.byteOffset);

let symbolArray = [1, "NSE:NIFTY50-INDEX", 2, "NSE:NIFTYBANK-INDEX", 3, "BSE:SENSEX-INDEX", 26203254000, "NSE:NIFTY2621025800CE"];

const CTRL_IDX = {
    systemStatus: 0,
    sIndicesCount: 1,
    sOptionsCount: 2,
    tbtSocketSymbolCount: 3,
    apiSymbolCount: 4,
    marketDepthCount: 5,
    signal: 6,
    action: 7
}

let optionsCount = 0;
let indicesCount = 0;


for(let i = 0; i < symbolArray.length; i+=2) {
    const symbolStr = symbolArray[i];
    
    if (symbolStr < 10) { indicesCount++; }
    else { optionsCount++ }
}

controllerBufferView[CTRL_IDX.systemStatus] = 0;
controllerBufferView[CTRL_IDX.sIndicesCount] = indicesCount;
controllerBufferView[CTRL_IDX.sOptionsCount] = optionsCount;
// let memNeeded = (symbolArray.length / 2) * totalDataPoints * 8;
const indicesMemNeeded = indicesCount * indicsDataPoints * 8;
const optionsMemNeeded = optionsCount * optionsDataPoints * 8;

console.log(`[NODE] Allocating:`);
console.log(`       Indices: ${indicesMemNeeded} bytes`);
console.log(`       Options: ${optionsMemNeeded} bytes`);

const indicsBuffer = bridge.getIndicsDataBuffer(indicesMemNeeded);
const indicsBufferView = new Float64Array(indicsBuffer.buffer, indicsBuffer.byteOffset);

const optionChainBuffer = bridge.getOptionChainBuffer(optionsMemNeeded);
const optionChainBufferView = new Float64Array(optionChainBuffer.buffer, optionChainBuffer.byteOffset);

let accessToken = ensureAndRead(accessTokenFilePath);

if(!accessToken) {
    let authCode = ensureAndRead(authCodeFilePath);
    if(!authCode) {
        await getAuthCodeM(appId);
    }
    await getAccessToken(appId);
    accessToken = ensureAndRead(accessTokenFilePath);
}

if (accessToken) {
    let validate = await getProfileInfo(appId, accessToken, true, false)
    
    if(validate) {
        console.log("\nauthentication done\n")
    }
    else {
        console.log("failed to authenticate, clearing cache and exiting...");
        writeFileSync(accessTokenFilePath, '', 'utf8');
        process.exit(0);
    }
}
else {
    console.log("failed to authenticate, please try again");
    process.exit(0);
}

// tbtDataSocket(appId, accessToken, ["NSE:NIFTY2621725450CE"], 4)   BAD

// let symbol = weeklyOptionSymbolName("NSE", "NIFTY", 26, 2, 17, 25700, "PE");
// symbolArray.push(2621725400);
// symbolArray.push(symbol);
// console.log(symbol);

optionStream(appId, accessToken, indicsBufferView, optionChainBufferView, symbolArray, false);

console.log("[NODE] Complete");
controllerBufferView[CTRL_IDX.systemStatus] = 1; // READY!