const UserModel = require('../models/UserModel');
const RoleModel = require('../models/RoleModel');

class UserService {
    static async assignRoleToUser(userId, roleName) {
        if (!userId || !roleName) {
            const err = new Error('User ID and roleName are required');
            err.status = 400;
            throw err;
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const role = await RoleModel.findByName(roleName.toUpperCase());
        if (!role) {
            const err = new Error(`Role '${roleName}' does not exist`);
            err.status = 400;
            throw err;
        }

        await UserModel.assignRole(userId, role.id);
        const updatedRoles = await UserModel.getRoles(userId);

        return {
            message: `Role '${roleName}' assigned successfully`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: updatedRoles
            }
        };
    }
}

module.exports = UserService;
