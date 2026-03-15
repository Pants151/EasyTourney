const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Registro
exports.register = async (req, res) => {
    try {
        const { username, email, password, pais, fechaNacimiento, idioma, rol } = req.body;

        // Validar email único
        let userEmail = await User.findOne({ email });
        if (userEmail) {
            return res.status(400).json({ msg: 'Este correo electrónico ya está registrado.' }); 
        }

        // Validar username único
        let userUsername = await User.findOne({ username });
        if (userUsername) {
            return res.status(400).json({ msg: 'El nombre de usuario ya está en uso.' }); 
        }

        const user = new User({
            username,
            email,
            password,
            pais,
            fechaNacimiento,
            idioma,
            rol
        });

        // Hashear password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt); 

        await user.save(); 

        res.status(201).json({ msg: 'Usuario registrado correctamente' }); 

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password, forceLogout } = req.body; 

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Verificar password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Protección de sesiones concurrentes
        if (user.sessionToken && !forceLogout) {
            return res.status(409).json({
                code: 'ACTIVE_SESSION',
                msg: 'Ya hay una sesión iniciada en otro lugar. Para continuar se va a cerrar la sesión anterior.'
            });
        }

        // Forzar logout remoto si es necesario
        if (user.sessionToken && forceLogout) {
            const io = req.app.get('socketio');
            if (io) {
                io.to('user_' + user.id).emit('force_logout');
            }
        }

        // Renovar token de sesión
        const sessionToken = crypto.randomBytes(16).toString('hex');

        user.sessionToken = sessionToken;
        await user.save();

        // Crear JWT
        const payload = {
            user: {
                id: user.id,
                rol: user.rol, 
                sessionToken: sessionToken
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 86400 },
            (err, token) => {
                if (err) throw err;
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

// Logout
exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Invalidar sesión
        user.sessionToken = null;
        await user.save();

        res.json({ msg: 'Sesión cerrada correctamente en el backend' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al cerrar sesión');
    }
};

// Perfil de usuario
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Error al obtener el perfil');
    }
};

// Actualizar perfil
exports.updateUserProfile = async (req, res) => {
    const { username, email, pais, fechaNacimiento, rol } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Validar colisiones de username
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username, _id: { $ne: req.user.id } });
            if (existingUsername) return res.status(400).json({ msg: 'El nombre de usuario ya está en uso.' });
        }

        // Validar colisiones de email
        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ msg: 'Por favor, introduce un correo electrónico válido.' });
            }
            const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingEmail) return res.status(400).json({ msg: 'El correo electrónico ya está en uso.' });
        }

        // Validar fechaNacimiento
        if (fechaNacimiento) {
            const birthDate = new Date(fechaNacimiento);
            const today = new Date();
            if (birthDate > today) {
                return res.status(400).json({ msg: 'La fecha de nacimiento no puede ser en el futuro.' });
            }
        }

        // Gestión de roles y referencias huérfanas
        if (user.rol !== 'administrador' && rol && ['participante', 'organizador'].includes(rol) && rol !== user.rol) {
            // Limpiar torneos si pierde permisos de organizador
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

// Borrado en cascada (Torneos y Matches)
const performCascadeDelete = async (user) => {
    const userId = user._id;

    // Limpiar torneos organizados
    const userTournaments = await Tournament.find({ organizador: userId });
    for (const tournament of userTournaments) {
        await Match.deleteMany({ torneo: tournament._id });
        await Team.deleteMany({ torneo: tournament._id });
        await Tournament.findByIdAndDelete(tournament._id);
    }

    // Eliminar de torneos en Borrador
    const draftTournaments = await Tournament.find({ estado: 'Borrador', participantes: userId });
    for (const draft of draftTournaments) {
        await Team.updateMany({ torneo: draft._id, "miembros.usuario": userId }, { $pull: { miembros: { usuario: userId } } });
        await Tournament.findByIdAndUpdate(draft._id, { $pull: { participantes: userId } });
    }

    // Preservar nombre para historial
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

        // Guardar snapshot
        const snapUpdate = {};
        snapUpdate[`snapNombresBots.${userId.toString()}`] = userNameToSave;
        await Tournament.findByIdAndUpdate(tourney._id, { $set: snapUpdate });

        if (tourney.estado !== 'Finalizado') {
            if (tourney.formato === 'Equipos') {
                const team = await Team.findOne({ torneo: tourney._id, "miembros.usuario": userId });
                if (team) {
                    // Forzar W.O. en partidos pendientes
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

    await User.findByIdAndDelete(userId);
};

// Auto-borrado de cuenta
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

// Cambiar password
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

// Admin: Mostrar usuario
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

// Admin: Listar usuarios
exports.getAllUsers = async (req, res) => {
    try {
        // Excluir al propio admin y a bots
        const users = await User.find({ _id: { $ne: req.user.id }, isBot: { $ne: true } })
            .select('-password')
            .sort({ username: 1 });

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener los usuarios');
    }
};

// Admin: Borrar usuario
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Prevenir auto-borrado accidental
        if (userToDelete._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'No puedes borrar tu propia cuenta de administrador desde este panel' });
        }

        // Forzar desconexión en vivo
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

// Admin: Borrado masivo
exports.deleteUsersBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ msg: 'Lista de IDs no válida' });

        const io = req.app.get('socketio');
        let deletedCount = 0;

        for (const id of ids) {
            const userToDelete = await User.findById(id);
            if (userToDelete && userToDelete._id.toString() !== req.user.id) {
                if (io) {
                    io.to('user_' + id).emit('force_logout');
                }
                await performCascadeDelete(userToDelete);
                deletedCount++;
            }
        }

        res.json({ msg: `${deletedCount} usuarios eliminados correctamente` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar usuarios en bloque');
    }
};

// Admin: Actualizar usuario
exports.updateUserByAdmin = async (req, res) => {
    const { username, email, rol, pais, fechaNacimiento, idioma } = req.body;
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Validar colisiones
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username, _id: { $ne: req.params.id } });
            if (existingUsername) return res.status(400).json({ msg: 'El nombre de usuario ya está en uso.' });
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingEmail) return res.status(400).json({ msg: 'El correo electrónico ya está en uso.' });
        }

        if (rol && ['participante', 'organizador', 'administrador'].includes(rol) && rol !== user.rol) {
            // Limpiar torneos si pierde permisos
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

// Admin: Cambiar password
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

        // Invalidar sesión activa
        user.sessionToken = undefined;

        await user.save();

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

// Request reset password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'No existe ningún usuario con ese correo electrónico' });
        }

        // Generar token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Asignar caducidad (1h)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora en ms
        await user.save();

        // Construir URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        // Enviar email
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

// Ejecutar reset password
exports.resetPassword = async (req, res) => {
    try {
        // Validar token activo
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'El token de recuperación de contraseña es inválido o ha expirado.' });
        }

        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        // Hashear password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Invalidar token de un solo uso
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ msg: 'La contraseña se ha restablecido correctamente. Ya puedes iniciar sesión.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al restablecer la contraseña');
    }
};