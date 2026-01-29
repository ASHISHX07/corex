import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from "../../helpers/ensureAndMkdir.helper.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../../Data/logs/stream_logs/option-chain-logs');

async function optionChainStream(app_id, access_token, floatView, symbols = [], lite = false, logger = false) {
    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, ensureAndMkdir(logDir), logger);

    socket.on("connect", function(){
        socket.subscribe(symbols);
        socket.mode(socket.FullMode);
        console.log("[NODE] Subscribed to all given option chain symbols");
    })

    socket.on("message", function(message){
        // const data = Array.isArray(message) ? message[0] : message;

        // if(data) {
        //     floatView[0] = data.ltp
        // }
        console.log(message);
        
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