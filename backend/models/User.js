const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    pais: {
        type: String,
        default: 'España'
    },
    fechaNacimiento: {
        type: Date
    },
    idioma: {
        type: String,
        default: 'es'
    },
    rol: {
        type: String,
        enum: ['administrador', 'organizador', 'participante', 'espectador'],
        default: 'participante'
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);