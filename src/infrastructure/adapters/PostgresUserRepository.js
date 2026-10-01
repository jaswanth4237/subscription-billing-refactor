const IUserRepository = require('../../domain/ports/IUserRepository');
const User = require('../../domain/models/User');

class PostgresUserRepository extends IUserRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async getUserById(userId) {
    const result = await this.db.query('SELECT id, stripe_customer_id FROM users WHERE id = $1', [userId]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }
}

module.exports = PostgresUserRepository;
