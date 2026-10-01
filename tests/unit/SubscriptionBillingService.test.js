const SubscriptionBillingService = require('../../src/domain/services/SubscriptionBillingService');

const now = new Date('2023-12-15T10:00:00.000Z');

function buildService({ user = { stripeCustomerId: 'cus-123' }, subscription = {
  id: 'sub-123',
  basePrice: 100,
  expiresAt: new Date('2023-01-01T00:00:00.000Z')
}, paymentResult = true } = {}) {
  const paymentGateway = { charge: jest.fn().mockResolvedValue(paymentResult) };
  const subscriptionRepo = {
    getSubscriptionByUserId: jest.fn().mockResolvedValue(subscription),
    updateExpiration: jest.fn().mockResolvedValue(undefined)
  };
  const userRepo = { getUserById: jest.fn().mockResolvedValue(user) };
  const timeProvider = { getCurrentTime: jest.fn().mockReturnValue(now) };
  return {
    service: new SubscriptionBillingService(subscriptionRepo, userRepo, paymentGateway, timeProvider),
    paymentGateway,
    subscriptionRepo
  };
}

describe('SubscriptionBillingService', () => {
  test('applies a 10% discount in December and renews for one year', async () => {
    const { service, paymentGateway, subscriptionRepo } = buildService();

    await expect(service.processRenewal('user-123')).resolves.toEqual({
      success: true,
      message: 'Renewal successful'
    });
    expect(paymentGateway.charge).toHaveBeenCalledWith('cus-123', 90);
    expect(subscriptionRepo.updateExpiration).toHaveBeenCalledWith('sub-123', new Date('2024-12-15T10:00:00.000Z'));
  });

  test('charges the standard price outside December', async () => {
    const fixture = buildService();
    fixture.service.timeProvider.getCurrentTime = jest.fn().mockReturnValue(new Date('2024-06-15T10:00:00.000Z'));

    await fixture.service.processRenewal('user-123');

    expect(fixture.paymentGateway.charge).toHaveBeenCalledWith('cus-123', 100);
  });

  test('fails when the payment gateway declines the payment', async () => {
    const { service, paymentGateway, subscriptionRepo } = buildService({ paymentResult: false });

    await expect(service.processRenewal('user-123')).resolves.toEqual({ success: false, message: 'Payment failed' });
    expect(paymentGateway.charge).toHaveBeenCalled();
    expect(subscriptionRepo.updateExpiration).not.toHaveBeenCalled();
  });

  test('fails when the subscription is not expired', async () => {
    const { service } = buildService({ subscription: {
      id: 'sub-123', basePrice: 100, expiresAt: new Date('2024-01-01T00:00:00.000Z')
    } });

    await expect(service.processRenewal('user-123')).resolves.toEqual({
      success: false, message: 'Subscription is not yet expired'
    });
  });

  test('reports missing users and subscriptions', async () => {
    const missingUser = buildService({ user: null });
    await expect(missingUser.service.processRenewal('missing')).resolves.toEqual({ success: false, message: 'User not found' });

    const missingSubscription = buildService({ subscription: null });
    await expect(missingSubscription.service.processRenewal('missing')).resolves.toEqual({ success: false, message: 'Subscription not found' });
  });

  test('maps payment gateway exceptions to a stable business response', async () => {
    const fixture = buildService();
    fixture.paymentGateway.charge.mockRejectedValue(new Error('timeout'));

    await expect(fixture.service.processRenewal('user-123')).resolves.toEqual({
      success: false, message: 'Payment gateway error'
    });
  });
});
