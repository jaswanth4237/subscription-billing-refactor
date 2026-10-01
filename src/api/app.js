const express = require('express');
const SubscriptionBillingService = require('../domain/services/SubscriptionBillingService');

function createApp({ subscriptionRepo, userRepo, paymentGateway, timeProvider }) {
  const app = express();
  app.use(express.json());
  const service = new SubscriptionBillingService(subscriptionRepo, userRepo, paymentGateway, timeProvider);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/api/renew', async (req, res) => {
    const { userId } = req.body || {};
    if (typeof userId !== 'string' || userId.length === 0) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const result = await service.processRenewal(userId);
    return res.status(result.success ? 200 : 400).json(result);
  });

  return app;
}

module.exports = createApp;
