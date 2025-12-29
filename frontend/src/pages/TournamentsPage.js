import React, { useEffect, useState, useContext } from 'react'; // Añadido useContext
import tournamentService from '../services/tournamentService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Importar el contexto
import './TournamentsPage.css';

const TournamentsPage = () => {
    const [tournaments, setTournaments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [limits, setLimits] = useState({ abiertos: 4, enCurso: 4, finalizados: 4 });
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const gameFilter = searchParams.get('game');

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const data = await tournamentService.getTournaments();
                setTournaments(data);
            } catch (err) {
                console.error("Error cargando torneos", err);
            }
        };
        fetchTournaments();
    }, []);

    // SI EL CONTEXTO ESTÁ CARGANDO, NO RENDERIZAMOS AÚN
    if (loading) return <div className="text-center py-5 text-white">Cargando usuario...</div>;

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
    if (t.formato === 'Equipos') {
        // Redirigir a detalles para que elija equipo
        navigate(`/tournament/${t._id}?join=true`);
    } else {
        // Inscripción directa para 1v1 y BR
        try { await tournamentService.joinTournament(t._id); window.location.reload(); } catch (err) { alert(err.response.data.msg); }
    }
};

    const renderSection = (title, status, limitKey) => {
        const sectionTournaments = filtered.filter(t => t.estado === status);
        const displayed = sectionTournaments.slice(0, limits[limitKey]);

        return (
            <div className="tournament-section mb-5">
                <h3 className="section-title-page text-uppercase fw-bold mb-4">
                    {title} <span className="text-accent">({sectionTournaments.length})</span>
                </h3>
                <div className="row">
                    {displayed.map(t => (
                        <div key={t._id} className="col-lg-3 col-md-6 mb-4">
                            <div className="tournament-card-page shadow-lg" onClick={() => navigate(`/tournament/${t._id}`)}>
                                <div className="card-image-wrapper">
                                    <img src={t.juego?.logo} alt="Game Logo" className="game-logo-card" />
                                    <div className="card-overlay-info">
                                        <span className="badge bg-accent">{t.modalidad}</span>
                                    </div>
                                </div>
                                <div className="card-content-page p-3 text-white">
                                    <h5 className="fw-bold mb-1 text-truncate">{t.nombre}</h5>
                                    <p className="small text-dim mb-2">{t.juego?.nombre}</p>
                                    <div className="d-flex justify-content-between small">
                                        <span><i className="bi bi-people me-1"></i> {t.participantes?.length}</span>
                                        <span>{new Date(t.fechaInicio).toLocaleDateString()}</span>
                                    </div>

                                    {/* BOTÓN DE INSCRIPCIÓN RÁPIDA */}
                                    {user?.rol === 'participante' && t.estado === 'Abierto' && !t.participantes.includes(user.id) && (
                                        <button 
                                            className="btn btn-accent btn-sm w-100 mt-3 fw-bold"
                                            onClick={(e) => handleQuickJoin(e, t)}
                                        >
                                            INSCRIBIRSE
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {sectionTournaments.length > limits[limitKey] && (
                    <div className="text-center mt-2">
                        <button 
                            className="btn btn-view-more" 
                            onClick={() => setLimits({...limits, [limitKey]: limits[limitKey] + 4})}
                        >
                            VER MÁS
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tournaments-page-wrapper mt-navbar">
            <div className="container py-5">
                {/* Cabecera actualizada con botones condicionales */}
                <div className="header-page mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h1 className="fw-bolder text-uppercase m-0 text-white">{getPageTitle()}</h1>
                        
                        {/* Validación de Rol para Organizador o Administrador */}
                        {(user?.rol === 'organizador' || user?.rol === 'administrador') && (
                            <div className="d-flex gap-3">
                                <button 
                                    className="btn btn-accent" 
                                    onClick={() => navigate('/manage-my-tournaments')}
                                >
                                    Gestionar mis torneos
                                </button>
                                <button 
                                    className="btn btn-view-all" 
                                    onClick={() => navigate('/create-tournament')}
                                >
                                    + Crear Torneo
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="search-box-wrapper w-100">
                        <input 
                            type="text" 
                            className="search-input-custom" 
                            placeholder="Buscar torneo por nombre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="bi bi-search search-icon-page"></i>
                    </div>
                </div>

                {renderSection("Torneos Abiertos", "Abierto", "abiertos")}
                {renderSection("Torneos en Curso", "En curso", "enCurso")}
                {renderSection("Torneos Finalizados", "Finalizado", "finalizados")}
            </div>
        </div>
    );
};

export default TournamentsPage;