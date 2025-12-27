const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // El usuario ya viene en req.user gracias al middleware 'auth' previo
        const user = await User.findById(req.user.id);
        
        if (user.rol !== 'administrador') {
            return res.status(403).json({ msg: 'Acceso denegado: Se requiere rol de administrador' });
        }
        
        next();
    } catch (err) {
        res.status(500).send('Error de servidor en autorización');
    }
};