class User {
  constructor({ id, stripe_customer_id: stripeCustomerId }) {
    this.id = id;
    this.stripeCustomerId = stripeCustomerId;
  }
}

module.exports = User;
