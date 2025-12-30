const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');

// Crear un nuevo torneo
exports.createTournament = async (req, res) => {
    try {
        // Extraemos 'formato' y 'tamanoEquipoMax' en lugar de modalidad
        const { nombre, juego, plataformas, formato, tamanoEquipoMax, ubicacion, fechaInicio, reglas, limiteParticipantes, alMejorDe } = req.body;

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
            organizador: req.user.id,
            alMejorDe: formato === 'Battle Royale' ? (alMejorDe || 1) : 1
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
            .populate('ganadoresRondaBR', 'username')
            .populate({ path: 'ganador', options: { strictPopulate: false } })
            .populate('juego')
            .populate({
                path: 'equipos',
                populate: { path: 'miembros.usuario', select: 'username' }
            });
        res.json(tournament);
    } catch (err) { res.status(500).send('Error en servidor'); }
};

// Generar Brackets (Soporta 1v1 y Equipos)
exports.generateBrackets = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id).populate('participantes').populate('equipos');
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        let entities = tournament.formato === 'Equipos' ? [...tournament.equipos] : [...tournament.participantes];
        if (entities.length < 2) return res.status(400).json({ msg: 'Mínimo 2 participantes/equipos' });

        entities.sort(() => 0.5 - Math.random());

        for (let i = 0; i < entities.length; i += 2) {
            const matchData = {
                torneo: tournament._id,
                ronda: 1,
                ganadorTipo: tournament.formato === 'Equipos' ? 'Team' : 'User' // <-- IMPORTANTE
            };

            if (tournament.formato === 'Equipos') {
                matchData.equipo1 = entities[i]._id;
                if (entities[i + 1]) {
                    matchData.equipo2 = entities[i + 1]._id;
                } else {
                    matchData.equipo2 = null;
                    matchData.ganador = entities[i]._id;
                    matchData.resultado = "BYE";
                }
            } else {
                matchData.jugador1 = entities[i]._id;
                if (entities[i + 1]) {
                    matchData.jugador2 = entities[i + 1]._id;
                } else {
                    matchData.jugador2 = null;
                    matchData.ganador = entities[i]._id;
                    matchData.resultado = "BYE";
                }
            }
            await new Match(matchData).save();
        }

        tournament.estado = 'En curso';
        await tournament.save();
        res.json({ msg: 'Brackets generados correctamente' });
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
            .populate('equipo1', 'nombre') // Añadimos población de equipos
            .populate('equipo2', 'nombre')
            .populate('ganador')
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
        const match = await Match.findById(req.params.id).populate('torneo');

        if (!match) return res.status(404).json({ msg: 'Partida no encontrada' });

        // Guardamos el ganador y su tipo (Team o User) basado en el formato del torneo
        match.ganador = ganadorId;
        match.ganadorTipo = match.torneo.formato === 'Equipos' ? 'Team' : 'User';
        match.resultado = resultado;

        await match.save();
        res.json(match);
    } catch (err) { res.status(500).send('Error al actualizar resultado'); }
};

// Avanzar de ronda corregido
exports.advanceTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        const lastMatches = await Match.find({ torneo: req.params.id }).sort({ ronda: -1 }).limit(1);
        const currentRound = lastMatches.length > 0 ? lastMatches[0].ronda : 1;

        const matchesInRound = await Match.find({ torneo: req.params.id, ronda: currentRound });
        if (!matchesInRound.every(m => m.ganador)) return res.status(400).json({ msg: 'Faltan resultados' });

        const winners = matchesInRound.map(m => m.ganador);

        if (winners.length === 1) {
            tournament.estado = 'Finalizado';
            tournament.ganador = winners[0];
            tournament.ganadorTipo = tournament.formato === 'Equipos' ? 'Team' : 'User';
            await tournament.save();
            return res.json({ msg: '¡Torneo finalizado!' });
        }

        const nextRound = currentRound + 1;
        for (let i = 0; i < winners.length; i += 2) {
            const matchData = {
                torneo: tournament._id,
                ronda: nextRound,
                ganadorTipo: tournament.formato === 'Equipos' ? 'Team' : 'User'
            };

            const p1 = winners[i];
            const p2 = winners[i + 1];

            if (tournament.formato === 'Equipos') {
                matchData.equipo1 = p1;
                matchData.equipo2 = p2 || null;
            } else {
                matchData.jugador1 = p1;
                matchData.jugador2 = p2 || null;
            }

            if (!p2) {
                matchData.ganador = p1;
                matchData.resultado = "BYE";
            }

            await new Match(matchData).save();
        }
        res.json({ msg: `Ronda ${nextRound} generada` });
    } catch (err) { res.status(500).send('Error al avanzar ronda'); }
};

// Actualizar datos de un torneo
exports.updateTournament = async (req, res) => {
    try {
        let tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });
        if (tournament.organizador.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado' });

        // PROTECCIÓN: Si el torneo ya no es Borrador, prohibir cambios estructurales
        if (tournament.estado !== 'Borrador') {
            const { juego, formato, limiteParticipantes, tamanoEquipoMax, alMejorDe } = req.body;
            
            const isChangingCritical = 
                (juego && juego !== tournament.juego.toString()) ||
                (formato && formato !== tournament.formato) ||
                (limiteParticipantes && Number(limiteParticipantes) !== tournament.limiteParticipantes) ||
                (tamanoEquipoMax && Number(tamanoEquipoMax) !== tournament.tamanoEquipoMax) ||
                (alMejorDe && Number(alMejorDe) !== tournament.alMejorDe);

            if (isChangingCritical) {
                return res.status(400).json({ msg: 'No se pueden modificar ajustes competitivos una vez publicado el torneo' });
            }
        }

        // Actualizar campos permitidos
        const { nombre, plataformas, ubicacion, fechaInicio, reglas } = req.body;
        tournament.nombre = nombre || tournament.nombre;
        tournament.plataformas = plataformas || tournament.plataformas;
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

// Crear un equipo
exports.createTeam = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        const newTeam = new Team({
            nombre: req.body.nombre,
            capitan: req.user.id,
            torneo: tournament._id,
            miembros: [{ usuario: req.user.id, estado: 'Aceptado' }]
        });

        const team = await newTeam.save();
        tournament.equipos.push(team._id);
        if (!tournament.participantes.includes(req.user.id)) tournament.participantes.push(req.user.id);
        await tournament.save();

        res.json(team);
    } catch (err) { res.status(500).send('Error al crear equipo'); }
};

// Abandonar Torneo (Participante)
exports.leaveTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (tournament.estado !== 'Abierto' && tournament.estado !== 'Borrador')
            return res.status(400).json({ msg: 'No puedes abandonar un torneo en curso o finalizado' });

        // Si el torneo es por equipos, buscar si el usuario es capitán
        const team = await Team.findOne({ torneo: tournament._id, capitan: req.user.id });
        if (team) {
            // Es capitán: se borra el equipo y se expulsa a todos los miembros
            const memberIds = team.miembros.map(m => m.usuario.toString());
            tournament.participantes = tournament.participantes.filter(p => !memberIds.includes(p.toString()));
            tournament.equipos = tournament.equipos.filter(e => e.toString() !== team._id.toString());
            await Team.findByIdAndDelete(team._id);
        } else {
            // No es capitán: solo se borra a sí mismo
            tournament.participantes = tournament.participantes.filter(p => p.toString() !== req.user.id);
            await Team.updateMany({ torneo: tournament._id }, { $pull: { miembros: { usuario: req.user.id } } });
        }

        await tournament.save();
        res.json({ msg: 'Has abandonado el torneo' });
    } catch (err) { res.status(500).send('Error al abandonar'); }
};

// Abandonar o Expulsar del torneo
exports.handleExitTournament = async (req, res) => {
    try {
        const { id, userId } = req.params; // id del torneo, userId opcional (para expulsar)
        const targetUser = userId || req.user.id;
        const tournament = await Tournament.findById(id);

        if (tournament.estado !== 'Abierto' && tournament.estado !== 'Borrador') {
            return res.status(400).json({ msg: 'No se puede salir/expulsar con el torneo en curso' });
        }

        // ¿Es el usuario el capitán de algún equipo?
        const team = await Team.findOne({ torneo: id, capitan: targetUser });

        if (team) {
            // Si es capitán, eliminamos el equipo y a todos sus miembros del torneo
            const memberIds = team.miembros.map(m => m.usuario.toString());
            tournament.participantes = tournament.participantes.filter(p => !memberIds.includes(p.toString()));
            tournament.equipos = tournament.equipos.filter(e => e.toString() !== team._id.toString());
            await Team.findByIdAndDelete(team._id);
        } else {
            // Si no es capitán, solo lo quitamos a él
            tournament.participantes = tournament.participantes.filter(p => p.toString() !== targetUser);
            // También lo quitamos de la lista de miembros de cualquier equipo donde esté
            await Team.updateMany({ torneo: id }, { $pull: { miembros: { usuario: targetUser } } });
        }

        await tournament.save();
        res.json({ msg: 'Operación realizada correctamente' });
    } catch (err) {
        res.status(500).send('Error al procesar la salida');
    }
};

// Expulsar Participante (Organizador)
exports.expelParticipant = async (req, res) => {
    try {
        const { tournamentId, userId } = req.params;
        const tournament = await Tournament.findById(tournamentId);

        if (tournament.organizador.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado' });
        if (tournament.estado !== 'Abierto' && tournament.estado !== 'Borrador')
            return res.status(400).json({ msg: 'No se puede expulsar con el torneo empezado' });

        // Lógica idéntica a abandonar (si es capitán se borra equipo, si no, solo el miembro)
        const team = await Team.findOne({ torneo: tournamentId, capitan: userId });
        if (team) {
            const memberIds = team.miembros.map(m => m.usuario.toString());
            tournament.participantes = tournament.participantes.filter(p => !memberIds.includes(p.toString()));
            tournament.equipos = tournament.equipos.filter(e => e.toString() !== team._id.toString());
            await Team.findByIdAndDelete(team._id);
        } else {
            tournament.participantes = tournament.participantes.filter(p => p.toString() !== userId);
            await Team.updateMany({ torneo: tournamentId }, { $pull: { miembros: { usuario: userId } } });
        }

        await tournament.save();
        res.json({ msg: 'Participante expulsado' });
    } catch (err) { res.status(500).send('Error al expulsar'); }
};

// Unirse a un equipo (Solicitud pendiente)
exports.joinTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ msg: 'Equipo no encontrado' });

        const tournament = await Tournament.findById(team.torneo);

        // Verificar límite de miembros (Solo aceptados)
        const acceptedMembers = team.miembros.filter(m => m.estado === 'Aceptado');
        if (acceptedMembers.length >= tournament.tamanoEquipoMax) {
            return res.status(400).json({ msg: 'El equipo ya está lleno' });
        }

        // Verificar si ya está en este equipo
        if (team.miembros.some(m => m.usuario.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'Ya has solicitado unirte o eres parte del equipo' });
        }

        team.miembros.push({ usuario: req.user.id, estado: 'Pendiente' });
        await team.save();

        res.json({ msg: 'Solicitud enviada al capitán', team });
    } catch (err) {
        res.status(500).send('Error al solicitar unirse al equipo');
    }
};

// Aceptar o rechazar miembros (Solo Capitán)
exports.respondToTeamRequest = async (req, res) => {
    try {
        const { userId, action } = req.body; // action: 'accept' o 'reject'
        const team = await Team.findById(req.params.teamId);

        if (!team) return res.status(404).json({ msg: 'Equipo no encontrado' });
        if (team.capitan.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado (Solo el capitán)' });
        }

        if (action === 'accept') {
            const member = team.miembros.find(m => m.usuario.toString() === userId);
            if (member) member.estado = 'Aceptado';

            // Al aceptar, también lo añadimos a la lista general del torneo si no estaba
            const tournament = await Tournament.findById(team.torneo);
            if (!tournament.participantes.includes(userId)) {
                tournament.participantes.push(userId);
                await tournament.save();
            }
        } else {
            team.miembros = team.miembros.filter(m => m.usuario.toString() !== userId);
        }

        await team.save();
        res.json({ msg: `Usuario ${action === 'accept' ? 'aceptado' : 'rechazado'}`, team });
    } catch (err) {
        res.status(500).send('Error al procesar la respuesta del capitán');
    }
};

// Nueva función para reportar ganador de ronda en BR
exports.reportBRRoundWinner = async (req, res) => {
    try {
        const { winnerId } = req.body;
        const tournament = await Tournament.findById(req.params.id);

        if (tournament.organizador.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado' });

        tournament.ganadoresRondaBR.push(winnerId);

        // Contar cuántas veces ha ganado este usuario
        const victorias = tournament.ganadoresRondaBR.filter(id => id.toString() === winnerId).length;

        // Si alcanza el objetivo, el torneo finaliza
        if (victorias >= tournament.alMejorDe) {
            tournament.estado = 'Finalizado';
            tournament.ganador = winnerId;
            tournament.ganadorTipo = 'User';
        }

        await tournament.save();
        res.json(tournament);
    } catch (err) { res.status(500).send('Error al reportar ronda'); }
};