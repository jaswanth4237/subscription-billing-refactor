const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRoles } = require('../middlewares/rbacMiddleware');

router.post('/:userId/roles', authMiddleware, requireRoles('ADMIN'), UserController.assignRole);

module.exports = router;
