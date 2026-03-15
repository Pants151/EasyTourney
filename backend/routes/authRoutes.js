const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/profile', auth, authController.getUserProfile);
router.put('/profile', auth, authController.updateUserProfile);
router.delete('/profile', auth, authController.deleteUser);
router.put('/change-password', auth, authController.changePassword);

router.get('/users', [auth, adminAuth], authController.getAllUsers);
router.get('/users/:id', [auth, adminAuth], authController.getUserByIdByAdmin);
router.delete('/users/bulk', [auth, adminAuth], authController.deleteUsersBulk);
router.delete('/users/:id', [auth, adminAuth], authController.deleteUserByAdmin);
router.put('/users/:id', [auth, adminAuth], authController.updateUserByAdmin);
router.put('/users/:id/password', [auth, adminAuth], authController.changeUserPasswordByAdmin);

module.exports = router;
