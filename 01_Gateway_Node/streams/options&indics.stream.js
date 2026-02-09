import { fyersDataSocket } from "fyers-api-v3";
import { readFileSync } from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../helpers/ensureAndMkdir.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bufferLayoutPath = path.resolve(__dirname, '../../Config/shm_layout.json')
const layout = JSON.parse(readFileSync(bufferLayoutPath, 'utf8'))
const logDir = path.join(__dirname, '../../../Data/logs/stream_logs/option-chain-logs');

const indicsDataMap = {};
layout.INDICS.forEach((field, index) => {indicsDataMap[field] = index;});
let indicsDataPoints = layout.INDICS.length;

const optionChainDataMap = {};
layout.OPTIONS.forEach((field, index) => {optionChainDataMap[field] = index;});
let optionsDataPoints = layout.OPTIONS.length;

// let totalDataPoints = indicsDataPoints + optionsDataPoints;

async function optionStream(app_id, access_token, indicsView, optionView, symbols = [], logger = false) {

    const symbolMap = new Map();
    const subscriptionList = [];

    let indicsCounter = 0;
    let optionsCounter = 0;

    for (let i = 0; i < symbols.length; i += 2) {
        const token = symbols[i];
        const symbolStr = symbols[i+1];

        let type, baseIdx;

        if (token < 10) {
            type = 1;
            baseIdx = indicsCounter * indicsDataPoints;
            indicsCounter++;
        } else {
            type = 2;
            baseIdx = optionsCounter * optionsDataPoints;
            optionsCounter++;
        }

        // const baseIdx = (i / 2) * optionsDataPoints;
        
        symbolMap.set(symbolStr, {type, baseIdx, token});
        subscriptionList.push(symbolStr);
    }

    console.log(`[NODE] Stream Configured`);
    console.log(`       Indices: ${indicsCounter}`);
    console.log(`       Options: ${optionsCounter}`);

    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, ensureAndMkdir(logDir), logger);

    // const symbolList = [symbols[1]];

    socket.on("connect", function(){
        socket.subscribe(subscriptionList);
        socket.mode(socket.FullMode);
        console.log("[NODE] Subscribed to all symbols");
    })

    socket.on("message", function(message){

        const updates = Array.isArray(message) ? message : [message];

        for (const packet of updates) {
            const meta = symbolMap.get(packet.symbol);
            if (!meta) continue;
            
            const b = meta.baseIdx;

            if (meta.type == 1) {
                indicsView[b + indicsDataMap.instrument]            = meta.token;
                indicsView[b + indicsDataMap.ltp]                   = packet.ltp || -1;
                indicsView[b + indicsDataMap.exchFeedTime]          = packet.exch_feed_time || -1;
                indicsView[b + indicsDataMap.high]                  = packet.high || -1;
                indicsView[b + indicsDataMap.low]                   = packet.low_price || -1;
                indicsView[b + indicsDataMap.open]                  = packet.open_price || -1;
                indicsView[b + indicsDataMap.prevClose]             = packet.prev_close_price || -1;
                indicsView[b + indicsDataMap.ch]                    = packet.ch || -1;
                indicsView[b + indicsDataMap.chp]                   = packet.chp || -1;
                indicsView[b + indicsDataMap.signal]                = 0;
                indicsView[b + indicsDataMap.action]                = 0;
            }
            else {
                optionView[b + optionChainDataMap.instrument]       = meta.token;
                optionView[b + optionChainDataMap.ltp]              = packet.ltp                || -1;
                optionView[b + optionChainDataMap.volume]           = packet.vol_traded_today   || -1;
                optionView[b + optionChainDataMap.oi]               = packet.oi                 || -1;
                optionView[b + optionChainDataMap.chngInOi]         = packet.chng_in_oi         || -1;
                optionView[b + optionChainDataMap.totBuyQty]        = packet.tot_buy_qty        || -1;
                optionView[b + optionChainDataMap.totSellQty]       = packet.tot_sell_qty       || -1;
                optionView[b + optionChainDataMap.avgTradePrice]    = packet.avg_trade_price    || -1;
                optionView[b + optionChainDataMap.high]             = packet.high_price         || -1;
                optionView[b + optionChainDataMap.low]              = packet.low_price          || -1;
                optionView[b + optionChainDataMap.open]             = packet.open_price         || -1;
                optionView[b + optionChainDataMap.prevClose]        = packet.prev_close_price   || -1;
                optionView[b + optionChainDataMap.upperCkt]         = packet.upper_ckt          || -1;
                optionView[b + optionChainDataMap.lowerCkt]         = packet.lower_ckt          || -1;
                optionView[b + optionChainDataMap.exchFeedTime]     = packet.exch_feed_time     || -1;
                optionView[b + optionChainDataMap.ch]               = packet.ch                 || -1;
                optionView[b + optionChainDataMap.chp]              = packet.chp                || -1;
                
                optionView[b + optionChainDataMap.signal]           = 0;
                optionView[b + optionChainDataMap.action]           = 0;
            }
            console.log(message);
        }
    });

    socket.on("error", function(error) {
        console.log("Error: ", error);
    });

    socket.on("close", function() {
        console.log("Socket closed");
    });

    socket.autoreconnect(10);
    socket.connect();
}

export {
    optionStream,
    indicsDataPoints,
    optionsDataPoints,
}