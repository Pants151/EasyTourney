const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true, minlength: [3, 'El nombre debe tener al menos 3 caracteres'], maxlength: [50, 'El nombre no puede exceder los 50 caracteres'] },
    juego: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    plataformas: [String],
    limiteParticipantes: { type: Number, default: 16 },
    formato: { type: String, enum: ['1v1', 'Equipos', 'Battle Royale', 'Battle Royale - Por equipos'], default: '1v1' },
    tamanoEquipoMax: { type: Number, default: 2 },
    equipos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    ubicacion: { type: String, default: 'Online', maxlength: [100, 'La ubicación no puede exceder los 100 caracteres'] },
    fechaInicio: { type: Date, required: true },
    estado: { type: String, enum: ['Borrador', 'Abierto', 'En curso', 'Finalizado', 'Cancelado'], default: 'Borrador' },
    reglas: { type: String, maxlength: [1000, 'Las reglas no pueden exceder los 1000 caracteres'] },
    organizador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ganador: { type: mongoose.Schema.Types.ObjectId, refPath: 'ganadorTipo' },
    ganadorTipo: { type: String, enum: ['User', 'Team'], default: 'User' },
    participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    alMejorDe: { type: Number, default: 1 },
    ganadoresRondaBR: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'tipoGanadorRonda' }],
    tipoGanadorRonda: { type: String, enum: ['User', 'Team'], default: 'User' },
    streams: [{
        plataforma: { type: String, enum: ['Twitch', 'YouTube'] },
        url: { type: String, maxlength: [255, 'La URL de stream no puede exceder 255 caracteres'] }
    }],
    // Snapshots visuales
    snapNombresBots: { type: Map, of: String },
    snapNombresEquipos: { type: Map, of: String },
    snapEquiposMiembros: { type: Map, of: [String] },
    descalificados: [{ type: mongoose.Schema.Types.ObjectId }]
});

module.exports = mongoose.model('Tournament', tournamentSchema);