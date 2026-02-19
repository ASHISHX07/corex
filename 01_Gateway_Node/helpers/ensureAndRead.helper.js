import { existsSync, mkdirSync, readFileSync, writeFileSync, } from "node:fs";
import path from 'path';

export default async function ensureAndRead(filePath) {
    try {
        return readFileSync(filePath, 'utf8').trim();
    }
    catch (error) {
        if (error.code == 'ENOENT') {
            const folderPath = path.dirname(filePath)
            if(!existsSync(folderPath)) {
                mkdirSync(folderPath, {recursive: true});
            }
            writeFileSync(filePath, "", 'utf8');
            return "";
        }
        else throw new Error(`Error occured while creating ${filePath}`)
    }
}