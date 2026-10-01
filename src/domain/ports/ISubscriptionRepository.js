class ISubscriptionRepository {
  async getSubscriptionByUserId() {
    throw new Error('ISubscriptionRepository.getSubscriptionByUserId must be implemented');
  }

  async updateExpiration() {
    throw new Error('ISubscriptionRepository.updateExpiration must be implemented');
  }
}

module.exports = ISubscriptionRepository;
