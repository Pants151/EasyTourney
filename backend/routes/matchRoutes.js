const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/', auth, adminAuth, matchController.getAllMatches);
router.delete('/bulk', auth, adminAuth, matchController.deleteMatchesBulk);
router.delete('/:id', auth, adminAuth, matchController.deleteMatch);

module.exports = router;
