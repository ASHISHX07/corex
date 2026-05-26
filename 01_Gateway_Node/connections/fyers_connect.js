import { fyersModel } from 'fyers-api-v3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout } from 'timers/promises';
import { readFileSync, writeFileSync } from "node:fs";
import ensureAndMkdir from '../helpers/fs.helper.js';

// Recreating __dirname (Because it doesn't exist in ESM) note: use CommonJS for backwards compatibility or if you're using fyer's official code guide as of fyers-api-v3 version 1.4.2
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: path.resolve(__dirname, '../../.env')});    // Load .env from the Root Directory

const authCodeFilePath = path.resolve(__dirname, '../../Data/cache/auth_code.txt');
const accessTokenFilePath = path.resolve(__dirname, '../../Data/cache/access_token.txt');
const logDir = path.join(__dirname, '../../Data/logs/login_logs');
const fyers = new fyersModel({"path": ensureAndMkdir(logDir), "enableLogging": true});

// getting auth code
async function getAuthCodeM(app_id) {

    console.log("Make sure You're logged in with the same fyers account in your browser.");    
    await setTimeout(1000);
    console.log("Generating Auth Code....\n");
    
    fyers.setAppId(app_id);
    fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URL);
    let url = fyers.generateAuthCode();

    if(!url) {
        throw new Error("error while generating auth code please check environment file path, App id and run again the program\n")
    }
    else {
        console.log(`SUCCESS: Open the below link to get the auth code and paste it in the rootDir > data > cache > auth_code.txt and wait for few seconds\nNOTE: You have one minute to paste it in the file otehrwise the program will stop executing and you've to run again.\n\n${url}\n`)
    }
}

// generate access token
async function getAccessToken(app_id) {
    let authCode;
    let timer = 0;

    try {
        while(!authCode) {
            await setTimeout(5000);
            authCode = readFileSync(authCodeFilePath, 'utf8');
            ++timer;
            if (timer >= 12) break;
        }
    } catch (error) {
        throw new Error(error);
    }
    
    await fyers.generate_access_token({
        "client_id": app_id,
        "secret_key": process.env.FYERS_SECRET_ID,
        "auth_code": authCode,
        }).then((response) => {
        if(response.code == 200) {
            fyers.setAccessToken(response.access_token);
            let { access_token } = response;
            let accessTokenCache = readFileSync(accessTokenFilePath, 'utf8');
            
            if(!accessTokenCache) {
                writeFileSync(accessTokenFilePath, access_token, 'utf8');
            }
        }
        else {  // error message handling yet to be made for frontend
            console.log("\nERROR: Invalid or outdated auth code clearing up auth code & access token cache...");
            writeFileSync(authCodeFilePath, "", 'utf8');
            writeFileSync(accessTokenFilePath, "", 'utf8');
            throw new Error("Invalid or outdated authcode cache cleared up please re-run the program");
        }
    })
}

export {
    getAuthCodeM,
    getAccessToken,
}