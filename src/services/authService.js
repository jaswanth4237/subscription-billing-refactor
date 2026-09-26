const bcrypt = require('bcryptjs');
const UserModel = require('../models/UserModel');
const RoleModel = require('../models/RoleModel');
const { generateToken } = require('../utils/jwt');
const { getOAuthUser } = require('../utils/oauth');

class AuthService {
    static async register({ name, email, password }) {
        if (!email || !password || !name) {
            const err = new Error('Name, email, and password are required');
            err.status = 400;
            throw err;
        }

        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            const err = new Error('User with this email already exists');
            err.status = 409;
            throw err;
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await UserModel.create({ name, email, password_hash });

        // Assign default GRANTEE role (id = 3)
        let granteeRole = await RoleModel.findByName('GRANTEE');
        const roleId = granteeRole ? granteeRole.id : 3;
        await UserModel.assignRole(user.id, roleId);

        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }

    static async login({ email, password }) {
        if (!email || !password) {
            const err = new Error('Email and password are required');
            err.status = 400;
            throw err;
        }

        const user = await UserModel.findByEmail(email);
        if (!user || !user.password_hash) {
            const err = new Error('Invalid email or password');
            err.status = 401;
            throw err;
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const err = new Error('Invalid email or password');
            err.status = 401;
            throw err;
        }

        const roles = await UserModel.getRoles(user.id);
        const accessToken = generateToken({ userId: user.id, roles });

        return { accessToken };
    }

    static async handleOAuthCallback(provider, code) {
        if (!code) {
            const err = new Error('Authorization code is required');
            err.status = 400;
            throw err;
        }

        const oauthProfile = await getOAuthUser(provider, code);
        let user = await UserModel.findByOAuth(oauthProfile.oauth_provider, oauthProfile.oauth_id);

        if (!user) {
            user = await UserModel.findByEmail(oauthProfile.email);
        }

        if (!user) {
            user = await UserModel.create({
                name: oauthProfile.name,
                email: oauthProfile.email,
                oauth_provider: oauthProfile.oauth_provider,
                oauth_id: oauthProfile.oauth_id
            });

            let granteeRole = await RoleModel.findByName('GRANTEE');
            const roleId = granteeRole ? granteeRole.id : 3;
            await UserModel.assignRole(user.id, roleId);
        }

        const roles = await UserModel.getRoles(user.id);
        const accessToken = generateToken({ userId: user.id, roles });

        return { accessToken };
    }
}

module.exports = AuthService;
