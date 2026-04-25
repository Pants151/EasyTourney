const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const isAtlas = process.env.USE_ATLAS === 'true';
        // Usar la elegida, pero si da undefined (ej. en Render), caer a la clásica MONGO_URI
        const uri = (isAtlas ? process.env.MONGO_URI_ATLAS : process.env.MONGO_URI_LOCAL) || process.env.MONGO_URI;
        
        await mongoose.connect(uri);
        console.log(`Conexión exitosa a MongoDB (${isAtlas ? 'Atlas/Nube' : 'Local'})`);
    } catch (err) {
        console.error('Error de conexión:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
