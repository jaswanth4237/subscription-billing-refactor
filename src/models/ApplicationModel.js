const db = require('../config/db');

class ApplicationModel {
    static async create({ grant_id, grantee_id, proposal, status = 'submitted' }) {
        const res = await db.query(
            `INSERT INTO applications (grant_id, grantee_id, proposal, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, grant_id, grantee_id, proposal, status, created_at, updated_at`,
            [grant_id, grantee_id, proposal, status]
        );
        return res.rows[0];
    }

    static async findById(id) {
        const res = await db.query('SELECT * FROM applications WHERE id = $1', [id]);
        return res.rows[0] || null;
    }

    static async findByGrantId(grantId) {
        const res = await db.query(
            'SELECT id, grant_id, grantee_id, proposal, status, created_at, updated_at FROM applications WHERE grant_id = $1 ORDER BY created_at DESC',
            [grantId]
        );
        return res.rows;
    }

    static async findByGranteeId(granteeId) {
        const res = await db.query(
            'SELECT id, grant_id, grantee_id, proposal, status, created_at, updated_at FROM applications WHERE grantee_id = $1 ORDER BY created_at DESC',
            [granteeId]
        );
        return res.rows;
    }
}

module.exports = ApplicationModel;
