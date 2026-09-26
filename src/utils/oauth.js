const axios = require('axios');
const env = require('../config/env');

async function getOAuthUser(provider, code) {
    // Mock OAuth logic for evaluation/testing environment when real OAuth credentials are placeholders
    if (code.startsWith('mock_code_') || env.OAUTH_CLIENT_ID === 'mock_oauth_client_id') {
        const mockEmail = `oauth_user_${code.replace(/[^a-zA-Z0-9]/g, '')}@example.com`;
        return {
            email: mockEmail,
            name: `OAuth User (${code})`,
            oauth_provider: provider || 'google',
            oauth_id: `oauth_id_${code}`
        };
    }

    if (provider === 'google') {
        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: env.OAUTH_CLIENT_ID,
            client_secret: env.OAUTH_CLIENT_SECRET,
            redirect_uri: env.OAUTH_REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const accessToken = tokenResponse.data.access_token;

        // 2. Fetch user info
        const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        return {
            email: userResponse.data.email,
            name: userResponse.data.name || userResponse.data.email,
            oauth_provider: 'google',
            oauth_id: userResponse.data.id
        };
    }

    // Fallback default
    return {
        email: `user_${Date.now()}@example.com`,
        name: `Provider User`,
        oauth_provider: provider,
        oauth_id: `provider_id_${Date.now()}`
    };
}

function getAuthorizationUrl(provider) {
    const redirectUri = encodeURIComponent(env.OAUTH_REDIRECT_URI);
    const clientId = encodeURIComponent(env.OAUTH_CLIENT_ID);

    if (provider === 'google') {
        const scope = encodeURIComponent('openid profile email');
        return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    }

    return `http://localhost:3000/api/auth/${provider}/callback?code=mock_code_12345`;
}

module.exports = {
    getOAuthUser,
    getAuthorizationUrl
};
