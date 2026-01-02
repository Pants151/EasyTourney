const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lógica de Registro
exports.register = async (req, res) => {
    try {
        const { username, email, password, pais, fechaNacimiento, rol } = req.body;

        // 1. Verificar si el correo ya existe
        let userEmail = await User.findOne({ email });
        if (userEmail) {
            return res.status(400).json({ msg: 'Este correo electrónico ya está registrado.' }); //
        }

        // 2. Verificar si el nombre de usuario ya existe
        let userUsername = await User.findOne({ username });
        if (userUsername) {
            return res.status(400).json({ msg: 'El nombre de usuario ya está en uso.' }); // Nuevo control
        }

        // 3. Crear el nuevo usuario
        const user = new User({
            username,
            email,
            password,
            pais,
            fechaNacimiento,
            rol
        });

        // 4. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt); //

        // 5. Guardar en la base de datos
        await user.save(); //

        res.status(201).json({ msg: 'Usuario registrado correctamente' }); //

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Lógica de Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Verificar si el usuario existe
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // 2. Comparar la contraseña ingresada con la encriptada en la BD
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // 3. Si todo es correcto, crear el JWT
        const payload = {
            user: {
                id: user.id,
                rol: user.rol // Importante para EasyTourney para saber si es organizador
            }
        };

        // Firmar el token (expira en 24 horas)
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 86400 },
            (err, token) => {
                if (err) throw err;
                // DEVOLVEMOS TAMBIÉN EL USUARIO
                res.json({
                    token,
                    user: { id: user.id, username: user.username, rol: user.rol }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Obtener perfil del usuario actual
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Error al obtener el perfil');
    }
};

// Actualizar perfil con comprobación de duplicados
exports.updateUserProfile = async (req, res) => {
    const { username, email, pais, fechaNacimiento } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Validar si el nuevo username ya existe en OTRO usuario diferente al actual
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username, _id: { $ne: req.user.id } });
            if (existingUsername) return res.status(400).json({ msg: 'El nombre de usuario ya está en uso.' });
        }

        // Validar si el nuevo email ya existe en OTRO usuario diferente al actual
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingEmail) return res.status(400).json({ msg: 'El correo electrónico ya está en uso.' });
        }

        user.username = username || user.username;
        user.email = email || user.email;
        user.pais = pais || user.pais;
        user.fechaNacimiento = fechaNacimiento || user.fechaNacimiento;

        await user.save();
        res.json({ id: user.id, username: user.username, rol: user.rol, email: user.email });
    } catch (err) {
        res.status(500).send('Error al actualizar perfil');
    }
};

// Función auxiliar para realizar el borrado en cascada
const performCascadeDelete = async (userId) => {
    // 1. Si es organizador: Borrar sus torneos y todo lo que contienen
    const userTournaments = await Tournament.find({ organizador: userId });
    for (const tournament of userTournaments) {
        await Match.deleteMany({ torneo: tournament._id });
        await Team.deleteMany({ torneo: tournament._id });
        await Tournament.findByIdAndDelete(tournament._id);
    }

    // 2. Si es participante: Eliminarlo de todos los equipos
    // Buscamos equipos donde el usuario sea miembro y lo sacamos del array
    await Team.updateMany(
        { "miembros.usuario": userId },
        { $pull: { miembros: { usuario: userId } } }
    );

    // 3. Finalmente, borrar el usuario
    await User.findByIdAndDelete(userId);
};

// Eliminar cuenta propia (Usuario normal)
exports.deleteUser = async (req, res) => {
    try {
        await performCascadeDelete(req.user.id);
        res.json({ msg: 'Tu cuenta y todos tus datos han sido eliminados' });
    } catch (err) {
        res.status(500).send('Error al eliminar la cuenta');
    }
};

// Cambiar contraseña con validación de longitud
exports.changePassword = async (req, res) => {
    const { passwordActual, passwordNuevo } = req.body;
    try {
        if (passwordNuevo.length < 6) {
            return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        const isMatch = await bcrypt.compare(passwordActual, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'La contraseña actual es incorrecta.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(passwordNuevo, salt);

        await user.save();
        res.json({ msg: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Obtener todos los usuarios (Solo para Administradores)
exports.getAllUsers = async (req, res) => {
    try {
        // Buscamos todos los usuarios EXCEPTO el que hace la petición ($ne: req.user.id)
        const users = await User.find({ _id: { $ne: req.user.id } })
            .select('-password')
            .sort({ username: 1 });
            
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener los usuarios');
    }
};

// Eliminar usuario por administrador
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Evitar que el admin se borre a sí mismo desde aquí
        if (userToDelete._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'No puedes borrar tu propia cuenta de administrador desde este panel' });
        }

        await performCascadeDelete(req.params.id);
        res.json({ msg: `El usuario ${userToDelete.username} y sus datos han sido eliminados` });
    } catch (err) {
        res.status(500).send('Error al eliminar el usuario');
    }
};