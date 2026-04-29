const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/', auth, adminAuth, teamController.getAllTeams);
router.delete('/bulk', auth, adminAuth, teamController.deleteTeamsBulk);
router.delete('/:id', auth, adminAuth, teamController.deleteTeam);

module.exports = router;
