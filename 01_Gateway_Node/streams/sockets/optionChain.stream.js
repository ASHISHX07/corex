import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../../helpers/ensureAndMkdir.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../Data/logs/stream_logs/option-chain-logs');

const data = {
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

const STRIDE = Object.keys(data).length

async function optionChainStream(app_id, access_token, floatView, symbols = [], logger = false) {

    const symbolMap = new Map();
    const subscriptionList = [];

    for (let i = 0; i < symbols.length; i += 2) {
        const token = symbols[i];
        const symbolStr = symbols[i+1];
        const baseIdx = (i / 2) * STRIDE;
        
        symbolMap.set(symbolStr, {baseIdx, token});
        subscriptionList.push(symbolStr);
    }

    console.log(`[NODE] Stream Configured. Stride: ${STRIDE}. Symbols: ${subscriptionList.length}`);

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

                floatView[b + data.instrument]          = meta.token;
                floatView[b + data.ltp]                 = packet.ltp                || -1;
                floatView[b + data.volume]              = packet.vol_traded_today   || -1;
                floatView[b + data.oi]                  = packet.oi                 || -1;
                floatView[b + data.chngInOi]            = packet.chng_in_oi         || -1;
                floatView[b + data.totBuyQty]           = packet.tot_buy_qty        || -1;
                floatView[b + data.totSellQty]          = packet.tot_sell_qty       || -1;
                floatView[b + data.avgTradePrice]       = packet.avg_trade_price    || -1;
                floatView[b + data.high]                = packet.high_price         || -1;
                floatView[b + data.low]                 = packet.low_price          || -1;
                floatView[b + data.open]                = packet.open_price         || -1;
                floatView[b + data.prevClose]           = packet.prev_close_price   || -1;
                floatView[b + data.upperCkt]            = packet.upper_ckt          || -1;
                floatView[b + data.lowerCkt]            = packet.lower_ckt          || -1;
                floatView[b + data.exchFeedTime]        = packet.exch_feed_time     || -1;
                floatView[b + data.ch]                  = packet.ch                 || -1;
                floatView[b + data.chp]                 = packet.chp                || -1;
                
                floatView[b + data.signal]              = 0;
                floatView[b + data.action]              = 0;
                // console.log(message);
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

export default optionChainStream;