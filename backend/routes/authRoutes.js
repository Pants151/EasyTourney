const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Ruta: POST /api/auth/register
router.post('/register', authController.register);
// Ruta: POST /api/auth/login
router.post('/login', authController.login);
router.get('/profile', auth, authController.getUserProfile);
router.put('/profile', auth, authController.updateUserProfile);
router.delete('/profile', auth, authController.deleteUser);
router.put('/change-password', auth, authController.changePassword);

// Ruta: GET /api/auth/users - Obtener todos los usuarios (Solo Admin)
router.get('/users', [auth, adminAuth], authController.getAllUsers);

// Ruta: DELETE /api/auth/users/:id - Eliminar cualquier usuario (Solo Admin)
router.delete('/users/:id', [auth, adminAuth], authController.deleteUserByAdmin);

module.exports = router;