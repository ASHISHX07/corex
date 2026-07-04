import { getDateString, loadApiCounts, saveApiCounts } from "./session.js";

const dateString  = await getDateString();

class apiManager {
    #data;
    #transactional;

    constructor() {
        const counts        = loadApiCounts(dateString);
        this.#data          = counts.data;
        this.#transactional = counts.transactional;
    }

    dApiCall() { this.#data++; }
    tApiCall() { this.#transactional++; }
    getCounts() { return { data: this.#data, transactional: this.#transactional }; }
    resetCount() { this.#data = 0; this.#transactional = 0; }
    finish() { saveApiCounts(this.#data, this.#transactional); }
}

export default apiManager;