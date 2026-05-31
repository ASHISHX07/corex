import path from 'path';
import { fileURLToPath } from 'url';
import { fyersModel } from 'fyers-api-v3';
import { safeMkdir } from '../helpers/fs.helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../../runtime/logs/account');

async function getProfileInfo(app_id, access_token, checker = false, logger = false) {
    const fyers = new fyersModel({ "path": safeMkdir(logDir), "enableLogging": logger });
    fyers.setAppId(app_id);
    fyers.setAccessToken(access_token);

    // apiManagerInstance.dApiCall();

    try {
        const response = await fyers.get_profile();
        if(checker) return true;
        console.log(response);
        return true;
    }
    catch(err) {
        if(err.code == -8 || err.code == 500) {
            console.warn("\nInvalid Access Token\n");
            return false;
        }
        else if(err.code == -352) {
            console.error(`\nunexpected profile error ${err.message ?? err}\n`);
            return false;
        }
        else {
            console.error(err);
            process.exit(0);
        }
    }
}

export default getProfileInfo;