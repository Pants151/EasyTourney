const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Ruta: POST /api/auth/register
router.post('/register', authController.register);
// Ruta: POST /api/auth/login
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout); // <-- NUEVA RUTA DE LOGOUT
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/profile', auth, authController.getUserProfile);
router.put('/profile', auth, authController.updateUserProfile);
router.delete('/profile', auth, authController.deleteUser);
router.put('/change-password', auth, authController.changePassword);

// Ruta: GET /api/auth/users - Obtener todos los usuarios (Solo Admin)
router.get('/users', [auth, adminAuth], authController.getAllUsers);

// Ruta: GET /api/auth/users/:id - Obtener un usuario por ID (Solo Admin)
router.get('/users/:id', [auth, adminAuth], authController.getUserByIdByAdmin);

// Ruta: DELETE /api/auth/users/bulk - Eliminar múltiples usuarios (Solo Admin)
router.delete('/users/bulk', [auth, adminAuth], authController.deleteUsersBulk);

// Ruta: DELETE /api/auth/users/:id - Eliminar cualquier usuario (Solo Admin)
router.delete('/users/:id', [auth, adminAuth], authController.deleteUserByAdmin);

// Ruta: PUT /api/auth/users/:id - Actualizar cualquier usuario (Solo Admin)
router.put('/users/:id', [auth, adminAuth], authController.updateUserByAdmin);

// Ruta: PUT /api/auth/users/:id/password - Cambiar contraseña de usuario (Solo Admin)
router.put('/users/:id/password', [auth, adminAuth], authController.changeUserPasswordByAdmin);

module.exports = router;
