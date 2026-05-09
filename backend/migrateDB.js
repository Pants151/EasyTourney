const mongoose = require('mongoose');

// Tus URIs directamente copiadas de tu archivo .env original
const URI_ATLAS = "mongodb+srv://Pants151:NNr0Q1dSGyI8QaB7@easytourney.qdhutvp.mongodb.net/easytourney?retryWrites=true&w=majority";
const URI_LOCAL = "mongodb://127.0.0.1:27018/easytourney"; // El puerto 27018 es el de tu nuevo Docker

async function migrate() {
    console.log("Iniciando herramienta de migración automática...");
    
    try {
        console.log("🌍 Conectando a la base de datos de producción (Atlas)...");
        const connAtlas = await mongoose.createConnection(URI_ATLAS).asPromise();
        
        console.log("🐳 Conectando a la base de datos de local (Docker)...");
        const connLocal = await mongoose.createConnection(URI_LOCAL).asPromise();

        // Obtener todas las colecciones que existen en Atlas
        const collections = await connAtlas.db.listCollections().toArray();
        
        for (let c of collections) {
            const colName = c.name;
            console.log(`\n⏳ Leyendo colección: ${colName}...`);
            
            // Extraer todos los datos de Atlas
            const data = await connAtlas.db.collection(colName).find({}).toArray();
            
            if (data.length > 0) {
                console.log(`   -> Encontrados ${data.length} registros. Preparando para copiar...`);
                
                // Vaciar la colección local actual para evitar duplicados
                await connLocal.db.collection(colName).deleteMany({});
                
                // Insertar los datos en el Docker local
                await connLocal.db.collection(colName).insertMany(data);
                console.log(`   ✅ ¡Migración de ${colName} completada!`);
            } else {
                console.log(`   -> Colección vacía. Se omite.`);
            }
        }

        console.log("\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO! Todos tus datos están ahora en Docker.");
        process.exit(0);
    } catch(err) {
        console.error("\n❌ Error durante la migración:", err);
        process.exit(1);
    }
}

migrate();
