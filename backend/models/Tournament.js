const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    juego: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    plataformas: [String],
    limiteParticipantes: { type: Number, default: 16 },
    formato: { type: String, enum: ['1v1', 'Equipos', 'Battle Royale'], default: '1v1' },
    tamanoEquipoMax: { type: Number, min: 1, max: 6, default: 1 },
    equipos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    ubicacion: { type: String, default: 'Online' },
    fechaInicio: { type: Date, required: true },
    estado: { type: String, enum: ['Borrador', 'Abierto', 'En curso', 'Finalizado'], default: 'Borrador' },
    reglas: { type: String },
    organizador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ganador: { type: mongoose.Schema.Types.ObjectId, refPath: 'ganadorTipo' },
    ganadorTipo: { type: String, enum: ['User', 'Team'], default: 'User' },
    participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    alMejorDe: { type: Number, default: 1 },
    ganadoresRondaBR: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    streams: [{
        plataforma: { type: String, enum: ['Twitch', 'YouTube'] },
        url: { type: String }
    }],
});

module.exports = mongoose.model('Tournament', tournamentSchema);