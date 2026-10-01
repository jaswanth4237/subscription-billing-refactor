class SubscriptionBillingService {
  constructor(subscriptionRepo, userRepo, paymentGateway, timeProvider) {
    this.subscriptionRepo = subscriptionRepo;
    this.userRepo = userRepo;
    this.paymentGateway = paymentGateway;
    this.timeProvider = timeProvider;
  }

  async processRenewal(userId) {
    const user = await this.userRepo.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const subscription = await this.subscriptionRepo.getSubscriptionByUserId(userId);
    if (!subscription) return { success: false, message: 'Subscription not found' };

    const now = this.timeProvider.getCurrentTime();
    if (subscription.expiresAt > now) {
      return { success: false, message: 'Subscription is not yet expired' };
    }

    const amount = now.getMonth() === 11 ? subscription.basePrice * 0.9 : subscription.basePrice;
    try {
      const paid = await this.paymentGateway.charge(user.stripeCustomerId, amount);
      if (!paid) return { success: false, message: 'Payment failed' };

      const newExpiry = new Date(now);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      await this.subscriptionRepo.updateExpiration(subscription.id, newExpiry);
      return { success: true, message: 'Renewal successful' };
    } catch (error) {
      return { success: false, message: 'Payment gateway error' };
    }
  }
}

module.exports = SubscriptionBillingService;
