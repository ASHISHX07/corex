import ntpClient from "ntp-client";

/**
 * Gets the current time from Atomic clocks.
 * @returns {Promise<Date>} 
 */

async function getDateTime() {
    return new Promise((resolve, reject) => {
        ntpClient.getNetworkTime("time.google.com", 123, (err, date) => {
            if (err) {
                console.warn('[CLOCK] NTP failed, falling back to system time: ', err.message);
                resolve(new Date());
            }
            else {
                resolve(date);
            }
        });
    });
}

export default getDateTime;