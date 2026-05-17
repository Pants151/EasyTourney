const Game = require('../models/Game');
const Tournament = require('../models/Tournament');

exports.getGames = async (req, res) => {
    try {
        const games = await Game.find().sort({ nombre: 1 });
        res.json(games);
    } catch (err) {
        res.status(500).send('Error al obtener los juegos');
    }
};

exports.createGame = async (req, res) => {
    try {
        const { nombre, plataformas, caratula, logo, header } = req.body;

        const newGame = new Game({
            nombre,
            plataformas,
            caratula,
            logo,
            header
        });

        await newGame.save();
        res.json(newGame);
    } catch (err) {
        console.error(err); 
        res.status(500).send('Error al guardar el juego');
    }
};

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

exports.deleteGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ msg: 'Juego no encontrado' });

        const tournamentsUsingGame = await Tournament.findOne({ juego: req.params.id });
        if (tournamentsUsingGame) {
            return res.status(400).json({ msg: 'No se puede eliminar el juego porque hay torneos asociados a él.' });
        }

        await Game.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Juego eliminado correctamente' });
    } catch (err) {
        res.status(500).send('Error al eliminar el juego');
    }
};

exports.deleteGamesBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ msg: 'Lista de IDs no válida' });

        const tournamentsUsingGames = await Tournament.findOne({ juego: { $in: ids } });
        if (tournamentsUsingGames) {
            return res.status(400).json({ msg: 'No se pueden eliminar los juegos seleccionados porque al menos uno tiene torneos asociados.' });
        }

        await Game.deleteMany({ _id: { $in: ids } });
        res.json({ msg: 'Juegos eliminados correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar juegos en bloque');
    }
};

exports.getTop5Games = async (req, res) => {
    try {
        // TO-DO: Reemplazar con agregación compleja
        const games = await Game.find().limit(5);
        res.json(games);
    } catch (err) {
        res.status(500).send('Error al obtener top juegos');
    }
};