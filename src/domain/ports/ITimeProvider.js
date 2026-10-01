class ITimeProvider {
  getCurrentTime() {
    throw new Error('ITimeProvider.getCurrentTime must be implemented');
  }
}

module.exports = ITimeProvider;
