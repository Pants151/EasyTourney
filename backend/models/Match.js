const matchSchema = new mongoose.Schema({
    torneo: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    // Referencias flexibles
    jugador1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jugador2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    equipo1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    equipo2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    ganadorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ganadorEquipo: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    ronda: { type: Number, required: true },
    resultado: { type: String }
});

module.exports = mongoose.model('Match', matchSchema);