const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Leer el token del header de la petición (x-auth-token)
    const token = req.header('x-auth-token');

    // 2. Revisar si no hay token
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso no válido' });
    }

    // 3. Validar el token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Añadimos el usuario (id y rol) a la petición para que el controlador pueda usarlo
        req.user = decoded.user;
        
        // "next()" le dice al servidor que pase a la siguiente función
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};