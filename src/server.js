const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

const PORT = env.PORT || 3000;

async function startServer() {
    try {
        // Initialize DB schema & seeds automatically
        await db.initSchemaAndSeed();
        console.log('Database initialized and seeded.');

        const server = app.listen(PORT, () => {
            console.log(`Grant Management Portal Server listening on port ${PORT} [${env.NODE_ENV}]`);
        });

        return server;
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = startServer;
