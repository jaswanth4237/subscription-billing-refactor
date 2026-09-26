const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://grant_user:grant_password@localhost:5432/grant_db',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USER: process.env.DB_USER || 'grant_user',
    DB_PASSWORD: process.env.DB_PASSWORD || 'grant_password',
    DB_NAME: process.env.DB_NAME || 'grant_db',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    JWT_SECRET: process.env.JWT_SECRET || 'default_super_secret_jwt_key_2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID || 'mock_oauth_client_id',
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET || 'mock_oauth_client_secret',
    OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
};
