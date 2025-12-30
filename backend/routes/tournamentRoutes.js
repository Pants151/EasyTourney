const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const auth = require('../middleware/auth'); // Importamos nuestro guardia

// @route   POST api/tournaments
// @desc    Crear un torneo
// @access  Privado (Necesita Token)
router.post('/', auth, tournamentController.createTournament);
router.put('/join/:id', auth, tournamentController.joinTournament);

// @route   GET api/tournaments
// @desc    Obtener todos los torneos
// @access  Público
router.get('/my-tournaments', auth, tournamentController.getMyTournaments);
router.get('/', tournamentController.getTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.post('/generate/:id', auth, tournamentController.generateBrackets);
router.put('/publish/:id', auth, tournamentController.publishTournament);
router.get('/:id/matches', tournamentController.getTournamentMatches);
router.put('/match/:id', auth, tournamentController.updateMatchResult);
router.post('/advance/:id', auth, tournamentController.advanceTournament);
router.put('/:id', auth, tournamentController.updateTournament);
router.delete('/:id', auth, tournamentController.deleteTournament);
router.post('/team/:id', auth, tournamentController.createTeam); // Crear equipo
router.put('/team/join/:teamId', auth, tournamentController.joinTeam); // Solicitar unirse
router.put('/team/respond/:teamId', auth, tournamentController.respondToTeamRequest); // Aceptar/Rechazar miembro
router.put('/leave/:id', auth, tournamentController.leaveTournament); // Abandonar torneo
router.delete('/:tournamentId/expel/:userId', auth, tournamentController.expelParticipant); // Expulsar participante (Organizador)
router.put('/:id/br-round', auth, tournamentController.reportBRRoundWinner); // Reportar ganador de ronda Battle Royale

module.exports = router;