const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/:appId', authMiddleware, ApplicationController.getApplicationById);

module.exports = router;
