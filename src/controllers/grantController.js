const GrantService = require('../services/grantService');

class GrantController {
    static async createGrant(req, res, next) {
        try {
            const { title, description, amount } = req.body;
            const grantor_id = req.user.userId;
            const grant = await GrantService.createGrant({ title, description, amount, grantor_id });
            return res.status(201).json(grant);
        } catch (err) {
            next(err);
        }
    }

    static async getAllGrants(req, res, next) {
        try {
            const grants = await GrantService.getAllGrants();
            return res.status(200).json(grants);
        } catch (err) {
            next(err);
        }
    }

    static async getGrantById(req, res, next) {
        try {
            const { grantId } = req.params;
            const grant = await GrantService.getGrantById(grantId);
            return res.status(200).json(grant);
        } catch (err) {
            next(err);
        }
    }

    static async updateGrant(req, res, next) {
        try {
            const { grantId } = req.params;
            const { title, description, amount } = req.body;
            const userId = req.user.userId;
            const updatedGrant = await GrantService.updateGrant(grantId, { title, description, amount }, userId);
            return res.status(200).json(updatedGrant);
        } catch (err) {
            next(err);
        }
    }

    static async deleteGrant(req, res, next) {
        try {
            const { grantId } = req.params;
            const userId = req.user.userId;
            const roles = req.user.roles || [];
            const result = await GrantService.deleteGrant(grantId, userId, roles);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = GrantController;
