class apiManager {
    #data = 0;
    #transactional = 0;

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
}

export default apiManager;