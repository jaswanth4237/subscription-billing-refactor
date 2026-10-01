class Subscription {
  constructor({ id, user_id: userId, base_price: basePrice, expires_at: expiresAt }) {
    this.id = id;
    this.userId = userId;
    this.basePrice = Number(basePrice);
    this.expiresAt = new Date(expiresAt);
  }
}

module.exports = Subscription;
