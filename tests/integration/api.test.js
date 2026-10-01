const request = require('supertest');
const createApp = require('../../src/api/app');

function createTestApp() {
  const subscription = {
    id: 'sub-1', basePrice: 100, expiresAt: new Date('2020-01-01T00:00:00Z')
  };
  return createApp({
    userRepo: { getUserById: jest.fn().mockResolvedValue({ stripeCustomerId: 'cus-1' }) },
    subscriptionRepo: {
      getSubscriptionByUserId: jest.fn().mockResolvedValue(subscription),
      updateExpiration: jest.fn().mockResolvedValue(undefined)
    },
    paymentGateway: { charge: jest.fn().mockResolvedValue(true) },
    timeProvider: { getCurrentTime: jest.fn().mockReturnValue(new Date('2024-06-01T00:00:00Z')) }
  });
}

test('POST /api/renew exposes the injected billing service', async () => {
  const response = await request(createTestApp()).post('/api/renew').send({ userId: 'user-1' });
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ success: true, message: 'Renewal successful' });
});

test('POST /api/renew validates userId', async () => {
  const response = await request(createTestApp()).post('/api/renew').send({});
  expect(response.status).toBe(400);
  expect(response.body.message).toBe('userId is required');
});
