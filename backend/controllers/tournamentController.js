const Tournament = require('../models/Tournament');
const Match = require('../models/Match');

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

// Obtener un torneo por ID
exports.getTournamentById = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('organizador', 'username')
            .populate('participantes', 'username');
        
        if (!tournament) {
            return res.status(404).json({ msg: 'Torneo no encontrado' });
        }
        res.json(tournament);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Torneo no encontrado' });
        res.status(500).send('Error en el servidor');
    }
};

// Generar Brackets (Solo para modalidad 1v1 inicialmente)
exports.generateBrackets = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id).populate('participantes');
        
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });
        if (tournament.participantes.length < 2) {
            return res.status(400).json({ msg: 'Se necesitan al menos 2 participantes' });
        }

        // 1. Mezclar participantes aleatoriamente
        const players = [...tournament.participantes].sort(() => 0.5 - Math.random());

        // 2. Crear las partidas de la Ronda 1
        const matches = [];
        for (let i = 0; i < players.length; i += 2) {
            const match = new Match({
                torneo: tournament._id,
                jugador1: players[i]._id,
                jugador2: players[i+1] ? players[i+1]._id : null, // Por si es impar (bye)
                ronda: 1
            });
            await match.save();
            matches.push(match);
        }

        // 3. Actualizar estado del torneo
        tournament.estado = 'En curso';
        await tournament.save();

        res.json({ msg: 'Brackets generados correctamente', matches });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al generar brackets');
    }
};

// Publicar torneo (Cambiar estado a Abierto)
exports.publishTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ msg: 'Torneo no encontrado' });
        }

        // Verificar que el usuario sea el organizador
        if (tournament.organizador.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        tournament.estado = 'Abierto';
        await tournament.save();

        res.json({ msg: 'Torneo publicado exitosamente', tournament });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al publicar el torneo');
    }
};