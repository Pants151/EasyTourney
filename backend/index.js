const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
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

    // Salas de usuario para desconexiones forzosas
    socket.on('joinUserRoom', (userId) => {
        socket.join('user_' + userId);
    });
});

// Inyectar io en la app
app.set('socketio', io);

app.use(cors());
app.use(express.json());

// Router logging
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
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));

connectDB();

app.get('/', (req, res) => {
    res.send('Servidor de EasyTourney funcionando 🚀');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});