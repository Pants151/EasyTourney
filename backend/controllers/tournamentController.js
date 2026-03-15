const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');
const User = require('../models/User');

// Crear torneo
exports.createTournament = async (req, res) => {
    try {
        console.log("DEBUG: Datos recibidos en createTournament:", req.body);
        const { nombre, fechaInicio, formato } = req.body;

        // Parsear numéricos
        const tamanoEquipoMax = parseInt(req.body.tamanoEquipoMax) || 2;
        const alMejorDe = parseInt(req.body.alMejorDe) || 1;
        const limiteParticipantes = parseInt(req.body.limiteParticipantes) || 16;

        // Validar nombre único
        const existingName = await Tournament.findOne({ nombre });
        if (existingName) {
            return res.status(400).json({ msg: 'Ya existe un torneo con este nombre.' });
        }

        // Validar fecha futura
        const dateLimit = new Date();
        dateLimit.setMinutes(dateLimit.getMinutes() - 1);
        if (new Date(fechaInicio) < dateLimit) {
            return res.status(400).json({ msg: 'La fecha de inicio no puede ser anterior a la actual.' });
        }

        const newTournament = new Tournament({
            ...req.body,
            tamanoEquipoMax: ['Equipos', 'Battle Royale - Por equipos'].includes(formato) ? tamanoEquipoMax : 2,
            alMejorDe: ['Battle Royale', 'Battle Royale - Por equipos'].includes(formato) ? alMejorDe : 1,
            limiteParticipantes,
            organizador: req.user.id,
            ganadorTipo: ['Equipos', 'Battle Royale - Por equipos'].includes(formato) ? 'Team' : 'User',
            tipoGanadorRonda: ['Battle Royale - Por equipos'].includes(formato) ? 'Team' : 'User'
        });

        const tournament = await newTournament.save();
        res.json(tournament);
    } catch (err) {
        console.error("ERROR AL CREAR TORNEO:", err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Error de validación: ' + Object.values(err.errors).map(e => e.message).join(', ') });
        }
        res.status(500).send('Error al crear el torneo');
    }
};

// Listar torneos
exports.getTournaments = async (req, res) => {
    try {
        // Populate juego
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

// Inscribirse al torneo
exports.joinTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ msg: 'Torneo no encontrado' });
        }

        if (tournament.participantes.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Ya estás inscrito en este torneo' });
        }

        tournament.participantes.push(req.user.id);
        await tournament.save();

        const io = req.app.get('socketio');
        io.to(req.params.id).emit('participantUpdated');

        res.json({ msg: 'Inscripción realizada con éxito', participantes: tournament.participantes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al procesar la inscripción');
    }
};

// Mostrar torneo
exports.getTournamentById = async (req, res) => {
    try {
        // Cargar torneo crudo
        let tournament = await Tournament.findById(req.params.id).lean();
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        const rawParticipantes = tournament.participantes ? [...tournament.participantes] : [];
        const rawEquipos = tournament.equipos ? [...tournament.equipos] : [];
        const rawGanador = tournament.ganador;
        const rawGanadoresBR = tournament.ganadoresRondaBR ? [...tournament.ganadoresRondaBR] : [];

        // Populate relacional
        await Tournament.populate(tournament, [
            { path: 'organizador', select: 'username' },
            { path: 'participantes', select: 'username isBot pais idioma fechaNacimiento', options: { retainNullValues: true } },
            { path: 'ganadoresRondaBR', select: 'username nombre', options: { retainNullValues: true } },
            { path: 'ganador', options: { strictPopulate: false } },
            { path: 'juego' },
            { path: 'equipos', populate: { path: 'miembros.usuario', select: 'username isBot pais idioma fechaNacimiento' }, options: { retainNullValues: true } }
        ]);

        // Hidratar bots y eliminados
        const snapBots = tournament.snapNombresBots || new Map();
        const snapEquips = tournament.snapNombresEquipos || new Map();
        const snapMembers = tournament.snapEquiposMiembros || new Map();

        const getSnap = (snapMap, id) => {
            if (!snapMap) return undefined;
            if (typeof snapMap.get === 'function') return snapMap.get(id);
            return snapMap[id];
        };

        tournament.participantes = tournament.participantes.map((p, index) => {
            if (!p || !p.username) {
                const id = rawParticipantes[index]?.toString();
                if (id) {
                    const snapName = getSnap(snapBots, id);
                    if (snapName) {
                        const isDeletedRealUser = snapName.includes('(Descalificado)');
                        return { _id: id, username: snapName, isBot: !isDeletedRealUser, isDeleted: isDeletedRealUser };
                    }
                    return { _id: id, username: "DESCALIFICADO", isBot: false, isDeleted: true };
                }
            }
            return p;
        }).filter(Boolean);

        tournament.equipos = tournament.equipos.map((team, index) => {
            if (!team || !team.nombre) {
                const id = rawEquipos[index]?.toString();
                if (id) {
                    const snapEquipName = getSnap(snapEquips, id);
                    if (snapEquipName) {
                        return {
                            _id: id,
                            nombre: snapEquipName,
                            isBot: true,
                            miembros: (getSnap(snapMembers, id) || []).map(mid => {
                                const mbrSnapName = getSnap(snapBots, mid);
                                return {
                                    usuario: { _id: mid, username: mbrSnapName || "DESCALIFICADO", isBot: !!mbrSnapName, isDeleted: !mbrSnapName },
                                    estado: 'Aceptado'
                                };
                            })
                        };
                    }
                    return { _id: id, nombre: "EQUIPO DESCALIFICADO", isBot: false, isDeleted: true, miembros: [] };
                }
            } else if (team && team.miembros) {
                team.miembros = team.miembros.map(m => {
                    if (!m.usuario || !m.usuario.username) {
                        const mid = m.usuario?._id?.toString() || m.usuario?.toString();
                        if (mid) {
                            const mbrSnapName = getSnap(snapBots, mid);
                            if (mbrSnapName) {
                                const isDeletedRealUser = mbrSnapName.includes('(Descalificado)');
                                return { ...m, usuario: { _id: mid, username: mbrSnapName, isBot: !isDeletedRealUser, isDeleted: isDeletedRealUser } };
                            }
                        }
                        return { ...m, usuario: { _id: mid, username: "DESCALIFICADO", isBot: false, isDeleted: true } };
                    }
                    return m;
                });
            }
            return team;
        }).filter(Boolean);

        if (!tournament.ganador || (!tournament.ganador.username && !tournament.ganador.nombre)) {
            const gId = rawGanador?.toString();
            if (gId) {
                if (tournament.ganadorTipo === 'User') {
                    const snapName = getSnap(snapBots, gId);
                    if (snapName) {
                        const isDeletedRealUser = snapName.includes('(Descalificado)');
                        tournament.ganador = { _id: gId, username: snapName, isBot: !isDeletedRealUser, isDeleted: isDeletedRealUser };
                    } else {
                        tournament.ganador = { _id: gId, username: "DESCALIFICADO", isBot: false, isDeleted: true };
                    }
                } else if (tournament.ganadorTipo === 'Team') {
                    const snapEquipName = getSnap(snapEquips, gId);
                    if (snapEquipName) {
                        tournament.ganador = { _id: gId, nombre: snapEquipName, isBot: true };
                    } else {
                        tournament.ganador = { _id: gId, nombre: "EQUIPO DESCALIFICADO", isBot: false, isDeleted: true };
                    }
                }
            }
        }

        if (tournament.ganadoresRondaBR) {
            tournament.ganadoresRondaBR = tournament.ganadoresRondaBR.map((g, index) => {
                // Si es equipo, comprobamos 'nombre'. Si es usuario, 'username'.
                const isTeam = tournament.formato === 'Battle Royale - Por equipos';
                if (!g || (isTeam ? !g.nombre : !g.username)) {
                    const id = rawGanadoresBR[index]?.toString();
                    if (id) {
                        if (isTeam) {
                            const snapEquipName = getSnap(snapEquips, id);
                            if (snapEquipName) return { _id: id, nombre: snapEquipName, isBot: true };
                            return { _id: id, nombre: "EQUIPO DESCALIFICADO", isBot: false, isDeleted: true };
                        } else {
                            const snapName = getSnap(snapBots, id);
                            if (snapName) {
                                const isDeletedRealUser = snapName.includes('(Descalificado)');
                                return { _id: id, username: snapName, isBot: !isDeletedRealUser, isDeleted: isDeletedRealUser };
                            }
                            return { _id: id, username: "DESCALIFICADO", isBot: false, isDeleted: true };
                        }
                    }
                }
                return g;
            }).filter(Boolean);
        }

        res.json(tournament);
    } catch (err) {
        console.error('getTournamentById error:', err);
        res.status(500).send('Error en servidor');
    }
};

// Generar Brackets
exports.generateBrackets = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id).populate('participantes').populate('equipos');
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        // Prevenir regeneración
        if (tournament.estado === 'En curso' || tournament.estado === 'Finalizado') {
            return res.status(400).json({ msg: 'El torneo ya ha sido iniciado y los brackets generados.' });
        }

        // Validar cuórum
        let entities = ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? [...tournament.equipos] : [...tournament.participantes];
        if (entities.length < 2) {
            const entName = ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? 'equipos' : 'participantes';
            return res.status(400).json({ msg: `Mínimo 2 ${entName} para iniciar` });
        }

        // Init Battle Royale
        if (tournament.formato === 'Battle Royale') {
            tournament.estado = 'En curso';
            await tournament.save();
            return res.json({ msg: 'Torneo de Battle Royale iniciado correctamente' });
        }

        // Shuffling para Brackets
        entities.sort(() => 0.5 - Math.random());

        for (let i = 0; i < entities.length; i += 2) {
            const matchData = {
                torneo: tournament._id,
                ronda: 1,
                ganadorTipo: tournament.formato === 'Equipos' ? 'Team' : 'User' 
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

        const io = req.app.get('socketio');
        io.to(req.params.id).emit('bracketUpdated');

        res.json({ msg: 'Brackets generados correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al generar brackets');
    }
};

// Publicar torneo
exports.publishTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (!tournament) {
            return res.status(404).json({ msg: 'Torneo no encontrado' });
        }

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

// Obtener partidas
exports.getTournamentMatches = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findById(tournamentId).lean();

        let matches = await Match.find({ torneo: tournamentId }).sort({ ronda: 1 }).lean();

        const rawMatchData = matches.map(m => ({
            jugador1: m.jugador1,
            jugador2: m.jugador2,
            equipo1: m.equipo1,
            equipo2: m.equipo2,
            ganador: m.ganador
        }));

        // Populate
        await Match.populate(matches, [
            { path: 'jugador1', select: 'username isBot' },
            { path: 'jugador2', select: 'username isBot' },
            { path: 'equipo1', select: 'nombre' },
            { path: 'equipo2', select: 'nombre' },
            { path: 'ganador' }
        ]);

        // Hidratación visual
        if (tournament && (tournament.snapNombresBots || tournament.snapNombresEquipos)) {
            const snapBots = tournament.snapNombresBots || {};
            const snapEquips = tournament.snapNombresEquipos || {};

            const getSnap = (snapMap, id) => {
                if (!snapMap) return undefined;
                if (typeof snapMap.get === 'function') return snapMap.get(id);
                return snapMap[id];
            };

            matches = matches.map((m, i) => {
                const raw = rawMatchData[i];
                
                if (!m.jugador1 || !m.jugador1.username) {
                    const id = raw.jugador1?.toString();
                    if (id) {
                        const snapName = getSnap(snapBots, id);
                        if (snapName) {
                            const isDeleted = snapName.includes('(Descalificado)');
                            m.jugador1 = { _id: id, username: snapName, isBot: !isDeleted, isDeleted };
                        }
                    }
                }
                
                if (!m.jugador2 || !m.jugador2.username) {
                    const id = raw.jugador2?.toString();
                    if (id) {
                        const snapName = getSnap(snapBots, id);
                        if (snapName) {
                            const isDeleted = snapName.includes('(Descalificado)');
                            m.jugador2 = { _id: id, username: snapName, isBot: !isDeleted, isDeleted };
                        }
                    }
                }
                
                if (!m.equipo1 || !m.equipo1.nombre) {
                    const id = raw.equipo1?.toString();
                    if (id) {
                        const snapEquipName = getSnap(snapEquips, id);
                        if (snapEquipName) m.equipo1 = { _id: id, nombre: snapEquipName, isBot: true };
                    }
                }
                
                if (!m.equipo2 || !m.equipo2.nombre) {
                    const id = raw.equipo2?.toString();
                    if (id) {
                        const snapEquipName = getSnap(snapEquips, id);
                        if (snapEquipName) m.equipo2 = { _id: id, nombre: snapEquipName, isBot: true };
                    }
                }
                
                if (!m.ganador || (!m.ganador.username && !m.ganador.nombre)) {
                    const id = raw.ganador?.toString();
                    if (id) {
                        if (m.ganadorTipo === 'User') {
                            const snapName = getSnap(snapBots, id);
                            if (snapName) {
                                const isDeleted = snapName.includes('(Descalificado)');
                                m.ganador = { _id: id, username: snapName, isBot: !isDeleted, isDeleted };
                            }
                        } else if (m.ganadorTipo === 'Team') {
                            const snapEquipName = getSnap(snapEquips, id);
                            if (snapEquipName) {
                                m.ganador = { _id: id, nombre: snapEquipName, isBot: true };
                            }
                        }
                    }
                }
                return m;
            });
        }

        res.json(matches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener las partidas');
    }
};

// Torneos organizados
exports.getMyTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find({ organizador: req.user.id })
            .populate('juego')
            .sort({ fechaInicio: -1 });
        res.json(tournaments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener tus torneos');
    }
};

// Update match
exports.updateMatchResult = async (req, res) => {
    try {
        const { ganadorId, resultado } = req.body;
        const match = await Match.findById(req.params.id).populate('torneo');

        if (!match) return res.status(404).json({ msg: 'Partida no encontrada' });

        match.ganador = ganadorId;
        match.ganadorTipo = match.torneo.formato === 'Equipos' ? 'Team' : 'User';
        match.resultado = resultado;

        await match.save();

        const io = req.app.get('socketio');
        io.to(match.torneo._id.toString()).emit('bracketUpdated');

        res.json(match);
    } catch (err) { res.status(500).send('Error al actualizar resultado'); }
};

// Avanzar ronda
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

            // Clear bots
            await performBotSnapshotAndCleanup(tournament);

            await tournament.save();

            const io = req.app.get('socketio');
            let winnerName = 'Ganador';
            if (tournament.ganadorTipo === 'Team') {
                const team = await Team.findById(winners[0]);
                if (team) winnerName = team.nombre;
            } else {
                const user = await User.findById(winners[0]);
                if (user) winnerName = user.username;
            }
            io.to(req.params.id).emit('tournamentFinished', { winnerName });

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

        const io = req.app.get('socketio');
        io.to(req.params.id).emit('bracketUpdated');

        res.json({ msg: `Ronda ${nextRound} generada` });
    } catch (err) { res.status(500).send('Error al avanzar ronda'); }
};

// Modificar torneo
exports.updateTournament = async (req, res) => {
    try {
        let tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        if (tournament.organizador.toString() !== req.user.id && req.user.rol !== 'administrador') {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        const { nombre, fechaInicio } = req.body;

        // Proteger estado en curso
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

        // Validar unique nombre
        if (nombre && nombre !== tournament.nombre) {
            const existingName = await Tournament.findOne({ nombre, _id: { $ne: req.params.id } });
            if (existingName) {
                return res.status(400).json({ msg: 'Este nombre ya está en uso por otro torneo.' });
            }
        }

        // Validar fecha futura
        if (fechaInicio) {
            const timeDiff = Math.abs(new Date(fechaInicio).getTime() - new Date(tournament.fechaInicio).getTime());
            if (timeDiff > 60000) {
                const dateLimit = new Date();
                dateLimit.setMinutes(dateLimit.getMinutes() - 1);
                if (new Date(fechaInicio) < dateLimit) {
                    return res.status(400).json({ msg: 'La nueva fecha no puede ser anterior a la actual.' });
                }
            }
        }

        Object.assign(tournament, req.body);
        await tournament.save();
        res.json(tournament);
    } catch (err) {
        console.error("ERROR AL ACTUALIZAR TORNEO:", err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Error de validación: ' + Object.values(err.errors).map(e => e.message).join(', ') });
        }
        res.status(500).send('Error al actualizar el torneo');
    }
};

// Eliminar torneo
exports.deleteTournament = async (req, res) => {
    try {
        const success = await performTournamentDeletion(req.params.id, req.user);
        if (!success) return res.status(401).json({ msg: 'No autorizado o torneo no encontrado' });
        res.json({ msg: 'Torneo eliminado correctamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al eliminar el torneo');
    }
};

// Lógica borrado torneo
async function performTournamentDeletion(tournamentId, currentUser) {
    const tournament = await Tournament.findById(tournamentId).populate('participantes');
    if (!tournament) return false;

    if (tournament.organizador.toString() !== currentUser.id && currentUser.rol !== 'administrador') {
        return false;
    }

    // Eliminar bots
    const botIds = tournament.participantes
        .filter(p => p && p.isBot === true)
        .map(p => p._id);

    if (botIds.length > 0) {
        await User.deleteMany({ _id: { $in: botIds } });
    }

    // Eliminar referenciados
    await Team.deleteMany({ torneo: tournament._id });
    await Match.deleteMany({ torneo: tournament._id });
    await Tournament.findByIdAndDelete(tournament._id);
    return true;
}

// Admin: Borrado masivo
exports.deleteTournamentsBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ msg: 'Lista de IDs no válida' });

        let deletedCount = 0;
        for (const id of ids) {
            const success = await performTournamentDeletion(id, req.user);
            if (success) deletedCount++;
        }

        res.json({ msg: `${deletedCount} torneos eliminados correctamente` });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar torneos en bloque');
    }
};


// Crear equipo
exports.createTeam = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        // Validar cuórum
        if (tournament.equipos.length >= tournament.limiteParticipantes) {
            return res.status(400).json({ msg: `El torneo ya ha alcanzado el límite de ${tournament.limiteParticipantes} equipos.` });
        }

        // Validar unicidad capitan
        const existingTeam = await Team.findOne({ torneo: tournament._id, capitan: req.user.id });
        if (existingTeam) {
            return res.status(400).json({ msg: 'Ya eres capitán de un equipo en este torneo.' });
        }

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

        const io = req.app.get('socketio');
        io.to(req.params.id).emit('participantUpdated');

        res.json(team);
    } catch (err) { res.status(500).send('Error al crear equipo'); }
};

// Abandonar torneo
exports.leaveTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (tournament.estado !== 'Abierto' && tournament.estado !== 'Borrador')
            return res.status(400).json({ msg: 'No puedes abandonar un torneo en curso o finalizado' });

        const team = await Team.findOne({ torneo: tournament._id, capitan: req.user.id });
        if (team) {
            // Cascade si capitán
            const memberIds = team.miembros.map(m => m.usuario.toString());
            tournament.participantes = tournament.participantes.filter(p => !memberIds.includes(p.toString()));
            tournament.equipos = tournament.equipos.filter(e => e.toString() !== team._id.toString());
            await Team.findByIdAndDelete(team._id);
        } else {
            // Eliminar miembro
            tournament.participantes = tournament.participantes.filter(p => p.toString() !== req.user.id);
            await Team.updateMany({ torneo: tournament._id }, { $pull: { miembros: { usuario: req.user.id } } });
        }

        await tournament.save();

        const io = req.app.get('socketio');
        io.to(req.params.id).emit('participantUpdated');

        res.json({ msg: 'Has abandonado el torneo' });
    } catch (err) { res.status(500).send('Error al abandonar'); }
};

// Force leave
exports.handleExitTournament = async (req, res) => {
    try {
        const { id, userId } = req.params; // id del torneo, userId opcional (para expulsar)
        const targetUser = userId || req.user.id;
        const tournament = await Tournament.findById(id);

        if (tournament.estado !== 'Abierto' && tournament.estado !== 'Borrador') {
            return res.status(400).json({ msg: 'No se puede salir/expulsar con el torneo en curso' });
        }

        const team = await Team.findOne({ torneo: id, capitan: targetUser });

        if (team) {
            // Cascade si capitán
            const memberIds = team.miembros.map(m => m.usuario.toString());
            tournament.participantes = tournament.participantes.filter(p => !memberIds.includes(p.toString()));
            tournament.equipos = tournament.equipos.filter(e => e.toString() !== team._id.toString());
            await Team.findByIdAndDelete(team._id);
        } else {
            // Remove participant
            tournament.participantes = tournament.participantes.filter(p => p.toString() !== targetUser);
            await Team.updateMany({ torneo: id }, { $pull: { miembros: { usuario: targetUser } } });
        }

        await tournament.save();

        const io = req.app.get('socketio');
        io.to(id).emit('participantUpdated');

        res.json({ msg: 'Operación realizada correctamente' });
    } catch (err) {
        res.status(500).send('Error al procesar la salida');
    }
};

// Expulsar participante
exports.expelParticipant = async (req, res) => {
    try {
        const { tournamentId, userId } = req.params;
        const tournament = await Tournament.findById(tournamentId).populate('participantes');

        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });
        if (tournament.organizador.toString() !== req.user.id && req.user.rol !== 'administrador') {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        if (tournament.estado !== 'Abierto' && tournament.estado !== 'Borrador')
            return res.status(400).json({ msg: 'No se puede expulsar con el torneo empezado' });

        const userToExpel = await User.findById(userId);
        if (!userToExpel) return res.status(404).json({ msg: 'Usuario no encontrado' });

        const team = await Team.findOne({ torneo: tournamentId, capitan: userId });

        let usersToDelete = [];
        if (userToExpel.isBot) usersToDelete.push(userId);

        if (team) {
            const memberIds = team.miembros.map(m => m.usuario.toString());

            // Recolectar bots
            const teamMembers = await User.find({ _id: { $in: memberIds }, isBot: true });
            teamMembers.forEach(m => {
                if (!usersToDelete.includes(m._id.toString())) usersToDelete.push(m._id.toString());
            });

            tournament.participantes = tournament.participantes.filter(p => !memberIds.includes(p._id.toString()));
            tournament.equipos = tournament.equipos.filter(e => e.toString() !== team._id.toString());
            await Team.findByIdAndDelete(team._id);
        } else {
            tournament.participantes = tournament.participantes.filter(p => p._id.toString() !== userId);
            await Team.updateMany({ torneo: tournamentId }, { $pull: { miembros: { usuario: userId } } });
        }

        await tournament.save();

        // Limpiar DB de bots
        if (usersToDelete.length > 0) {
            await User.deleteMany({ _id: { $in: usersToDelete } });
        }

        const io = req.app.get('socketio');
        io.to(tournamentId).emit('participantUpdated');

        res.json({ msg: 'Participante expulsado y datos de bot limpiados' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al expulsar');
    }
};

// Join equipo
exports.joinTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ msg: 'Equipo no encontrado' });

        const tournament = await Tournament.findById(team.torneo);

        // Validar límite
        const acceptedMembers = team.miembros.filter(m => m.estado === 'Aceptado');
        if (acceptedMembers.length >= tournament.tamanoEquipoMax) {
            return res.status(400).json({ msg: 'El equipo ya está lleno' });
        }

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

// Team admin action
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

            // Añadir a lista general
            const tournament = await Tournament.findById(team.torneo);
            if (!tournament.participantes.includes(userId)) {
                tournament.participantes.push(userId);
                await tournament.save();

                const io = req.app.get('socketio');
                io.to(team.torneo.toString()).emit('participantUpdated');
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

// Reportar ronda BR
exports.reportBRRoundWinner = async (req, res) => {
    try {
        const { winnerId } = req.body;
        const tournament = await Tournament.findById(req.params.id);

        if (tournament.descalificados.includes(winnerId)) {
            return res.status(400).json({ msg: 'Este participante/equipo está descalificado y no puede ganar rondas.' });
        }

        const isTeamsBR = tournament.formato === 'Battle Royale - Por equipos';
        tournament.ganadoresRondaBR.push(winnerId);
        if (isTeamsBR) {
            tournament.tipoGanadorRonda = 'Team';
        } else {
            tournament.tipoGanadorRonda = 'User';
        }

        // Contar victorias
        const victorias = tournament.ganadoresRondaBR.filter(id => id.toString() === winnerId).length;

        // Si alcanza el objetivo, el torneo finaliza
        if (victorias >= tournament.alMejorDe) {
            tournament.estado = 'Finalizado';
            tournament.ganador = winnerId;
            tournament.ganadorTipo = isTeamsBR ? 'Team' : 'User';

            // Limpiar bots al finalizar BR
            await performBotSnapshotAndCleanup(tournament);

            const io = req.app.get('socketio');
            let winnerName = 'Ganador';
            if (isTeamsBR) {
                const team = await Team.findById(winnerId);
                winnerName = team ? team.nombre : 'Equipo Ganador';
            } else {
                const user = await User.findById(winnerId);
                winnerName = user ? user.username : 'Ganador';
            }
            io.to(req.params.id).emit('tournamentFinished', { winnerName });
        }

        await tournament.save();

        const io = req.app.get('socketio');
        io.to(req.params.id).emit('bracketUpdated');

        res.json(tournament);
    } catch (err) { res.status(500).send('Error al reportar ronda'); }
};

// Añadir bot
exports.addBot = async (req, res) => {
    try {
        if (req.user.rol !== 'administrador') return res.status(403).json({ msg: 'Solo administradores' });

        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });
        if (tournament.estado !== 'Abierto') return res.status(400).json({ msg: 'El torneo debe estar Abierto para anadir bots' });

        const io = req.app.get('socketio');

        // Generador nombre bot
        const generateUniqueBotName = async (baseName) => {
            let name = baseName;
            let counter = 1;
            while (await User.findOne({ username: name })) {
                name = baseName + '_' + Math.floor(Math.random() * 10000);
                counter++;
                if (counter > 10) break; // Seguridad
            }
            return name;
        };

        if (['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato)) {
            if (tournament.equipos.length >= tournament.limiteParticipantes) {
                return res.status(400).json({ msg: 'El torneo ya esta lleno de equipos' });
            }

            const teamIndex = tournament.equipos.length + 1;
            const memberUsers = [];
            for (let i = 1; i <= tournament.tamanoEquipoMax; i++) {
                const baseBotName = 'BotTeam' + teamIndex + '_J' + i;
                const botName = await generateUniqueBotName(baseBotName);
                const botUser = new User({
                    username: botName,
                    email: botName.toLowerCase() + '@bot.easytourney',
                    password: 'bot_no_login',
                    rol: 'participante',
                    isBot: true
                });
                await botUser.save();
                memberUsers.push(botUser);
            }
            const botTeam = new Team({
                nombre: 'BotEquipo_' + teamIndex + '_' + Math.floor(Math.random() * 1000),
                capitan: memberUsers[0]._id,
                torneo: tournament._id,
                miembros: memberUsers.map(u => ({ usuario: u._id, estado: 'Aceptado' }))
            });
            await botTeam.save();
            tournament.equipos.push(botTeam._id);
            memberUsers.forEach(u => {
                if (!tournament.participantes.includes(u._id)) tournament.participantes.push(u._id);
            });
            await tournament.save();
        } else {
            if (tournament.participantes.length >= tournament.limiteParticipantes) {
                return res.status(400).json({ msg: 'El torneo ya esta lleno de participantes' });
            }
            const botIndex = tournament.participantes.length + 1;
            const baseBotName = 'Bot_' + botIndex;
            const botName = await generateUniqueBotName(baseBotName);
            const botUser = new User({
                username: botName,
                email: botName.toLowerCase() + '@bot.easytourney',
                password: 'bot_no_login',
                rol: 'participante',
                isBot: true
            });
            await botUser.save();
            tournament.participantes.push(botUser._id);
            await tournament.save();
        }

        io.to(req.params.id).emit('participantUpdated');
        res.json({ msg: 'Bot anadido correctamente' });
    } catch (err) {
        console.error('addBot error:', err);
        res.status(500).send('Error al anadir bot');
    }
};

// Clear bots
exports.clearBots = async (req, res) => {
    try {
        if (req.user.rol !== 'administrador') return res.status(403).json({ msg: 'Solo administradores' });

        const tournament = await Tournament.findById(req.params.id)
            .populate('participantes')
            .populate('equipos');
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        const botParticipants = tournament.participantes.filter(p => p && p.isBot);
        const botIds = botParticipants.map(p => p._id);

        const botTeams = tournament.equipos.filter(t => botIds.some(id => id.equals(t.capitan)));
        const botTeamIds = botTeams.map(t => t._id);
        await Team.deleteMany({ _id: { $in: botTeamIds } });

        await User.deleteMany({ _id: { $in: botIds } });

        tournament.participantes = tournament.participantes.filter(p => !p.isBot);
        tournament.equipos = tournament.equipos.filter(t => !botTeamIds.some(id => id.equals(t._id)));
        await tournament.save();

        const io = req.app.get('socketio');
        io.to(req.params.id).emit('participantUpdated');
        res.json({ msg: 'Bots eliminados correctamente' });
    } catch (err) {
        console.error('clearBots error:', err);
        res.status(500).send('Error al limpiar bots');
    }
};

// Snapshot y cleanup bots
const performBotSnapshotAndCleanup = async (tournament) => {
    try {
        const fullTournament = await Tournament.findById(tournament._id)
            .populate('participantes')
            .populate('ganadoresRondaBR')
            .populate({
                path: 'equipos',
                populate: { path: 'miembros.usuario' }
            });

        if (!fullTournament) return;

        // Preservar info previa
        const getMapAsObj = (m) => m ? (typeof m.entries === 'function' ? Object.fromEntries(m) : { ...m }) : {};
        const snapBots = getMapAsObj(fullTournament.snapNombresBots);
        const snapEquips = getMapAsObj(fullTournament.snapNombresEquipos);
        const snapMembers = getMapAsObj(fullTournament.snapEquiposMiembros);

        const botIds = [];
        const botTeamIds = [];

        // Bots individuales
        fullTournament.participantes.forEach(p => {
            if (p && p.isBot) {
                snapBots[p._id.toString()] = p.username;
                if (!botIds.some(id => id.equals(p._id))) botIds.push(p._id);
            }
        });

        // BR winners
        fullTournament.ganadoresRondaBR.forEach(g => {
            if (g && g.isBot) {
                snapBots[g._id.toString()] = g.username;
                if (!botIds.some(id => id.equals(g._id))) botIds.push(g._id);
            }
        });

        // Bot teams
        fullTournament.equipos.forEach(t => {
            if (!t) return;
            const isBotTeam = (t.capitan && botIds.some(bid => bid.equals(t.capitan))) || t.nombre?.startsWith('BotEquipo');

            if (isBotTeam) {
                snapEquips[t._id.toString()] = t.nombre;
                snapMembers[t._id.toString()] = [];
                botTeamIds.push(t._id);

                t.miembros.forEach(m => {
                    if (m.usuario && m.usuario.isBot) {
                        snapBots[m.usuario._id.toString()] = m.usuario.username;
                        snapMembers[t._id.toString()].push(m.usuario._id.toString());
                        if (!botIds.some(id => id.equals(m.usuario._id))) botIds.push(m.usuario._id);
                    }
                });
            }
        });

        // Hidratar snapmaps
        tournament.snapNombresBots = snapBots;
        tournament.snapNombresEquipos = snapEquips;
        tournament.snapEquiposMiembros = snapMembers;

        // 4. Borrado físico
        if (botTeamIds.length > 0) await Team.deleteMany({ _id: { $in: botTeamIds } });
        if (botIds.length > 0) await User.deleteMany({ _id: { $in: botIds } });

        console.log(`Snapshot finalizado para ${tournament._id}`);
    } catch (err) {
        console.error('Error en performBotSnapshotAndCleanup:', err);
    }
};

// Renombrar bot/equipo
exports.renameBot = async (req, res) => {
    try {
        const { id, entityId } = req.params;
        const { newName, type } = req.body;

        const tournament = await Tournament.findById(id);
        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        if (tournament.estado !== 'Abierto') {
            return res.status(400).json({ msg: 'Solo puedes renombrar bots cuando el torneo está abierto.' });
        }

        const isAuthLevelAppropiate = req.user.rol === 'administrador' || tournament.organizador.toString() === req.user.id;
        if (!isAuthLevelAppropiate) {
            return res.status(403).json({ msg: 'No tienes permiso para renombrar bots en este torneo.' });
        }

        if (type === 'user') {
            const nameTaken = await User.findOne({ username: newName });
            if (nameTaken) return res.status(400).json({ msg: 'El nombre de usuario ya está en uso.' });

            const bot = await User.findById(entityId);
            if (!bot) return res.status(404).json({ msg: 'Participante no encontrado' });
            if (!bot.isBot) return res.status(400).json({ msg: 'Solo puedes renombrar cuentas creadas como bot de prueba.' });

            bot.username = newName;
            await bot.save();

        } else if (type === 'team') {
            const teamTaken = await Team.findOne({ torneo: id, nombre: newName });
            if (teamTaken) return res.status(400).json({ msg: 'Ya existe un equipo con ese nombre en este torneo.' });

            const team = await Team.findById(entityId);
            if (!team) return res.status(404).json({ msg: 'Equipo no encontrado' });

            team.nombre = newName;
            await team.save();
        } else {
            return res.status(400).json({ msg: 'Tipo de entidad no válido (user/team)' });
        }

        const io = req.app.get('socketio');
        io.to(id).emit('participantUpdated');

        res.json({ msg: 'Renombrado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al renombrar bot/equipo');
    }
};

// Descalificar
exports.disqualifyParticipant = async (req, res) => {
    try {
        const { id, type, targetId } = req.params;
        const tournament = await Tournament.findById(id);

        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        const isAuth = req.user.rol === 'administrador' || tournament.organizador.toString() === req.user.id;
        if (!isAuth) return res.status(403).json({ msg: 'No autorizado' });

        if (tournament.estado !== 'En curso') {
            return res.status(400).json({ msg: 'Solo se puede descalificar cuando el torneo está en curso.' });
        }

        const io = req.app.get('socketio');

        if (type === 'user') {
            const user = await User.findById(targetId);
            if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

            const snapBots = tournament.snapNombresBots || new Map();
            snapBots.set(targetId, `${user.username} (Descalificado)`);
            tournament.snapNombresBots = snapBots;

            // Flag descalificación
            if (!tournament.descalificados) tournament.descalificados = [];
            if (!tournament.descalificados.includes(targetId)) {
                tournament.descalificados.push(targetId);
            }

            // Resolver ramas W.O.
            const pendingMatches = await Match.find({
                torneo: id,
                ganador: { $exists: false },
                $or: [{ jugador1: targetId }, { jugador2: targetId }]
            });

            for (let m of pendingMatches) {
                m.ganador = m.jugador1.toString() === targetId ? m.jugador2 : m.jugador1;
                m.resultado = "DSQ";
                await m.save();
            }

            // Remover membresías
            await Team.updateMany({ torneo: id }, { $pull: { miembros: { usuario: targetId } } });

        } else if (type === 'team') {
            const team = await Team.findById(targetId);
            if (!team) return res.status(404).json({ msg: 'Equipo no encontrado' });

            const snapEquips = tournament.snapNombresEquipos || new Map();
            snapEquips.set(targetId, `${team.nombre} (Descalificado)`);
            tournament.snapNombresEquipos = snapEquips;

            // Flag descalificación
            if (!tournament.descalificados) tournament.descalificados = [];
            if (!tournament.descalificados.includes(targetId)) {
                tournament.descalificados.push(targetId);
            }

            // Resolver ramas W.O.
            const pendingMatches = await Match.find({
                torneo: id,
                ganador: { $exists: false },
                $or: [{ equipo1: targetId }, { equipo2: targetId }]
            });

            for (let m of pendingMatches) {
                m.ganador = m.equipo1.toString() === targetId ? m.equipo2 : m.equipo1;
                m.resultado = "DSQ";
                await m.save();
            }
        }

        await tournament.save();
        io.to(id).emit('bracketUpdated');
        io.to(id).emit('participantUpdated');

        res.json({ msg: 'Descalificación procesada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al descalificar');
    }
};

// Cancelar torneo
exports.cancelTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id);

        if (!tournament) return res.status(404).json({ msg: 'Torneo no encontrado' });

        const isAuth = req.user.rol === 'administrador' || tournament.organizador.toString() === req.user.id;
        if (!isAuth) return res.status(403).json({ msg: 'No autorizado' });

        if (tournament.estado !== 'En curso') {
            return res.status(400).json({ msg: 'Solo se puede cancelar un torneo que esté en curso.' });
        }

        tournament.estado = 'Cancelado';

        // Cascade cleanup bots
        await performBotSnapshotAndCleanup(tournament);

        await tournament.save();

        const io = req.app.get('socketio');
        io.to(id).emit('tournamentCancelled'); 

        res.json({ msg: 'Torneo cancelado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cancelar torneo');
    }
};
