import { fyersModel } from 'fyers-api-v3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ensureAndMkdir from '../helpers/ensureAndMkdir.helper.js';
import { writeFileSync } from 'fs';
import { getAuthCodeM, getAccessToken } from '../connections/fyers_connect.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: path.resolve(__dirname, '../../.env')});    // Load .env from the Root Directory
const logDir = path.join(__dirname, '../../Data/logs/account_logs');
const authCodeFilePath = path.resolve(__dirname, '../../Data/cache/auth_code.txt');
const accessTokenFilePath = path.resolve(__dirname, '../../Data/cache/access_token.txt');

async function getProfileInfo(app_id, access_token, checker = false, logger = false) {
    const fyers = new fyersModel({"path": ensureAndMkdir(logDir), "enableLogging": logger});
    fyers.setAppId(app_id);
    fyers.setAccessToken(access_token);

    try {
        const response = await fyers.get_profile();
        if(checker) return true;
        console.log(response);
    }
    catch(err) {
        if(err.code == -8) {
            writeFileSync(accessTokenFilePath, '', 'utf8');
            writeFileSync(authCodeFilePath, '', 'utf8');
            console.log("\nInvalid Access Token passed, cleared access token and auth code from cache\n");
            writeFileSync(authCodeFilePath, '', 'utf8');
            writeFileSync(accessTokenFilePath, '', 'utf8');
            console.log("generating new auth code...\n");
            await getAuthCodeM(app_id);
            await getAccessToken(app_id);
        }
        else if(err.code == -352) {
            console.error("\nInvalid App ID provided please check you app ID \n");
            process.exit(0);
        }
        else if(err.code == 500) {
            console.error("\nERROR: likely because of invalid access token or from fyers side issue, clearing up cache please rerun the program\nif this issue persists please check official updates from fyers\n");
            writeFileSync(accessTokenFilePath, '', 'utf8');
            writeFileSync(authCodeFilePath, '', 'utf8');
            process.exit(0);
        }
        else {
            console.error(err);
            process.exit(0);
        }
    }
}

export default getProfileInfo;