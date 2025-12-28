import React, { useEffect, useState, useContext } from 'react'; // Importar useContext
import gameService from '../services/gameService';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Importar el contexto
import './TournamentsPage.css'; // Reutilizamos estilos globales
import './GamesPage.css';

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

    // Si el contexto está cargando, mostramos un spinner o mensaje
    if (loading) return <div className="text-center py-5 text-white">Verificando permisos...</div>;

    return (
        <div className="tournaments-page-wrapper mt-navbar">
            <div className="container py-5">
                <div className="header-page mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="fw-bolder text-uppercase m-0 text-white">JUEGOS</h1>
                        
                        {/* Botón exclusivo para Administradores */}
                        {user?.rol === 'administrador' && (
                            <button 
                                className="btn btn-accent" 
                                onClick={() => navigate('/admin/games')}
                            >
                                Gestionar Juegos
                            </button>
                        )}
                    </div>

                    <div className="search-box-wrapper w-100">
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
                            <div className="game-card-full" onClick={() => navigate(`/tournaments?game=${game._id}`)}>
                                <div className="game-cover-wrapper shadow-lg">
                                    <img src={game.caratula} alt={game.nombre} className="img-fluid" />
                                    <div className="game-card-overlay">
                                        <button className="btn btn-accent btn-sm">VER TORNEOS</button>
                                    </div>
                                </div>
                                <h6 className="text-center mt-3 text-uppercase fw-bold text-white letter-spacing-1">
                                    {game.nombre}
                                </h6>
                            </div>
                        </div>
                    ))}
                    {filteredGames.length === 0 && (
                        <div className="col-12 text-center py-5">
                            <p className="text-dim">No se encontraron juegos que coincidan con la búsqueda.</p>
                        </div>
                    )}
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