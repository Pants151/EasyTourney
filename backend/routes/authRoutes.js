const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Ruta: POST /api/auth/register
router.post('/register', authController.register);
// Ruta: POST /api/auth/login
router.post('/login', authController.login);
router.get('/profile', auth, authController.getUserProfile);
router.put('/profile', auth, authController.updateUserProfile);
router.delete('/profile', auth, authController.deleteUser);

module.exports = router;