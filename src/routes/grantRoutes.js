const express = require('express');
const router = express.Router();
const GrantController = require('../controllers/grantController');
const ApplicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/rbacMiddleware');

// Grant CRUD
router.post('/', authMiddleware, requireRoles('GRANTOR'), GrantController.createGrant);
router.get('/', authMiddleware, requireRoles('GRANTEE', 'GRANTOR', 'ADMIN'), GrantController.getAllGrants);
router.get('/:grantId', authMiddleware, requireRoles('GRANTEE', 'GRANTOR', 'ADMIN'), GrantController.getGrantById);
router.put('/:grantId', authMiddleware, requireRoles('GRANTOR'), GrantController.updateGrant);
router.delete('/:grantId', authMiddleware, requireRoles('GRANTOR', 'ADMIN'), GrantController.deleteGrant);

// Applications under grants
router.post('/:grantId/apply', authMiddleware, requireRoles('GRANTEE'), ApplicationController.applyForGrant);
router.get('/:grantId/applications', authMiddleware, requireRoles('GRANTOR'), ApplicationController.getApplicationsForGrant);

module.exports = router;
