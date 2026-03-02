const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true, trim: true, minlength: [2, 'El nombre del juego debe tener al menos 2 caracteres'], maxlength: [50, 'El nombre del juego no puede exceder los 50 caracteres'] },
    plataformas: [{ type: String, required: true, maxlength: 30 }],
    caratula: { type: String, required: true, maxlength: 255 }, // URL de la imagen
    logo: { type: String, required: true, maxlength: 255 },     // URL de la imagen
    header: { type: String, required: true, maxlength: 255 },   // URL de la imagen
    fechaAñadido: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);