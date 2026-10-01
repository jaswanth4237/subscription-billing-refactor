class IUserRepository {
  async getUserById() {
    throw new Error('IUserRepository.getUserById must be implemented');
  }
}

module.exports = IUserRepository;
