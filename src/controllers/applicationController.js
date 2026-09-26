const ApplicationService = require('../services/applicationService');

class ApplicationController {
    static async applyForGrant(req, res, next) {
        try {
            const { grantId } = req.params;
            const { proposal } = req.body;
            const grantee_id = req.user.userId;
            const application = await ApplicationService.applyForGrant({
                grant_id: grantId,
                grantee_id,
                proposal
            });
            return res.status(201).json(application);
        } catch (err) {
            next(err);
        }
    }

    static async getApplicationsForGrant(req, res, next) {
        try {
            const { grantId } = req.params;
            const grantorId = req.user.userId;
            const applications = await ApplicationService.getApplicationsForGrant(grantId, grantorId);
            return res.status(200).json(applications);
        } catch (err) {
            next(err);
        }
    }

    static async getApplicationById(req, res, next) {
        try {
            const { appId } = req.params;
            const userId = req.user.userId;
            const roles = req.user.roles || [];
            const application = await ApplicationService.getApplicationById(appId, userId, roles);
            return res.status(200).json(application);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ApplicationController;
