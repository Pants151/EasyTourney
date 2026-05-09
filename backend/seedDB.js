const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Intentar importar EJSON (propio de MongoDB) para parsear los {"$oid": "..."} y {"$date": "..."}
let EJSON;
try {
    EJSON = require('bson').EJSON;
} catch (e) {
    try {
        EJSON = require('mongoose').mongo.BSON.EJSON;
    } catch(err) {
        console.warn("Advertencia: No se pudo cargar EJSON. Asegúrate de que los archivos JSON sean compatibles.");
    }
}

// Cargar las variables de entorno
require('dotenv').config();

// Usar la URI correcta dependiendo del entorno (Atlas o Local/Docker)
const URI = process.env.USE_ATLAS === 'true' 
    ? process.env.MONGO_URI_ATLAS 
    : process.env.MONGO_URI_LOCAL;

async function seed() {
    console.log("Iniciando herramienta de importación local...");
    
    // Carpeta donde has puesto los archivos .json
    const dataFolder = path.join(__dirname, 'config', 'bbdd_files');
    
    if (!fs.existsSync(dataFolder)) {
        console.log(`\n❌ La carpeta '${dataFolder}' no existe.`);
        console.log("👉 Por favor, asegúrate de que la ruta backend/config/bbdd_files existe y tiene los archivos.");
        process.exit(1);
    }

    try {
        console.log(`🐳 Conectando a la base de datos para revisar importación...`);
        const connLocal = await mongoose.createConnection(URI).asPromise();

        // Comprobar si ya existen datos para no borrarlos
        const collectionsList = await connLocal.db.listCollections().toArray();
        if (collectionsList.some(c => c.name === 'users')) {
            const userCount = await connLocal.db.collection('users').countDocuments();
            if (userCount > 0) {
                console.log("⏩ La base de datos ya contiene información. Se omite la importación inicial.");
                process.exit(0);
            }
        }

        // Leer todos los archivos de la carpeta
        const files = fs.readdirSync(dataFolder).filter(f => f.endsWith('.json'));
        
        if (files.length === 0) {
            console.log("\n❌ No se encontraron archivos .json en la carpeta 'seedData'.");
            process.exit(1);
        }

        for (let file of files) {
            // Extraer el nombre real de la colección (ej: easytourney.users.json -> users, o users.json -> users)
            const parts = file.split('.');
            const colName = parts[parts.length - 2]; // coge el penúltimo elemento (users)
            
            console.log(`\n⏳ Leyendo archivo: ${file} (Colección detectada: ${colName})...`);
            
            const filePath = path.join(dataFolder, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            
            let data;
            try {
                // Parsear usando EJSON si está disponible (para resolver los $oid y $date de MongoDB Compass)
                if (EJSON) {
                    data = EJSON.parse(fileContent);
                } else {
                    data = JSON.parse(fileContent);
                }
                
                // Si compass lo exporta como un objeto con un array dentro, o línea a línea
                if (!Array.isArray(data)) {
                    data = [data]; 
                }
            } catch (parseErr) {
                console.error(`   ❌ Error al leer ${file}. Asegúrate de que es un JSON válido.`);
                continue;
            }
            
            if (data.length > 0) {
                console.log(`   -> Encontrados ${data.length} registros. Insertando...`);
                
                // Vaciar la colección local actual
                await connLocal.db.collection(colName).deleteMany({});
                
                // Insertar los datos
                await connLocal.db.collection(colName).insertMany(data);
                console.log(`   ✅ ¡${colName} importada correctamente!`);
            } else {
                console.log(`   -> El archivo está vacío. Se omite.`);
            }
        }

        console.log("\n🎉 ¡IMPORTACIÓN COMPLETADA CON ÉXITO! Todos tus datos están ahora en Docker.");
        process.exit(0);
    } catch(err) {
        console.error("\n❌ Error durante la importación:", err);
        process.exit(1);
    }
}

seed();
