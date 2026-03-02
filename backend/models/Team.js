const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true, minlength: [3, 'El nombre del equipo debe tener al menos 3 caracteres'], maxlength: [30, 'El nombre no puede exceder los 30 caracteres'] },
    capitan: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    torneo: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
    miembros: [{
        usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        estado: {
            type: String,
            enum: ['Aceptado', 'Pendiente'],
            default: 'Pendiente'
        }
    }]
});

module.exports = mongoose.model('Team', teamSchema);