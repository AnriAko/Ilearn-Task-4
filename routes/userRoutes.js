const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// user table control
router
	.route('/api/v1/users')
	.get(authController.protect, userController.getAllUsers)
	.patch(authController.protect, userController.editUsers)
	.delete(authController.protect, userController.deleteUsers);

router
	.route('/api/v1/signup')
	.post(authController.signup);

router
	.route('/api/v1/login')
	.post(authController.login);

module.exports = router;