const AuthService = require('../services/authService');
const { getAuthorizationUrl } = require('../utils/oauth');

class AuthController {
    static async register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            const user = await AuthService.register({ name, email, password });
            return res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login({ email, password });
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    static async redirectToProvider(req, res, next) {
        try {
            const provider = req.params.provider || 'google';
            const url = getAuthorizationUrl(provider);
            return res.redirect(url);
        } catch (err) {
            next(err);
        }
    }

    static async handleProviderCallback(req, res, next) {
        try {
            const provider = req.params.provider || 'google';
            const code = req.query.code;
            const result = await AuthService.handleOAuthCallback(provider, code);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = AuthController;
