const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    torneo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    jugador1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    jugador2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ronda: {
        type: Number,
        default: 1
    },
    ganador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resultado: {
        type: String, // Ejemplo: "2-1"
        default: "Pendiente"
    },
    siguientePartida: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    }
});

module.exports = mongoose.model('Match', matchSchema);