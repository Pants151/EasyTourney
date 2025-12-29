const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    torneo: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    // Soporte para 1v1
    jugador1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jugador2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Soporte para Equipos
    equipo1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    equipo2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    ronda: { type: Number, default: 1 },
    // Ganador flexible (puede ser User o Team)
    ganador: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'ganadorTipo' 
    },
    ganadorTipo: {
        type: String,
        required: true,
        enum: ['User', 'Team'],
        default: 'User'
    },
    resultado: { type: String, default: "Pendiente" }
});

module.exports = mongoose.model('Match', matchSchema);