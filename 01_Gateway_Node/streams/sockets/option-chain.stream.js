import { fyersDataSocket } from "fyers-api-v3";
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from '../../helpers/ensureAndMkdir.helper.js';

async function optionChainStream(app_id, access_token, symbol, lite = false) {
    let socket = fyersDataSocket.getInstance(`${app_id}:${access_token}`, )
}