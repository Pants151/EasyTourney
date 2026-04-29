const Match = require('../models/Match');

exports.getAllMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .populate('torneo', 'nombre formato estado')
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
        const match = await Match.findById(matchId).populate('torneo');
        if (!match) return res.status(404).json({ msg: 'Match no encontrado' });
        
        if (match.torneo && match.torneo.estado === 'En curso') {
            return res.status(400).json({ msg: 'No se puede borrar un match de un torneo en curso' });
        }

        await Match.findByIdAndDelete(matchId);
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

        // Encontrar los matches y verificar sus torneos
        const matchesToDelete = await Match.find({ _id: { $in: ids } }).populate('torneo');
        const invalidMatches = matchesToDelete.filter(m => m.torneo && m.torneo.estado === 'En curso');
        
        if (invalidMatches.length > 0) {
            return res.status(400).json({ msg: 'No se pueden borrar matches de torneos en curso' });
        }

        await Match.deleteMany({ _id: { $in: ids } });
        res.json({ msg: `${ids.length} matches eliminados exitosamente` });
    } catch (err) {
        console.error("Error en deleteMatchesBulk:", err.message);
        res.status(500).send('Error del servidor');
    }
};
