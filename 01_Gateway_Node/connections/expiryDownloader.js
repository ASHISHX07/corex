import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import ensureAndRead from '../helpers/ensureAndRead.helper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: path.resolve(__dirname, '../../.env')});

await ensureAndRead("../../Data/cache/holidays.json");
const holidaysJson = path.resolve(__dirname, "../../Data/cache/holidays.json");

const CAL_ID = 'en.indian#holiday@group.v.calendar.google.com';
const URL = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CAL_ID)}/events?key=${process.env.CALENDAR_API_KEY}`;

async function getExpiryDates() {
    try {
        const response = await fetch(URL);
        const data = await response.json();

        if(!data.items) throw new Error("[NODE] Could not fetch holidays");

        const holidayDates = data.items.map(event => event.start.date);

        fs.writeFileSync(holidaysJson, JSON.stringify(holidayDates, null, 2));
        console.log("[NODE] Holiday Cache Updated.");
    }

    catch (err) {
        console.error("[NODE ERROR] Google Calendar fetch failed: ", err.message);
    }
}

getExpiryDates()

export default getExpiryDates;