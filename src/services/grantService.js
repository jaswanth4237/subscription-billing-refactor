const GrantModel = require('../models/GrantModel');

class GrantService {
    static async createGrant({ title, description, amount, grantor_id }) {
        if (!title || !description || amount === undefined || amount === null) {
            const err = new Error('Title, description, and amount are required');
            err.status = 400;
            throw err;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 0) {
            const err = new Error('Amount must be a non-negative number');
            err.status = 400;
            throw err;
        }

        return await GrantModel.create({
            title,
            description,
            amount: numericAmount,
            grantor_id
        });
    }

    static async getAllGrants() {
        return await GrantModel.findAll();
    }

    static async getGrantById(id) {
        const grant = await GrantModel.findById(id);
        if (!grant) {
            const err = new Error('Grant not found');
            err.status = 404;
            throw err;
        }
        return grant;
    }

    static async updateGrant(id, { title, description, amount }, userId) {
        const grant = await GrantModel.findById(id);
        if (!grant) {
            const err = new Error('Grant not found');
            err.status = 404;
            throw err;
        }

        if (grant.grantor_id !== userId) {
            const err = new Error('Forbidden: Only the GRANTOR who owns this grant can update it');
            err.status = 403;
            throw err;
        }

        const updatedTitle = title !== undefined ? title : grant.title;
        const updatedDescription = description !== undefined ? description : grant.description;
        const updatedAmount = amount !== undefined ? parseFloat(amount) : grant.amount;

        return await GrantModel.update(id, {
            title: updatedTitle,
            description: updatedDescription,
            amount: updatedAmount
        });
    }

    static async deleteGrant(id, userId, userRoles = []) {
        const grant = await GrantModel.findById(id);
        if (!grant) {
            const err = new Error('Grant not found');
            err.status = 404;
            throw err;
        }

        const isAdmin = userRoles.includes('ADMIN');
        const isOwner = grant.grantor_id === userId;

        if (!isAdmin && !isOwner) {
            const err = new Error('Forbidden: Only the grant owner or an ADMIN can delete this grant');
            err.status = 403;
            throw err;
        }

        await GrantModel.delete(id);
        return { message: 'Grant deleted successfully' };
    }
}

module.exports = GrantService;
