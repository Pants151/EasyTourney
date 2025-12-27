const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/', gameController.getGames);
router.post('/', [auth, adminAuth], gameController.createGame);
router.put('/:id', [auth, adminAuth], gameController.updateGame);
router.delete('/:id', [auth, adminAuth], gameController.deleteGame);

module.exports = router;