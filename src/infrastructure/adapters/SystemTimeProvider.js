const ITimeProvider = require('../../domain/ports/ITimeProvider');

class SystemTimeProvider extends ITimeProvider {
  getCurrentTime() {
    return new Date();
  }
}

module.exports = SystemTimeProvider;
