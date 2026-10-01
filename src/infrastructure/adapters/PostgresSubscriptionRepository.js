const ISubscriptionRepository = require('../../domain/ports/ISubscriptionRepository');
const Subscription = require('../../domain/models/Subscription');

class PostgresSubscriptionRepository extends ISubscriptionRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async getSubscriptionByUserId(userId) {
    const result = await this.db.query(
      'SELECT id, user_id, base_price, expires_at FROM subscriptions WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] ? new Subscription(result.rows[0]) : null;
  }

  async updateExpiration(subscriptionId, newExpiry) {
    await this.db.query('UPDATE subscriptions SET expires_at = $1 WHERE id = $2', [newExpiry, subscriptionId]);
  }
}

module.exports = PostgresSubscriptionRepository;
