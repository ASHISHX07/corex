import path from 'path';
import { fileURLToPath } from 'url';
import { safeRead, safeWrite } from './fs.helper.js';
import getDateTime from '../timers/atomicClock.js';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const sessionPath = path.resolve(__dirname, '../../runtime/session.json');

function _read() {
    try { return JSON.parse(safeRead(sessionPath, '{}')); }
    catch { return {}; }
}

function _patch(patch) {
    let current = _read()
    const merged  = { ...current };
    for (const [k, v] of Object.entries(patch)) {
        merged[k] = (v && typeof v === 'object' && !Array.isArray(v)) ? { ...(current[k] ?? {}), ...v } : v;
    }
    safeWrite(sessionPath, JSON.stringify(merged, null, 4));
}

async function _today() {
    return (await getDateTime()).toISOString().slice(0, 10);
}

async function _now() {
    return (await getDateTime()).toLocaleTimeString().replace(' ', '');
}

async function getDateString() {
    return await _today();
}

async function loadCacheToken() {
    try {
        const s = _read();
        if (s.date !== await _today()) return null;
        return s.auth?.accessToken ?? null;
    }
    catch { return null; }
}

async function saveToken(accessToken) {
    _patch({
        date: await _today(),
        auth: { accessToken, savedAt: await _now() },
    });
}

function clearSession() {
    safeWrite(sessionPath, '{}');
}

function loadApiCounts(dateString) {
    const s = _read();
    const isToday = s.date === dateString;
    return {
        data:           isToday ? (s.APICalls?.data          ?? 0) : 0,
        transactional:  isToday ? (s.APICalls?.transactional ?? 0) : 0,
    };
}

function saveApiCounts(data, transactional) {
    _patch({ APICalls: { data, transactional } });
}

export {
    getDateString,
    loadCacheToken,
    saveToken,
    clearSession,
    loadApiCounts,
    saveApiCounts,
}