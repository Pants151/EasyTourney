import React, { useEffect, useState } from 'react';
import gameService from '../services/gameService';
import { useNavigate } from 'react-router-dom';
import './TournamentsPage.css'; // Reutilizamos estilos de búsqueda y cards
import './GamesPage.css';

const GamesPage = () => {
    const [games, setGames] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState(8); // Cantidad inicial a mostrar
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await gameService.getGames(); //
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
        <div className="tournaments-page-wrapper mt-navbar">
            <div className="container py-5">
                <div className="header-page d-flex justify-content-between align-items-center mb-5">
                    <h1 className="fw-bolder text-uppercase m-0 text-white">JUEGOS</h1>
                    <div className="search-box-wrapper">
                        <input 
                            type="text" 
                            className="search-input-custom" 
                            placeholder="Buscar juego..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="bi bi-search search-icon-page"></i>
                    </div>
                </div>

                <div className="row">
                    {displayedGames.map(game => (
                        <div key={game._id} className="col-lg-3 col-md-4 col-6 mb-4">
                            {/* Al hacer clic, enviamos el ID del juego por parámetro URL */}
                            <div className="game-card-full" onClick={() => navigate(`/tournaments?game=${game._id}`)}>
                                <div className="game-cover-wrapper">
                                    <img src={game.caratula} alt={game.nombre} className="img-fluid" />
                                    <div className="game-card-overlay">
                                        <button className="btn btn-accent btn-sm">VER TORNEOS</button>
                                    </div>
                                </div>
                                <h6 className="text-center mt-2 text-uppercase fw-bold text-white">{game.nombre}</h6>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredGames.length > limit && (
                    <div className="text-center mt-4">
                        <button className="btn btn-view-more" onClick={() => setLimit(limit + 4)}>
                            VER MÁS JUEGOS
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamesPage;