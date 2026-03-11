import ntpClient from "ntp-client";

/**
 * Gets the current time from Atomic clocks.
 * @returns {Promise<Date>} 
 */

async function getDateTime() {
    return new Promise((resolve, reject) => {
        ntpClient.getNetworkTime("time.google.com", 123, (err, date) => {
            if (err) {
                return reject(err);
            }
            resolve(date);
            
        });
    });
}

export default getDateTime;