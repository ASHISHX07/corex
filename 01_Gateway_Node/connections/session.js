import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeRead, safeWrite } from '../helpers/fs.helper.js';
import getDateTime from '../timers/atomicClock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sessionPath = path.resolve(__dirname, '../../runtime/session.json');

async function getDateString() {
    const date = await getDateTime();
    return date.toISOString().slice(0, 10);
}
async function getTimeString() {
    const date = await getDateTime();
    return date.toLocaleTimeString().replace(' ', '');
}

async function loadCacheToken() {
    const raw = safeRead(sessionPath, '{}');
    try {
        const session = JSON.parse(raw);
        if (session.date !== await getDateString()) {
            return null;
        }
        return session.accessToken ?? null
    }
    catch {
        return null;
    }
}

async function saveToken(accessToken) {
    const session = {
        accessToken,
        date: await getDateString(),
        savedAt: await getTimeString()
    }
    safeWrite(sessionPath, JSON.stringify(session, null, 2));
}

function clearSession() {
    safeWrite(sessionPath, '{}');
}

export {loadCacheToken, saveToken, clearSession}