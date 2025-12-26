const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lógica de Registro
exports.register = async (req, res) => {
    try {
        const { username, email, password, pais, fechaNacimiento, rol } = req.body;

        // 1. Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // 2. Crear el nuevo usuario
        user = new User({
            username,
            email,
            password,
            pais,
            fechaNacimiento,
            rol
        });

        // 3. Encriptar contraseña (Hashing)
        // Generamos un "salt" (una semilla aleatoria) y luego hasheamos
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 4. Guardar en la base de datos
        await user.save();

        res.status(201).json({ msg: 'Usuario registrado correctamente' });

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