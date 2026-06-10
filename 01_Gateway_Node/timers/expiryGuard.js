import path from 'path';
import { fileURLToPath } from 'url';
import { safeRead, safeWrite } from '../helpers/fs.helper.js';
import getDateTime from './atomicClock.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../Config/option-config.json');

export default async function expiryGuard() {
    let date = await getDateTime();
    const config = JSON.parse(safeRead(configPath));
    const nowSec = Math.floor(date.getTime()) / 1000;

    const validIndices = config.expiries.reduce((acc, _, i) => {
        if (config.expiryTimeStamps[i] > nowSec) acc.push(i);
        return acc;
    }, []);

    if (validIndices.length === config.expiries.length) return;

    config.expiries         = validIndices.map(i => config.expiries[i]);
    config.expiryTimeStamps = validIndices.map(i => config.expiryTimeStamps[i]);

    safeWrite(configPath, JSON.stringify(config, null, 4));
    console.log(`[EXPIRY GUARD] Pruned. Active -> ${config.expiries[0].day}-${config.expiries[0].month}-20${config.expiries[0].year}`);
}
