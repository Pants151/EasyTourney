const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    juego: {
        type: String,
        required: true
    },
    plataformas: [String], // Array de strings (PC, PS5, etc.)
    modalidad: {
        type: String,
        enum: ['1v1', 'Equipos'],
        default: '1v1'
    },
    ubicacion: {
        type: String, // Online o Presencial
        default: 'Online'
    },
    fechaInicio: {
        type: Date,
        required: true
    },
    estado: {
        type: String,
        enum: ['Borrador', 'Abierto', 'En curso', 'Finalizado'],
        default: 'Borrador'
    },
    reglas: {
        type: String
    },
    organizador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Relación con el modelo de Usuario
        required: true
    },
    participantes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model('Tournament', tournamentSchema);