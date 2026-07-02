import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeRead, safeWrite } from '../helpers/fs.helper.js';
import getDateTime from '../timers/atomicClock.js';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const sessionPath = path.resolve(__dirname, '../../runtime/session.json');

function patchSession(patch) {
    let current = {};
    try {
        current = JSON.parse(safeRead(sessionPath, '{}'));
    } catch {}
    safeWrite(sessionPath, JSON.stringify({ ...current, ...patch }, null, 2));
}

async function getDateString() {
    const date = await getDateTime();
    return date.toISOString().slice(0, 10);
}
async function getTimeString() {
    const date = await getDateTime();
    return date.toLocaleTimeString().replace(' ', '');
}

async function loadCacheToken() {
    try {
        const session = JSON.parse(safeRead(sessionPath, '{}'));
        if (session.date !== await getDateString()) return null;
        return session.accessToken ?? null;
    }
    catch { return null; }
}

async function saveToken(accessToken) {
    patchSession({
        accessToken,
        date: await getDateString(),
        savedAt: await getTimeString(),
    });
}

function clearSession() {
    patchSession({ accessToken: null, savedAt: null });
}

export {loadCacheToken, saveToken, clearSession, getDateString, patchSession}