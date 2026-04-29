const Match = require('../models/Match');

exports.getAllMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .populate('torneo', 'nombre formato')
            .populate('jugador1', 'username')
            .populate('jugador2', 'username')
            .populate('equipo1', 'nombre')
            .populate('equipo2', 'nombre');
        res.json(matches);
    } catch (err) {
        console.error("Error en getAllMatches:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteMatch = async (req, res) => {
    try {
        const matchId = req.params.id;
        const match = await Match.findByIdAndDelete(matchId);
        if (!match) return res.status(404).json({ msg: 'Match no encontrado' });
        res.json({ msg: 'Match eliminado exitosamente' });
    } catch (err) {
        console.error("Error en deleteMatch:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteMatchesBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ msg: 'Se requiere un array de IDs' });
        await Match.deleteMany({ _id: { $in: ids } });
        res.json({ msg: `${ids.length} matches eliminados exitosamente` });
    } catch (err) {
        console.error("Error en deleteMatchesBulk:", err.message);
        res.status(500).send('Error del servidor');
    }
};
