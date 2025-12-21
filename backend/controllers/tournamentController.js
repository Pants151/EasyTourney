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