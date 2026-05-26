import { existsSync, mkdirSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from 'path';

function safeMkdir(filePath) {
    const folderPath = path.resolve(filePath)
    if (!existsSync(folderPath)) {
        mkdirSync(folderPath, {recursive: true});
        return folderPath
    }
    else {
        return folderPath;
    }
}

function safeRead(filePath) {
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

export {
    ensureAndMkdir,
    ensureAndRead
}