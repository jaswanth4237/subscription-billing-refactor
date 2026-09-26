const db = require('../config/db');

class UserModel {
    static async findByEmail(email) {
        const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return res.rows[0] || null;
    }

    static async findById(id) {
        const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return res.rows[0] || null;
    }

    static async findByOAuth(provider, oauthId) {
        const res = await db.query(
            'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
            [provider, oauthId]
        );
        return res.rows[0] || null;
    }

    static async create({ name, email, password_hash = null, oauth_provider = null, oauth_id = null }) {
        const res = await db.query(
            `INSERT INTO users (name, email, password_hash, oauth_provider, oauth_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, oauth_provider, oauth_id, created_at, updated_at`,
            [name, email, password_hash, oauth_provider, oauth_id]
        );
        return res.rows[0];
    }

    static async getRoles(userId) {
        const res = await db.query(
            `SELECT r.id, r.name 
       FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
            [userId]
        );
        return res.rows.map(row => row.name);
    }

    static async assignRole(userId, roleId) {
        await db.query(
            `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
            [userId, roleId]
        );
    }
}

module.exports = UserModel;
