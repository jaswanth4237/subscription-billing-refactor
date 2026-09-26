const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Flexible OAuth callback endpoints
router.get('/:provider/callback', AuthController.handleProviderCallback);
router.get('/:provider', AuthController.redirectToProvider);

module.exports = router;
