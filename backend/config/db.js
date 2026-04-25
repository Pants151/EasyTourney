const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const isAtlas = process.env.USE_ATLAS === 'true';
        const uri = isAtlas ? process.env.MONGO_URI_ATLAS : process.env.MONGO_URI_LOCAL;
        
        await mongoose.connect(uri);
        console.log(`Conexión exitosa a MongoDB (${isAtlas ? 'Atlas/Nube' : 'Local'})`);
    } catch (err) {
        console.error('Error de conexión:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
