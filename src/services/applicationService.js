const ApplicationModel = require('../models/ApplicationModel');
const GrantModel = require('../models/GrantModel');

class ApplicationService {
    static async applyForGrant({ grant_id, grantee_id, proposal }) {
        if (!proposal || !proposal.trim()) {
            const err = new Error('Proposal text is required');
            err.status = 400;
            throw err;
        }

        const grant = await GrantModel.findById(grant_id);
        if (!grant) {
            const err = new Error('Grant not found');
            err.status = 404;
            throw err;
        }

        return await ApplicationModel.create({
            grant_id,
            grantee_id,
            proposal,
            status: 'submitted'
        });
    }

    static async getApplicationsForGrant(grantId, grantorId) {
        const grant = await GrantModel.findById(grantId);
        if (!grant) {
            const err = new Error('Grant not found');
            err.status = 404;
            throw err;
        }

        if (grant.grantor_id !== grantorId) {
            const err = new Error('Forbidden: Only the GRANTOR who owns this grant can view its applications');
            err.status = 403;
            throw err;
        }

        return await ApplicationModel.findByGrantId(grantId);
    }

    static async getApplicationById(appId, userId, userRoles = []) {
        const application = await ApplicationModel.findById(appId);
        if (!application) {
            const err = new Error('Application not found');
            err.status = 404;
            throw err;
        }

        const grant = await GrantModel.findById(application.grant_id);
        const isGrantee = application.grantee_id === userId;
        const isGrantorOwner = grant && grant.grantor_id === userId;
        const isAdmin = userRoles.includes('ADMIN');

        if (!isGrantee && !isGrantorOwner && !isAdmin) {
            const err = new Error('Forbidden: You are not authorized to view this application');
            err.status = 403;
            throw err;
        }

        return application;
    }
}

module.exports = ApplicationService;
