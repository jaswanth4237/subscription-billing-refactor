const UserService = require('../services/userService');

class UserController {
    static async assignRole(req, res, next) {
        try {
            const { userId } = req.params;
            const { roleName } = req.body;
            const result = await UserService.assignRoleToUser(userId, roleName);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = UserController;
