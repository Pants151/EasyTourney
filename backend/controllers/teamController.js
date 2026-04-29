const Team = require('../models/Team');

exports.getAllTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('capitan', 'username email')
            .populate('torneo', 'nombre formato')
            .populate('miembros.usuario', 'username');
        res.json(teams);
    } catch (err) {
        console.error("Error en getAllTeams:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteTeam = async (req, res) => {
    try {
        const teamId = req.params.id;
        const team = await Team.findByIdAndDelete(teamId);
        if (!team) return res.status(404).json({ msg: 'Equipo no encontrado' });
        res.json({ msg: 'Equipo eliminado exitosamente' });
    } catch (err) {
        console.error("Error en deleteTeam:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteTeamsBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ msg: 'Se requiere un array de IDs' });
        await Team.deleteMany({ _id: { $in: ids } });
        res.json({ msg: `${ids.length} equipos eliminados exitosamente` });
    } catch (err) {
        console.error("Error en deleteTeamsBulk:", err.message);
        res.status(500).send('Error del servidor');
    }
};
