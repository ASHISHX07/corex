import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../../helpers/ensureAndMkdir.helper.js";
import { partialDeepStrictEqual } from "assert";

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

const symbolSlotMap = new Map();

function setupSlots(symbolsInput) {
    let slotIndex = 0;

    for(let i = 0; i < symbolsInput.length; i += 2) {
        const id = symbolsInput[i];
        const name = symbolsInput[i+1];

        symbolSlotMap.set(name, slotIndex);

        slotIndex++;
    }
}

async function optionChainStream(app_id, access_token, floatView, symbols = [], logger = false) {

    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, ensureAndMkdir(logDir), logger);

    const symbolList = [symbols[1]]

    socket.on("connect", function(){
        socket.subscribe(symbolList);
        socket.mode(socket.FullMode);
        console.log("[NODE] Subscribed to all given option chain symbols");
    })

    socket.on("message", function(message){

        if(message) {

            const slot = symbolSlotMap.get(message.symbol);

            if (slot !== undefined) {
                const baseIdx = slot * 18;

                floatView[baseIdx + data.instrument]          = symbols[0];
                floatView[baseIdx + data.ltp]                 = message.ltp                || -1;
                floatView[baseIdx + data.volume]              = message.vol_traded_today   || -1;
                floatView[baseIdx + data.oi]                  = message.oi                 || -1;
                floatView[baseIdx + data.chngInOi]            = message.chng_in_oi         || -1;
                floatView[baseIdx + data.totBuyQty]           = message.tot_buy_qty        || -1;
                floatView[baseIdx + data.totSellQty]          = message.tot_sell_qty       || -1;
                floatView[baseIdx + data.avgTradePrice]       = message.avg_trade_price    || -1;
                floatView[baseIdx + data.high]                = message.high_price         || -1;
                floatView[baseIdx + data.low]                 = message.low_price          || -1;
                floatView[baseIdx + data.open]                = message.open_price         || -1;
                floatView[baseIdx + data.prevClose]           = message.prev_close_price   || -1;
                floatView[baseIdx + data.upperCkt]            = message.upper_ckt          || -1;
                floatView[baseIdx + data.lowerCkt]            = message.lower_ckt          || -1;
                floatView[baseIdx + data.exchFeedTime]        = message.exch_feed_time     || -1;
                floatView[baseIdx + data.ch]                  = message.ch                 || -1;
                floatView[baseIdx + data.chp]                 = message.chp                || -1;
                floatView[baseIdx + data.signal]              = 0;
                floatView[baseIdx + data.action]              = 0;
                console.log(message);
            }
        }
    })

    socket.on("error", function(error) {
        console.log("Error: ", error);
    })

    socket.on("close", function() {
        console.log("Socket closed");
    })

    socket.autoreconnect(10);
    socket.connect();

}

export default optionChainStream;