const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

module.exports = async function (req, res, next) {
    // Leer token del header x-auth-token
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    // Validar token y sesión
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.user.id);

        if (!user) {
            return res.status(401).json({ msg: 'Usuario inexistente o cuenta eliminada' });
        }

        // Token invalidado por login en otro dispositivo
        if (user.sessionToken && user.sessionToken !== decoded.user.sessionToken) {
            return res.status(401).json({ msg: 'Sesión expirada debido a un inicio de sesión desde otro dispositivo' });
        }

        // Adjuntar usuario a la request
        req.user = decoded.user;

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido o ha espirado' });
    }
};