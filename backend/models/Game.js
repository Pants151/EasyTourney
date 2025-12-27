const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true, trim: true },
    plataformas: [{ type: String, required: true }],
    caratula: { type: String, required: true }, // URL de la imagen
    logo: { type: String, required: true },     // URL de la imagen
    header: { type: String, required: true },   // URL de la imagen
    fechaAñadido: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);