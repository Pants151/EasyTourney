const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Lógica de Registro
exports.register = async (req, res) => {
    try {
        const { username, email, password, pais, fechaNacimiento, idioma, rol } = req.body;

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
            idioma,
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
        const { email, password, forceLogout } = req.body; // Se añade forceLogout

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

        // --- PROTECCIÓN INTERACTIVA DE SESIONES CONCURRENTES ---
        // Si el usuario ya tiene un token de sesión activo y NO ha marcado la casilla mental de forceLogout
        if (user.sessionToken && !forceLogout) {
            return res.status(409).json({
                code: 'ACTIVE_SESSION',
                msg: 'Ya hay una sesión iniciada en otro lugar. Para continuar se va a cerrar la sesión anterior.'
            });
        }

        // Si ha dicho que sí (forceLogout) y había una sesión, disparamos el evento para echarle EN VIVO
        if (user.sessionToken && forceLogout) {
            const io = req.app.get('socketio');
            if (io) {
                // Emitimos a la sala privada del usuario la orden de desconexión
                io.to('user_' + user.id).emit('force_logout');
            }
        }

        // Generar un token de sesión único cada vez que inicia sesión (Aplastando el anterior si lo hubiera)
        const sessionToken = crypto.randomBytes(16).toString('hex');

        // Guardarlo en el usuario en base de datos
        user.sessionToken = sessionToken;
        await user.save();

        // 3. Si todo es correcto, crear el JWT inyectando el sessionToken
        const payload = {
            user: {
                id: user.id,
                rol: user.rol, // Importante para EasyTourney para saber si es organizador
                sessionToken: sessionToken
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

// Lógica de Logout
exports.logout = async (req, res) => {
    try {
        // Obtenemos el usuario autenticado a través del middleware
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Limpiamos su token de sesión en la base de datos para que quede "limpio"
        user.sessionToken = null;
        await user.save();

        res.json({ msg: 'Sesión cerrada correctamente en el backend' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al cerrar sesión');
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
    const { username, email, pais, fechaNacimiento, rol } = req.body;
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
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ msg: 'Por favor, introduce un correo electrónico válido.' });
            }
            const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingEmail) return res.status(400).json({ msg: 'El correo electrónico ya está en uso.' });
        }

        // Validar fecha de nacimiento (no puede ser en el futuro)
        if (fechaNacimiento) {
            const birthDate = new Date(fechaNacimiento);
            const today = new Date();
            if (birthDate > today) {
                return res.status(400).json({ msg: 'La fecha de nacimiento no puede ser en el futuro.' });
            }
        }

        // --- GESTIÓN DE ROL Y BORRADO EN CASCADA DE TORNEOS ---
        // Solo usuarios normales pueden cambiar entre organizador y participante
        if (user.rol !== 'administrador' && rol && ['participante', 'organizador'].includes(rol) && rol !== user.rol) {
            // Si baja a participante, borramos sus torneos organizados
            if (user.rol === 'organizador' && rol === 'participante') {
                const userTournaments = await Tournament.find({ organizador: user._id });
                for (const tournament of userTournaments) {
                    await Match.deleteMany({ torneo: tournament._id });
                    await Team.deleteMany({ torneo: tournament._id });
                    await Tournament.findByIdAndDelete(tournament._id);
                }
            }
            user.rol = rol;
        }

        user.username = username || user.username;
        user.email = email || user.email;
        user.pais = pais || user.pais;
        user.fechaNacimiento = fechaNacimiento || user.fechaNacimiento;
        if (req.body.idioma) user.idioma = req.body.idioma;

        await user.save();
        res.json({ id: user.id, username: user.username, rol: user.rol, email: user.email });
    } catch (err) {
        res.status(500).send('Error al actualizar perfil');
    }
};

// Función auxiliar para realizar el borrado en cascada
const performCascadeDelete = async (user) => {
    const userId = user._id;

    // 1. Si es organizador: Borrar sus torneos y todo lo que contienen
    const userTournaments = await Tournament.find({ organizador: userId });
    for (const tournament of userTournaments) {
        await Match.deleteMany({ torneo: tournament._id });
        await Team.deleteMany({ torneo: tournament._id });
        await Tournament.findByIdAndDelete(tournament._id);
    }

    // 2. Si es participante: 
    // Sacarlo de los torneos en "Borrador" y sus equipos en "Borrador"
    const draftTournaments = await Tournament.find({ estado: 'Borrador', participantes: userId });
    for (const draft of draftTournaments) {
        await Team.updateMany({ torneo: draft._id, "miembros.usuario": userId }, { $pull: { miembros: { usuario: userId } } });
        await Tournament.findByIdAndUpdate(draft._id, { $pull: { participantes: userId } });
    }

    // Para torneos en "Abierto", "En curso" o "Finalizado", SE CONSERVA su ID para mostrarlo
    // Guardamos el nombre del usuario real en snapNombresBots para no perder su nombre de pila
    // al ser borrado, asignándole el sufijo '(Descalificado)'.
    const userNameDescalificado = `${user.username} (Descalificado)`;
    const activeTournaments = await Tournament.find({ estado: { $in: ['Abierto', 'En curso', 'Finalizado'] }, participantes: userId });

    for (const tourney of activeTournaments) {
        let isWinner = false;
        if (tourney.estado === 'Finalizado' && tourney.ganador) {
            if (tourney.ganadorTipo === 'User' && tourney.ganador.toString() === userId.toString()) {
                isWinner = true;
            } else if (tourney.ganadorTipo === 'Team') {
                const winningTeam = await Team.findById(tourney.ganador);
                if (winningTeam && winningTeam.miembros.some(m => m.usuario.toString() === userId.toString())) {
                    isWinner = true;
                }
            }
        }

        const userNameToSave = isWinner ? user.username : `${user.username} (Descalificado)`;

        // Guardar el snapshot usando Mongoose $set para asegurar la grabación del Map
        const snapUpdate = {};
        snapUpdate[`snapNombresBots.${userId.toString()}`] = userNameToSave;
        await Tournament.findByIdAndUpdate(tourney._id, { $set: snapUpdate });

        if (tourney.estado !== 'Finalizado') {
            if (tourney.formato === 'Equipos') {
                const team = await Team.findOne({ torneo: tourney._id, "miembros.usuario": userId });
                if (team) {
                    // Buscamos partidos pendientes del equipo
                    const pendingMatches = await Match.find({
                        torneo: tourney._id,
                        ganador: { $exists: false },
                        $or: [{ equipo1: team._id }, { equipo2: team._id }]
                    });

                    for (const m of pendingMatches) {
                        m.ganador = m.equipo1.toString() === team._id.toString() ? m.equipo2 : m.equipo1;
                        m.resultado = "W.O. (Descalificación)";
                        await m.save();
                    }
                }
            } else {
                const pendingMatches = await Match.find({
                    torneo: tourney._id,
                    ganador: { $exists: false },
                    $or: [{ jugador1: userId }, { jugador2: userId }]
                });

                for (const m of pendingMatches) {
                    m.ganador = m.jugador1?.toString() === userId.toString() ? m.jugador2 : m.jugador1;
                    m.resultado = "W.O. (Descalificación)";
                    await m.save();
                }
            }
        } else {
            const pendingMatches = await Match.find({
                torneo: tourney._id,
                ganador: { $exists: false },
                $or: [{ jugador1: userId }, { jugador2: userId }]
            });
            for (const m of pendingMatches) {
                m.ganador = m.jugador1?.toString() === userId.toString() ? m.jugador2 : m.jugador1;
                m.resultado = "W.O. (Descalificación)";
                await m.save();
            }
        }
    }

    // 3. Finalmente, borrar el usuario
    await User.findByIdAndDelete(userId);
};

// Eliminar cuenta propia (Usuario normal)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send('Usuario no encontrado');
        await performCascadeDelete(user);
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

// Obtener datos de UN usuario (Solo para Administradores)
exports.getUserByIdByAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener el usuario');
    }
};

// Obtener todos los usuarios (Solo para Administradores)
exports.getAllUsers = async (req, res) => {
    try {
        // Buscamos todos los usuarios EXCEPTO el que hace la petición ($ne: req.user.id) y descartamos los bots
        const users = await User.find({ _id: { $ne: req.user.id }, isBot: { $ne: true } })
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

        // --- Expulsar al usuario si está conectado en tiempo real ---
        const io = req.app.get('socketio');
        if (io) {
            io.to('user_' + userToDelete._id.toString()).emit('force_logout');
        }

        await performCascadeDelete(userToDelete);
        res.json({ msg: `El usuario ${userToDelete.username} y sus datos han sido eliminados` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al eliminar el usuario');
    }
};

// Actualizar usuario por administrador
exports.updateUserByAdmin = async (req, res) => {
    const { username, email, rol, pais, fechaNacimiento, idioma } = req.body;
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Validar si el nuevo username ya existe en OTRO usuario
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username, _id: { $ne: req.params.id } });
            if (existingUsername) return res.status(400).json({ msg: 'El nombre de usuario ya está en uso.' });
        }

        // Validar si el nuevo email ya existe en OTRO usuario
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingEmail) return res.status(400).json({ msg: 'El correo electrónico ya está en uso.' });
        }

        // --- GESTIÓN DE ROL Y BORRADO EN CASCADA DE TORNEOS ---
        if (rol && ['participante', 'organizador', 'administrador'].includes(rol) && rol !== user.rol) {
            // Si baja a participante desde organizador o admin, borramos sus torneos organizados
            if ((user.rol === 'organizador' || user.rol === 'administrador') && rol === 'participante') {
                const userTournaments = await Tournament.find({ organizador: user._id });
                for (const tournament of userTournaments) {
                    await Match.deleteMany({ torneo: tournament._id });
                    await Team.deleteMany({ torneo: tournament._id });
                    await Tournament.findByIdAndDelete(tournament._id);
                }
            }
            user.rol = rol;
        }

        user.username = username || user.username;
        user.email = email || user.email;
        if (req.body.pais !== undefined) user.pais = req.body.pais;
        if (req.body.fechaNacimiento !== undefined) user.fechaNacimiento = req.body.fechaNacimiento;
        if (req.body.idioma !== undefined) user.idioma = req.body.idioma;

        await user.save();
        res.json({
            _id: user.id,
            username: user.username,
            email: user.email,
            rol: user.rol,
            pais: user.pais,
            fechaNacimiento: user.fechaNacimiento,
            idioma: user.idioma
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al actualizar el usuario');
    }
};

// Cambiar contraseña de cualquier usuario (Solo para Administradores)
exports.changeUserPasswordByAdmin = async (req, res) => {
    const { passwordNuevo } = req.body;
    try {
        if (!passwordNuevo || passwordNuevo.length < 6) {
            return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(passwordNuevo, salt);

        // --- INVALIDAR SESIÓN ACTUAL ---
        // Al cambiar la contraseña, invalidamos el sessionToken para que el usuario tenga que loguearse de nuevo
        // y no haya conflictos de 409 al intentar entrar con la nueva pass.
        user.sessionToken = undefined;

        await user.save();

        // Expulsar en vivo si estuviera conectado
        const io = req.app.get('socketio');
        if (io) {
            io.to('user_' + user._id.toString()).emit('force_logout');
        }

        res.json({ msg: `Contraseña de ${user.username} actualizada correctamente` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'No existe ningún usuario con ese correo electrónico' });
        }

        // 1. Generar token de reseteo aleatorio
        const resetToken = crypto.randomBytes(20).toString('hex');

        // 2. Guardar token y expiración en el usuario (1 hora de validez)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora en ms
        await user.save();

        // 3. Generar URL de reseteo
        // Se asume que en el FRONTEND_URL está la URL de la aplicación React (ej. http://localhost:3000)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        // 4. Crear mensaje y enviar correo
        const message = `Has recibido este correo porque tú (o alguien más) ha solicitado el restablecimiento de la contraseña en EasyTourney.\n\nPor favor, haz clic en el siguiente enlace, o pégalo en tu navegador para completar el proceso:\n\n${resetUrl}\n\nSi no fuiste tú, por favor ignora este correo y tu contraseña permanecerá sin cambios.\n`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'EasyTourney - Recuperación de Contraseña',
                message
            });

            res.status(200).json({ msg: 'Correo de recuperación enviado exitosamente' });
        } catch (error) {
            console.error('Error enviando correo:', error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            return res.status(500).json({ msg: 'Hubo un error al enviar el correo. Por favor inténtelo de nuevo más tarde.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Restablecer contraseña con el token
exports.resetPassword = async (req, res) => {
    try {
        // 1. Buscar usuario con ese token que además no haya expirado
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'El token de recuperación de contraseña es inválido o ha expirado.' });
        }

        // 2. Validar contraseña
        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        // 3. Hashear la nueva contraseña y guardarla
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 4. Limpiar los campos del token para que no se reusen
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: 'La contraseña se ha restablecido correctamente. Ya puedes iniciar sesión.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al restablecer la contraseña');
    }
};