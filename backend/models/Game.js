const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    plataformas: [{
        type: String,
        required: true
    }],
    caratula: {
        type: String, // URL de la imagen
        required: true
    },
    logo: {
        type: String, // URL de la imagen
        required: true
    },
    fechaAñadido: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Game', gameSchema);