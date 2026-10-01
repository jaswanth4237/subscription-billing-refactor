class IPaymentGateway {
  async charge() {
    throw new Error('IPaymentGateway.charge must be implemented');
  }
}

module.exports = IPaymentGateway;
