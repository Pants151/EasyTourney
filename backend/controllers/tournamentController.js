const Tournament = require('../models/Tournament');

// Crear un nuevo torneo
exports.createTournament = async (req, res) => {
    try {
        // Extraemos los datos del cuerpo de la petición
        const { nombre, juego, plataformas, modalidad, ubicacion, fechaInicio, reglas } = req.body;

        // Creamos la instancia del torneo
        const newTournament = new Tournament({
            nombre,
            juego,
            plataformas,
            modalidad,
            ubicacion,
            fechaInicio,
            reglas,
            organizador: req.user.id // El ID viene del Middleware 'auth'
        });

        // Guardamos en MongoDB
        const tournament = await newTournament.save();
        res.json(tournament);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al crear el torneo');
    }
};

// Obtener todos los torneos
exports.getTournaments = async (req, res) => {
    try {
        // .populate('organizador', 'username') sirve para traer el nombre del usuario, no solo el ID
        const tournaments = await Tournament.find().sort({ fechaInicio: -1 }).populate('organizador', 'username');
        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener los torneos');
    }
};

// Inscribirse en un torneo
exports.joinTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ msg: 'Torneo no encontrado' });
        }

        // Verificar si el usuario ya está inscrito
        if (tournament.participantes.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Ya estás inscrito en este torneo' });
        }

        // Añadir el usuario al array de participantes
        tournament.participantes.push(req.user.id);
        await tournament.save();

        res.json({ msg: 'Inscripción realizada con éxito', participantes: tournament.participantes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al procesar la inscripción');
    }
};