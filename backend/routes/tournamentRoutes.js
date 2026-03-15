const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const auth = require('../middleware/auth');

router.post('/', auth, tournamentController.createTournament);
router.put('/join/:id', auth, tournamentController.joinTournament);

router.get('/my-tournaments', auth, tournamentController.getMyTournaments);
router.get('/', tournamentController.getTournaments);
router.delete('/delete/bulk', auth, tournamentController.deleteTournamentsBulk);
router.get('/:id', tournamentController.getTournamentById);
router.post('/generate/:id', auth, tournamentController.generateBrackets);
router.put('/publish/:id', auth, tournamentController.publishTournament);
router.get('/:id/matches', tournamentController.getTournamentMatches);
router.put('/match/:id', auth, tournamentController.updateMatchResult);
router.post('/advance/:id', auth, tournamentController.advanceTournament);
router.put('/:id', auth, tournamentController.updateTournament);
router.delete('/:id', auth, tournamentController.deleteTournament);
router.post('/team/:id', auth, tournamentController.createTeam);
router.put('/team/join/:teamId', auth, tournamentController.joinTeam);
router.put('/team/respond/:teamId', auth, tournamentController.respondToTeamRequest);
router.put('/leave/:id', auth, tournamentController.leaveTournament);
router.delete('/:tournamentId/expel/:userId', auth, tournamentController.expelParticipant);
router.put('/:id/br-round', auth, tournamentController.reportBRRoundWinner);
router.post('/:id/add-bot', auth, tournamentController.addBot);
router.put('/:id/rename-bot/:entityId', auth, tournamentController.renameBot);
router.delete('/:id/clear-bots', auth, tournamentController.clearBots);
router.put('/:id/disqualify/:type/:targetId', auth, tournamentController.disqualifyParticipant);
router.put('/:id/cancel', auth, tournamentController.cancelTournament);

module.exports = router;
