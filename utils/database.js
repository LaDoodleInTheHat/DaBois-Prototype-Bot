const fs = require('fs');
const { get } = require('http');
const path = require('path');
require('dotenv').config();
const { GUILD_ID } = process.env; 

const DB_PATH = path.join(__dirname, '..', 'users.json');
const usersFile = path.join(__dirname, 'users.json');

function getAllBirthdays() {
    const users = JSON.parse(fs.readFileSync(usersFile));
    return users;
}

function loadDatabase() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify({}));
        }

        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return raw.trim() ? JSON.parse(raw) : {};
    } catch (err) {
        console.error('❌ Failed to load users.json:', err);
        return {};
    }
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4));
    } catch (err) {
        console.error('❌ Failed to save users.json:', err);
    }
}

function logModeration(userId, entry) {
    const db = loadDatabase();
    if (!db[userId]) db[userId] = { moderation: [], birthday: null, pendingBirthday: false };

    db[userId].moderation.push(entry);
    saveDatabase(db);
    return db[userId].moderation.length;
}

function getModLogs(userId) {
    const db = loadDatabase();
    const entries = db[userId]?.moderation || [];

    return entries.map((entry, index) => ({
        ...entry,
        caseId: index + 1
    })).reverse(); // latest first
}

function setBirthday(userId, dateString) {
    const db = loadDatabase();
    if (!db[userId]) db[userId] = { moderation: [], birthday: null, pendingBirthday: false };

    db[userId].birthday = dateString;
    saveDatabase(db);
}

function getBirthday(userId) {
    const db = loadDatabase();
    return db[userId]?.birthday || null;
}

module.exports = {
    loadDatabase,
    saveDatabase,
    logModeration,
    getModLogs,
    setBirthday,
    getBirthday,
    getAllBirthdays,
};
