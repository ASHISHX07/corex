import path from "path";
import { fileURLToPath } from "url";
import { safeRead, safeWrite } from "./fs.helper.js";
import { getDateString } from "../connections/session.js";
import { Session } from "inspector";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const sessionPath = path.resolve(__dirname, '../../runtime/session.json');
const session     = JSON.parse(safeRead(sessionPath));
const dateString  = await getDateString();

class apiManager {
    #data;
    #transactional;

    constructor() {
        const isToday = session.date === dateString;
        // If session is from previous day, start fresh
        this.#data          = isToday ? Math.max(session?.APICalls?.data ?? 0, 0) : 0;
        this.#transactional = isToday ? Math.max(session?.APICalls?.transactional ?? 0, 0) : 0;
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
        session.date        = dateString;   // ← always stamp today's date
        session.APICalls    = {
            data:           this.#data,
            transactional:  this.#transactional
        };
        safeWrite(sessionPath, JSON.stringify(session, null, 2));
    }
}

export default apiManager;