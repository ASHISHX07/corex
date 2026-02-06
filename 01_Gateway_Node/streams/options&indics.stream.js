import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../helpers/ensureAndMkdir.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../Data/logs/stream_logs/option-chain-logs');

const indicsData = {
    instrument: 0,
    ltp: 1,
    exchFeedTime: 2,
    high: 3,
    low: 4,
    open: 5,
    prevClosePrice: 6,
    ch: 7,
    chp: 8
}

const optionChainData = {
    instrument: 0,
    ltp: 1,
    volume: 2,
    oi: 3,
    chngInOi: 4,
    totBuyQty: 5,
    totSellQty: 6,
    avgTradePrice: 7,
    high: 8,
    low: 9,
    open: 10,
    prevClose: 11,
    upperCkt: 12,
    lowerCkt: 13,
    exchFeedTime: 14,
    ch: 15,
    chp: 16,
    signal: 17,
    action: 18
    }

const optionsData = Object.keys(optionChainData).length

async function optionStream(app_id, access_token, optionVeiew, indicsView, symbols = [], logger = false) {

    const symbolMap = new Map();
    const subscriptionList = [];

    for (let i = 0; i < symbols.length; i += 2) {
        const token = symbols[i];
        const symbolStr = symbols[i+1];
        const baseIdx = (i / 2) * optionsData;
        
        symbolMap.set(symbolStr, {baseIdx, token});
        subscriptionList.push(symbolStr);
    }

    console.log(`[NODE] Stream Configured. Stride: ${optionsData}. Symbols: ${subscriptionList.length}`);

    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, ensureAndMkdir(logDir), logger);

    // const symbolList = [symbols[1]];

    socket.on("connect", function(){
        socket.subscribe(subscriptionList);
        socket.mode(socket.FullMode);
        console.log("[NODE] Subscribed to all given option chain symbols");
    })

    socket.on("message", function(message){

        const updates = Array.isArray(message) ? message : [message];

        for (let i = 0; i < updates.length; i++) {
            const packet = updates[i];

            const meta = symbolMap.get(packet.symbol);

            if (meta) {
                const b = meta.baseIdx;

                floatView[b + optionChainData.instrument]          = meta.token;
                floatView[b + optionChainData.ltp]                 = packet.ltp                || -1;
                floatView[b + optionChainData.volume]              = packet.vol_traded_today   || -1;
                floatView[b + optionChainData.oi]                  = packet.oi                 || -1;
                floatView[b + optionChainData.chngInOi]            = packet.chng_in_oi         || -1;
                floatView[b + optionChainData.totBuyQty]           = packet.tot_buy_qty        || -1;
                floatView[b + optionChainData.totSellQty]          = packet.tot_sell_qty       || -1;
                floatView[b + optionChainData.avgTradePrice]       = packet.avg_trade_price    || -1;
                floatView[b + optionChainData.high]                = packet.high_price         || -1;
                floatView[b + optionChainData.low]                 = packet.low_price          || -1;
                floatView[b + optionChainData.open]                = packet.open_price         || -1;
                floatView[b + optionChainData.prevClose]           = packet.prev_close_price   || -1;
                floatView[b + optionChainData.upperCkt]            = packet.upper_ckt          || -1;
                floatView[b + optionChainData.lowerCkt]            = packet.lower_ckt          || -1;
                floatView[b + optionChainData.exchFeedTime]        = packet.exch_feed_time     || -1;
                floatView[b + optionChainData.ch]                  = packet.ch                 || -1;
                floatView[b + optionChainData.chp]                 = packet.chp                || -1;
                
                floatView[b + optionChainData.signal]              = 0;
                floatView[b + optionChainData.action]              = 0;
                console.log(message);
            }
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
    optionsData,
}