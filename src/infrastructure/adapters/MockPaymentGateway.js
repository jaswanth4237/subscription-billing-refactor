const IPaymentGateway = require('../../domain/ports/IPaymentGateway');

class MockPaymentGateway extends IPaymentGateway {
  async charge(customerId, amount) {
    if (!customerId || !Number.isFinite(amount)) return false;
    return true;
  }
}

module.exports = MockPaymentGateway;
