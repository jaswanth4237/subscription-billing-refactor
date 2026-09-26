const db = require('../config/db');

class GrantModel {
    static async create({ title, description, amount, grantor_id }) {
        const res = await db.query(
            `INSERT INTO grants (title, description, amount, grantor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, amount, grantor_id, created_at, updated_at`,
            [title, description, amount, grantor_id]
        );
        return res.rows[0];
    }

    static async findAll() {
        const res = await db.query(
            'SELECT id, title, description, amount, grantor_id, created_at, updated_at FROM grants ORDER BY created_at DESC'
        );
        return res.rows;
    }

    static async findById(id) {
        const res = await db.query('SELECT * FROM grants WHERE id = $1', [id]);
        return res.rows[0] || null;
    }

    static async update(id, { title, description, amount }) {
        const res = await db.query(
            `UPDATE grants
       SET title = $1, description = $2, amount = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, title, description, amount, grantor_id, created_at, updated_at`,
            [title, description, amount, id]
        );
        return res.rows[0] || null;
    }

    static async delete(id) {
        const res = await db.query('DELETE FROM grants WHERE id = $1', [id]);
        return res.rowCount > 0;
    }
}

module.exports = GrantModel;
