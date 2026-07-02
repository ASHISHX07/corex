import path from "path";
import { fileURLToPath } from "url";
import { safeRead, safeWrite } from "./fs.helper.js";
import { getDateString, patchSession } from "../connections/session.js";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const sessionPath = path.resolve(__dirname, '../../runtime/session.json');
const dateString  = await getDateString();

class apiManager {
    #data;
    #transactional;

    constructor() {
        try {
            const session       = JSON.parse(safeRead(sessionPath, ''));
            const isToday       = session.date === dateString;
            // If session is from previous day, start fresh
            this.#data          = isToday ? (session?.APICalls?.data ?? 0) : 0;
            this.#transactional = isToday ? (session?.APICalls?.transactional ?? 0) : 0;
        } catch {
            this.#data = 0;
            this.#transactional = 0;
        }
    }

    dApiCall() {
        this.#data++;
    }

    tApiCall() {
        this.#transactional++;
    }

    getCounts() {
        return {
            data: this.#data,
            transactional: this.#transactional
        };
    }

    resetCount() {
        this.#data = 0;
        this.#transactional = 0;
    }

    finish() {
        patchSession({
            APICalls: { data: this.#data, transactional: this.#transactional }
        });
    }
}

export default apiManager;