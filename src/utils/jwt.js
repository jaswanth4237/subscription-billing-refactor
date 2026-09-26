const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generateToken(payload) {
    const tokenPayload = {
        userId: payload.userId || payload.id,
        roles: payload.roles || []
    };

    return jwt.sign(tokenPayload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN || '24h'
    });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};
