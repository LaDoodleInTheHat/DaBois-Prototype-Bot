const { Events, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const { loadDatabase, saveDatabase } = require('./database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { ANNOUNCEMENT_CHANNEL } = process.env;

// Manual birthday check runner
async function runBirthdayCheck(client) {
    const db = loadDatabase();
    const today = new Date();
    const todayKey = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    console.log(`Running birthday check for ${todayKey}`);

    for (const userId in db) {
        const userData = db[userId];
        if (userData.birthday === todayKey && !userData.birthdayAnnounced) {
            userData.pendingBirthday = true;
            saveDatabase(db);
        }
    }
}

// Listen for user online and announce birthday
function setupPresenceMonitor(client) {
    
}

// Cron to reset announcement flags and mark birthdays for the day
function setupDailyBirthdayCron(client) {
    cron.schedule('0 0 * * *', () => {
        runBirthdayCheck(client);
        // Reset birthdayAnnounced flags
        const db = loadDatabase();
        for (const userId in db) {
            db[userId].birthdayAnnounced = false;
        }
        saveDatabase(db);
    });
}

module.exports = {
    runBirthdayCheck,
    setupPresenceMonitor,
    setupDailyBirthdayCron
};
