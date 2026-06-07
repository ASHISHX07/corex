import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import { ensureAccessToken } from "./connections/fyers_connect.js";
import apiManager from "./helpers/apiPulse.js";
import headerGenerator from "./generators/headerGenerator.js";
import optionPoll from "./streams/optionApiPolls.stream.js";
import { optionAndIndicsStream } from "./streams/optionChain.stream.js";
import stockStream from "./streams/stock.stream.js";
import tbtDepthStream from "./streams/tbtData.stream.js";

// for absolute path and ENV variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const APP_ID = process.env.FYERS_APP_ID;
const APP_SECRET = process.env.FYERS_SECRET_ID;
const REDIRECT_URI = process.env.FYERS_REDIRECT_URL;
const PORT = process.env.PORT;

// make buffer headers first
headerGenerator();

const API = new apiManager();

const access_token = await ensureAccessToken();

const { reCenter } = optionAndIndicsStream({
    app_id: APP_ID,
    access_token,
    onTick: (type, instrument, packet) => {
        if (type === 'index') reCenter(packet.ltp);
        console.log(packet);
    },
    litemode: false,
    logger: false
});

// await optionAndIndicsStream({app_id: APP_ID, access_token, onTick, litemode: false, logger: true});

function logger(data) {
    console.log(data);
    console.log(API.getCounts());
}


// await stockStream(APP_ID, access_token, true, 1000);

tbtDepthStream(APP_ID, access_token, [], true);

// await optionPoll(APP_ID, access_token, API, logger, 2000);
























// import { createRequire } from 'node:module';
// import { optionAndIndicsStream, indicsDataPoints, optionsDataPoints } from './streams/options&indics.stream.js';
// import tbtDataSocket from "./streams/tbtData.stream.js";
// import optionChainStream from './streams/api-streams/option-chain.stream.js'
// import getOptionChainSymbols from './generators/optionGenerator.js';

// const require = createRequire(import.meta.url);

// const bufferLayoutPath = path.resolve(__dirname, '../Config/shm_layout.json');

// const bridge = require('./build/shm_bridge.node');

// const controllerLayout = JSON.parse(readFileSync(bufferLayoutPath, 'utf8'));

// const controllerMap = {};
// controllerLayout.CONTROLLER.forEach((field, index) => {
//     controllerMap[field] = index;
// })

// const controllerBuffer = bridge.getControllerBuffer();
// const controllerBufferView = new Int32Array(controllerBuffer.buffer, controllerBuffer.byteOffset);

// let symbolArray = await getOptionChainSymbols();

// let indicesCount = 0;
// let optionsCount = 0;


// for(let i = 0; i < symbolArray.length; i+=2) {
//     const instrument = symbolArray[i];
    
//     if (instrument < 10) { indicesCount++; }
//     else { optionsCount++ }
// }

// let indicsBufferView = null;
// if (indicesCount > 0) {
//     const indicesMemNeeded = indicesCount * indicsDataPoints * 8;
//     const indicsBuffer = bridge.getIndicsDataBuffer(indicesMemNeeded);
//     indicsBufferView = new Float64Array(indicsBuffer.buffer, indicsBuffer.byteOffset);
// } else {
//     console.log("[NODE] No Indices");
// }

// let optionChainBufferView = null;
// if (optionsCount > 0) {
//     const optionsMemNeeded = optionsCount * optionsDataPoints * 8;
//     const optionChainBuffer = bridge.getOptionChainBuffer(optionsMemNeeded);
//     optionChainBufferView = new Float64Array(optionChainBuffer.buffer, optionChainBuffer.byteOffset);
// } else {
//     console.log("[NODE] No Options");
// }

// controllerBufferView[controllerMap.systemStatus] = 0;
// controllerBufferView[controllerMap.sIndicesCount] = indicesCount;
// controllerBufferView[controllerMap.sOptionsCount] = optionsCount;

// optionChainStream(appId, accessToken, "NSE:NIFTY2650523800CE", 1, true);

// // tbtDataSocket(appId, accessToken, ["NSE:NIFTY265524350CE"], 4);

// // optionAndIndicsStream(streamConfig);

// console.log("[NODE] Complete");
// controllerBufferView[controllerMap.systemStatus] = 1; // READY!