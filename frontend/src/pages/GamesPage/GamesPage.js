import React, { useEffect, useState, useContext } from 'react';
import gameService from '../../services/gameService';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import GamesPageView from './GamesPageView';

const GamesPage = () => {
    const [games, setGames] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState(8);
    const { user, loading } = useContext(AuthContext); // Obtener usuario y estado de carga
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await gameService.getGames();
                setGames(data);
            } catch (err) {
                console.error("Error cargando juegos", err);
            }
        };
        fetchGames();
    }, []);

    const filteredGames = games.filter(g =>
        g.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayedGames = filteredGames.slice(0, limit);

        return (
        <GamesPageView
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            user={user}
            navigate={navigate}
            displayedGames={displayedGames}
            filteredGames={filteredGames}
            limit={limit}
            setLimit={setLimit}
        />
    );
};

export default GamesPage;
