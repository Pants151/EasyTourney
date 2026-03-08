const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

require('./models/User');
require('./models/Game');
require('./models/Team');
require('./models/Tournament');
require('./models/Match');

const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    socket.on('joinTournament', (tournamentId) => {
        socket.join(tournamentId);
    });

    // --- GESTIÓN DE SALAS DE USUARIO PARA DESCONEXIONES FORZOSAS ---
    socket.on('joinUserRoom', (userId) => {
        socket.join('user_' + userId);
    });
});

// Hacer io accesible en los controladores
app.set('socketio', io);

// Middlewares
app.use(cors());
app.use(express.json()); // Permite leer JSON en las peticiones

// Middleware de Logging para depuración (ayuda al usuario a ver qué llega)
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log("Body:", JSON.stringify(req.body, null, 2));
        }
    }
    next();
});
app.use('/api/auth', authRoutes);
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/tournaments', tournamentRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conexión exitosa a MongoDB'))
    .catch((err) => console.error('❌ Error de conexión:', err));

// Ruta de prueba inicial
app.get('/', (req, res) => {
    res.send('Servidor de EasyTourney funcionando 🚀');
});

// Arrancar el servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});