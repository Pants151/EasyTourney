import React, { useEffect, useState, useContext } from 'react'; // Añadido useContext
import tournamentService from '../../services/tournamentService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext'; // Importar el contexto
import TournamentsPageView from './TournamentsPageView';

const TournamentsPage = () => {
    const [tournaments, setTournaments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [limits, setLimits] = useState({ abiertos: 4, enCurso: 4, finalizados: 4 });
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const gameFilter = searchParams.get('game');

    useEffect(() => {
        // Pintar primero desde caché local si existe para evitar parpadeos
        try {
            const cached = localStorage.getItem('cachedTournaments');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    setTournaments(parsed);
                }
            }
        } catch (e) {
            // Ignorar errores de localStorage/JSON
        }

        const fetchTournaments = async () => {
            try {
                const data = await tournamentService.getTournaments();
                setTournaments(data);
                try {
                    localStorage.setItem('cachedTournaments', JSON.stringify(data));
                } catch (e) {
                    // Ignorar si no se puede cachear
                }
            } catch (err) {
                console.error("Error cargando torneos", err);
            }
        };
        fetchTournaments();
    }, []);

    const filtered = tournaments.filter(t => {
        const matchesSearch = t.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGame = gameFilter ? (t.juego?._id === gameFilter) : true;
        return matchesSearch && matchesGame;
    });

    const getPageTitle = () => {
        if (gameFilter && filtered.length > 0) {
            return `TORNEOS DE ${filtered[0].juego?.nombre}`;
        }
        return "TORNEOS";
    };

    // Función para manejar la inscripción desde la lista
    const handleQuickJoin = async (e, t) => {
        e.stopPropagation();
        if (t.formato === 'Equipos' || t.formato === 'Battle Royale - Por equipos') {
            // Redirigir a detalles para que elija equipo
            navigate(`/tournament/${t._id}?join=true`);
        } else {
            // Inscripción directa para 1v1 y BR
            try { await tournamentService.joinTournament(t._id); window.location.reload(); } catch (err) { alert(err.response.data.msg); }
        }
    };

    return (
        <TournamentsPageView
            user={user}
            navigate={navigate}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filtered={filtered}
            limits={limits}
            setLimits={setLimits}
            getPageTitle={getPageTitle}
            handleQuickJoin={handleQuickJoin}
        />
    );
};

export default TournamentsPage;