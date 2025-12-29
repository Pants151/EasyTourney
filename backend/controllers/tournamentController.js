const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');

// Crear un nuevo torneo
exports.createTournament = async (req, res) => {
    try {
        // Extraemos 'formato' y 'tamanoEquipoMax' en lugar de modalidad
        const { nombre, juego, plataformas, formato, tamanoEquipoMax, ubicacion, fechaInicio, reglas, limiteParticipantes } = req.body;

        const newTournament = new Tournament({
            nombre,
            juego,
            plataformas,
            formato, // Sincronizado con el modelo
            tamanoEquipoMax: formato === 'Equipos' ? tamanoEquipoMax : 1,
            limiteParticipantes,
            ubicacion,
            fechaInicio,
            reglas,
            organizador: req.user.id
        });

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
        // Añadimos 'juego' al populate para obtener logos y carátulas
        const tournaments = await Tournament.find()
            .populate('organizador', 'username')
            .populate('juego') 
            .sort({ fechaInicio: -1 });
        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener torneos');
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
            .populate('participantes', 'username')
            .populate('ganador', 'username')
            .populate('juego')
            .populate('equipos'); 
        
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
        const tournament = await Tournament.findById(req.params.id)
            .populate('participantes')
            .populate('equipos');
        
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        let entities = [];
        if (tournament.formato === 'Equipos') {
            // Solo equipos que tengan al menos el capitán aceptado
            entities = tournament.equipos; 
        } else {
            entities = tournament.participantes;
        }

        if (entities.length < 2) return res.status(400).json({ msg: 'Faltan participantes o equipos' });

        // Mezclar entidades
        entities.sort(() => 0.5 - Math.random());

        // 2. Crear las partidas de la Ronda 1
        const matches = [];
        for (let i = 0; i < entities.length; i += 2) {
            const matchData = {
                torneo: tournament._id,
                ronda: 1
            };
            
            if (tournament.formato === 'Equipos') {
                matchData.equipo1 = entities[i]._id;
                matchData.equipo2 = entities[i+1] ? entities[i+1]._id : null;
            } else {
                matchData.jugador1 = entities[i]._id;
                matchData.jugador2 = entities[i+1] ? entities[i+1]._id : null;
            }

            const match = new Match(matchData);
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

// Obtener todas las partidas de un torneo
exports.getTournamentMatches = async (req, res) => {
    try {
        const matches = await Match.find({ torneo: req.params.id })
            .populate('jugador1', 'username')
            .populate('jugador2', 'username')
            .populate('ganador', 'username')
            .sort({ ronda: 1 }); // Ordenadas por ronda
        
        res.json(matches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener las partidas');
    }
};

// Obtener torneos del organizador actual
exports.getMyTournaments = async (req, res) => {
    try {
        // Buscamos torneos donde el organizador coincida con el ID del usuario autenticado
        const tournaments = await Tournament.find({ organizador: req.user.id })
            .populate('juego')
            .sort({ fechaInicio: -1 });
        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener tus torneos');
    }
};

// Actualizar resultado de una partida
exports.updateMatchResult = async (req, res) => {
    try {
        const { ganadorId, resultado } = req.body;
        // Buscamos la partida y poblamos el torneo para verificar el organizador
        const match = await Match.findById(req.params.id).populate('torneo');

        if (!match) return res.status(404).json({ msg: 'Partida no encontrada' });

        // Verificamos que quien hace la petición sea el organizador del torneo
        if (match.torneo.organizador.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado para reportar resultados' });
        }

        match.ganador = ganadorId;
        match.resultado = resultado;
        await match.save();

        res.json(match);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al actualizar el resultado');
    }
};

// Avanzar de ronda el torneo
exports.advanceTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findById(tournamentId);

        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        // 1. Obtener la ronda más alta actual
        const lastMatches = await Match.find({ torneo: tournamentId }).sort({ ronda: -1 }).limit(1);
        const currentRound = lastMatches.length > 0 ? lastMatches[0].ronda : 1;

        // 2. Verificar si todas las partidas de esa ronda tienen ganador
        const matchesInRound = await Match.find({ torneo: tournamentId, ronda: currentRound });
        const allFinished = matchesInRound.every(m => m.ganador);

        if (!allFinished) {
            return res.status(400).json({ msg: 'Aún hay partidas pendientes en la ronda actual' });
        }

        // 3. Extraer los IDs de los ganadores
        const winners = matchesInRound.map(m => m.ganador);

        // 4. Si solo queda 1 ganador, el torneo ha terminado
        if (winners.length === 1) {
            tournament.estado = 'Finalizado';
            tournament.ganador = winners[0];
            await tournament.save();
            return res.json({ msg: '¡El torneo ha finalizado!', ganador: winners[0] });
        }

        // 5. Crear las partidas para la siguiente ronda (nextRound)
        const nextRound = currentRound + 1;
        const nextMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
            const match = new Match({
                torneo: tournamentId,
                jugador1: winners[i],
                jugador2: winners[i + 1] ? winners[i + 1] : null, // Manejo de impares
                ronda: nextRound
            });
            await match.save();
            nextMatches.push(match);
        }

        res.json({ msg: `Ronda ${nextRound} generada correctamente`, matches: nextMatches });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al avanzar de ronda');
    }
};

// Actualizar datos de un torneo
exports.updateTournament = async (req, res) => {
    try {
        const { nombre, juego, plataformas, formato, tamanoEquipoMax, ubicacion, fechaInicio, reglas, limiteParticipantes } = req.body;
        let tournament = await Tournament.findById(req.params.id);

        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });
        if (tournament.organizador.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado' });

        tournament.nombre = nombre || tournament.nombre;
        tournament.juego = juego || tournament.juego;
        tournament.plataformas = plataformas || tournament.plataformas;
        tournament.formato = formato || tournament.formato; // Actualizado
        tournament.tamanoEquipoMax = formato === 'Equipos' ? tamanoEquipoMax : 1;
        tournament.limiteParticipantes = limiteParticipantes || tournament.limiteParticipantes;
        tournament.ubicacion = ubicacion || tournament.ubicacion;
        tournament.fechaInicio = fechaInicio || tournament.fechaInicio;
        tournament.reglas = reglas || tournament.reglas;

        await tournament.save();
        res.json(tournament);
    } catch (err) {
        res.status(500).send('Error al actualizar el torneo');
    }
};

// Eliminar un torneo
exports.deleteTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        // Verificar que sea el organizador
        if (tournament.organizador.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        // También deberíamos borrar las partidas asociadas si existen
        await Match.deleteMany({ torneo: req.params.id });
        await Tournament.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Torneo eliminado correctamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al eliminar el torneo');
    }
};