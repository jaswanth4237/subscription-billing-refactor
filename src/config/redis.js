const redis = require('redis');
const env = require('./env');

let client = null;
const memoryStore = new Map();

if (process.env.NODE_ENV !== 'test') {
    try {
        client = redis.createClient({
            url: env.REDIS_URL || `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`
        });

        client.on('error', (err) => {
            console.warn('Redis Client Error, falling back to memory store:', err.message);
        });

        client.connect().catch((err) => {
            console.warn('Could not connect to Redis, using in-memory store fallback:', err.message);
        });
    } catch (e) {
        console.warn('Redis initialization error:', e.message);
    }
}

async function get(key) {
    try {
        if (client && client.isOpen) {
            return await client.get(key);
        }
    } catch (e) {
        // fallback
    }
    return memoryStore.get(key) || null;
}

async function set(key, value, durationSeconds = 3600) {
    try {
        if (client && client.isOpen) {
            return await client.set(key, value, { EX: durationSeconds });
        }
    } catch (e) {
        // fallback
    }
    memoryStore.set(key, value);
    return 'OK';
}

async function del(key) {
    try {
        if (client && client.isOpen) {
            return await client.del(key);
        }
    } catch (e) {
        // fallback
    }
    memoryStore.delete(key);
    return 1;
}

async function disconnect() {
    if (client && client.isOpen) {
        await client.disconnect();
    }
}

module.exports = {
    get,
    set,
    del,
    disconnect,
    client
};
