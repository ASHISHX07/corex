import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from 'path';

function safeMkdir(filePath) {
    const resolvedPath = path.resolve(filePath);
    if (!existsSync(resolvedPath)) {
        mkdirSync(resolvedPath, {recursive: true});
        return resolvedPath;
    }
    else {
        return resolvedPath;
    }
}

function safeRead(filePath, defaultValue = "") {
    const resolvedPath = path.resolve(filePath)
    try {
        return readFileSync(resolvedPath, 'utf8').trim();
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            const folderPath = path.dirname(resolvedPath);
            safeMkdir(folderPath);
            writeFileSync(resolvedPath, defaultValue, 'utf8');
            return resolvedPath;
        }
        else throw new Error(`Error occured while creating ${filePath}\n${error}`);
    }
}

function safeWrite(filePath, content = "") {
    const resolvedPath = path.resolve(filePath)
    try {
        writeFileSync(resolvedPath, content, 'utf8');
        return true;
    }
    catch (error) {
        if (error.code == 'ENOENT') {
            safeMkdir(path.dirname(resolvedPath))
            writeFileSync(resolvedPath, content, 'utf8');
            return true;
        }
        else throw new Error(`Error occured while creating ${filePath}\n${error}`);
    }
}

export {
    safeMkdir,
    safeRead,
    safeWrite
}