import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fyersModel } from 'fyers-api-v3';
import { safeMkdir, safeWrite } from '../helpers/fs.helper.js';
// import { writeFileSync } from 'fs';
import { getAuthCodeM, getAccessToken } from '../connections/fyers_connect.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: path.resolve(__dirname, '../../.env')});
const logDir = path.join(__dirname, '../../Data/logs/account_logs');
const authCodeFilePath = path.resolve(__dirname, '../../Data/cache/auth_code.txt');
const accessTokenFilePath = path.resolve(__dirname, '../../Data/cache/access_token.txt');

async function getProfileInfo(app_id, access_token, checker = false, logger = false) {
    const fyers = new fyersModel({"path": safeMkdir(logDir), "enableLogging": logger});
    fyers.setAppId(app_id);
    fyers.setAccessToken(access_token);

    try {
        const response = await fyers.get_profile();
        if(checker) return true;
        console.log(response);
        return true;
    }
    catch(err) {
        if(err.code == -8 || err.code == 500) {
            console.log("\nInvalid Access Token passed, cleared access token and auth code from cache\n");
            return false;
        }
        else if(err.code == -352) {
            console.error("\nInvalid App ID provided please check you app ID \n");
            return false;
        }
        else {
            console.error(err);
            process.exit(0);
        }
    }
}

export default getProfileInfo;