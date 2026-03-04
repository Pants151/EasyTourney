const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Necesitamos consultar la BD

module.exports = async function (req, res, next) {
    // 1. Leer el token del header de la petición (x-auth-token)
    const token = req.header('x-auth-token');

    // 2. Revisar si no hay token
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    // 3. Validar el token y la sesión
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // --- VALIDACIÓN DE SESIÓN ÚNICA ---
        // Buscar al usuario original en la base de datos
        const user = await User.findById(decoded.user.id);

        if (!user) {
            return res.status(401).json({ msg: 'Usuario inexistente o cuenta eliminada' });
        }

        // Si el token almacenado en base de datos ya NO coindice con el token del JWT...
        if (user.sessionToken && user.sessionToken !== decoded.user.sessionToken) {
            return res.status(401).json({ msg: 'Sesión expirada debido a un inicio de sesión desde otro dispositivo' });
        }

        // Añadimos el usuario (id y rol) a la petición para que el controlador pueda usarlo
        req.user = decoded.user;

        // "next()" le dice al servidor que pase a la siguiente función
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido o ha espirado' });
    }
};