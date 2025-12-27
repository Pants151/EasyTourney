const Game = require('../models/Game');

// Obtener todos los juegos
exports.getGames = async (req, res) => {
    try {
        const games = await Game.find().sort({ nombre: 1 });
        res.json(games);
    } catch (err) {
        res.status(500).send('Error al obtener los juegos');
    }
};

// Crear un juego (Solo Admin)
exports.createGame = async (req, res) => {
    try {
        const { nombre, plataformas, caratula, logo } = req.body;
        const newGame = new Game({ nombre, plataformas, caratula, logo });
        await newGame.save();
        res.json(newGame);
    } catch (err) {
        res.status(500).send('Error al guardar el juego');
    }
};

// Actualizar un juego (Solo Admin)
exports.updateGame = async (req, res) => {
    try {
        const { nombre, plataformas, caratula, logo, header } = req.body;
        let game = await Game.findById(req.params.id);

        if (!game) return res.status(404).json({ msg: 'Juego no encontrado' });

        game.nombre = nombre || game.nombre;
        game.plataformas = plataformas || game.plataformas;
        game.caratula = caratula || game.caratula;
        game.logo = logo || game.logo;
        game.header = header || game.header;

        await game.save();
        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar el juego');
    }
};

// Eliminar un juego (Solo Admin)
exports.deleteGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ msg: 'Juego no encontrado' });

        await Game.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Juego eliminado correctamente' });
    } catch (err) {
        res.status(500).send('Error al eliminar el juego');
    }
};