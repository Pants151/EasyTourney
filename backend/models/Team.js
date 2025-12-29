const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
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