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
router.get('/', tournamentController.getTournaments);

module.exports = router;