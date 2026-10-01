require('dotenv').config();

const createApp = require('./app');
const db = require('../infrastructure/database/db');
const PostgresSubscriptionRepository = require('../infrastructure/adapters/PostgresSubscriptionRepository');
const PostgresUserRepository = require('../infrastructure/adapters/PostgresUserRepository');
const MockPaymentGateway = require('../infrastructure/adapters/MockPaymentGateway');
const SystemTimeProvider = require('../infrastructure/adapters/SystemTimeProvider');

const app = createApp({
  subscriptionRepo: new PostgresSubscriptionRepository(db),
  userRepo: new PostgresUserRepository(db),
  paymentGateway: new MockPaymentGateway(),
  timeProvider: new SystemTimeProvider()
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Subscription billing API listening on port ${port}`));
}

module.exports = app;
