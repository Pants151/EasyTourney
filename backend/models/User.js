const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
        maxlength: [20, 'El nombre de usuario no puede tener más de 20 caracteres']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        maxlength: [50, 'El correo electrónico no puede tener más de 50 caracteres']
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        maxlength: [100, 'La contraseña no puede tener más de 100 caracteres']
    },
    pais: {
        type: String,
        default: 'España',
        maxlength: [50, 'El país no puede tener más de 50 caracteres']
    },
    fechaNacimiento: {
        type: Date
    },
    idioma: {
        type: [String],
        default: ['es']
    },
    rol: {
        type: String,
        enum: ['administrador', 'organizador', 'participante', 'espectador'],
        default: 'participante'
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    sessionToken: {
        type: String 
    },
    isBot: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);