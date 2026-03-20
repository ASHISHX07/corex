// bridge imports
import { createRequire } from "node:module";

import { getAuthCodeM, getAccessToken } from "./connections/fyers_connect.js";
import getProfileInfo from "./account/profile_info.js";
import { readFileSync, writeFileSync } from "node:fs";
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import ensureAndRead from "./helpers/ensureAndRead.helper.js";
import headerGenerator from './generators/headerGenerator.js'
// import { weeklyOptionSymbolName, monthlyOptionSymbolName } from "./helpers/symbology.js";
import { optionAndIndicsStream, indicsDataPoints, optionsDataPoints } from "./streams/options&indics.stream.js";
import tbtDataSocket from "./streams/tbtData.stream.js";
import getOptionChainSymbols from "./generators/optionGenerator.js";

const appId = process.env.FYERS_APP_ID;

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

await headerGenerator();

dotenv.config({path: path.resolve(__dirname, '../.env')});    // Load .env from the Root Directory
const bufferLayoutPath = path.resolve(__dirname, '../Config/shm_layout.json');
const accessTokenFilePath = path.resolve(__dirname, '../Data/cache/access_token.txt');
const authCodeFilePath = path.resolve(__dirname, '../Data/cache/auth_code.txt');

const bridge = require('./build/shm_bridge.node');

const controllerLayout = JSON.parse(readFileSync(bufferLayoutPath, 'utf8'));

const controllerMap = {};
controllerLayout.CONTROLLER.forEach((field, index) => {
    controllerMap[field] = index;
})

const controllerBuffer = bridge.getControllerBuffer();
const controllerBufferView = new Int32Array(controllerBuffer.buffer, controllerBuffer.byteOffset);

let symbolArray = await getOptionChainSymbols();

let optionsCount = 0;
let indicesCount = 0;


for(let i = 0; i < symbolArray.length; i+=2) {
    const symbolStr = symbolArray[i];
    
    if (symbolStr < 10) { indicesCount++; }
    else { optionsCount++ }
}

let indicsBufferView = null; // Default to null

if (indicesCount > 0) {
    const indicesMemNeeded = indicesCount * indicsDataPoints * 8;
    console.log(`[NODE] Allocating ${indicesMemNeeded} bytes for Indices`);
    const indicsBuffer = bridge.getIndicsDataBuffer(indicesMemNeeded);
    indicsBufferView = new Float64Array(indicsBuffer.buffer, indicsBuffer.byteOffset);
} else {
    console.log("[NODE] No Indices found. Skipping allocation.");
}

// Options usually have data, but we can guard them too
let optionChainBufferView = null;
if (optionsCount > 0) {
    const optionsMemNeeded = optionsCount * optionsDataPoints * 8;
    console.log(`[NODE] Allocating ${optionsMemNeeded} bytes for Options`);
    const optionChainBuffer = bridge.getOptionChainBuffer(optionsMemNeeded);
    optionChainBufferView = new Float64Array(optionChainBuffer.buffer, optionChainBuffer.byteOffset);
}

controllerBufferView[controllerMap.systemStatus] = 0;
controllerBufferView[controllerMap.sIndicesCount] = indicesCount;
controllerBufferView[controllerMap.sOptionsCount] = optionsCount;

let accessToken = await ensureAndRead(accessTokenFilePath);

if(!accessToken) {
    let authCode = await ensureAndRead(authCodeFilePath);
    if(!authCode) {
        await getAuthCodeM(appId);
    }
    await getAccessToken(appId);
    accessToken = await ensureAndRead(accessTokenFilePath);
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


// tbtDataSocket(appId, accessToken, ["NSE:NIFTY26FEB25450CE"], 4)  // BAD

// let symbol = weeklyOptionSymbolName("NSE", "NIFTY", 26, 2, 17, 25700, "PE");
// symbolArray.push(2621725400);
// symbolArray.push(symbol);
// console.log(symbol);

const streamConfig = {
    app_id: appId,
    access_token: accessToken,
    indicsView: indicsBufferView,
    optionView: optionChainBufferView,
    symbols: symbolArray,
    litemode: false,
    logger: true,
    logWriter: false
}

optionAndIndicsStream(streamConfig);

console.log("[NODE] Complete");
controllerBufferView[controllerMap.systemStatus] = 1; // READY!