import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import { AuthContext } from '../context/AuthContext';
import './TournamentDetails.css';

const TournamentDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [activeTab, setActiveTab] = useState('fases'); // Estado para el mini-nav

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [tData, mData] = await Promise.all([
                    tournamentService.getTournamentById(id),
                    tournamentService.getTournamentMatches(id)
                ]);
                setTournament(tData);
                setMatches(mData);
            } catch (err) { console.error(err); }
        };
        fetchAll();
    }, [id]);

    if (!tournament) return <div className="text-center py-5 text-white">Cargando...</div>;

    const isOrganizer = user && tournament.organizador && (user.id === tournament.organizador._id || user.id === tournament.organizador);

    // Ejemplo de reporte visual de ganador
    const handleSetWinner = async (matchId, winnerId) => {
        if (!isOrganizer) return;
        try {
            await tournamentService.reportWinner(matchId, { ganador: winnerId });
            window.location.reload();
        } catch (err) { alert("Error al reportar ganador"); }
    };

    const handleSetWinnerBR = async (winnerId) => {
        if (!isOrganizer) return;
        if (window.confirm('¿Confirmar a este usuario como ganador?')) {
            try {
                await tournamentService.updateTournament(id, { ganador: winnerId, estado: 'Finalizado' });
                window.location.reload();
            } catch (err) { alert("Error al reportar ganador"); }
        }
    };

    const handlePublish = async () => {
    try {
        await tournamentService.publishTournament(id);
        alert('Torneo publicado correctamente.');
        window.location.reload();
    } catch (err) { alert('Error al publicar el torneo'); }
};

const handleGenerateBrackets = async () => {
    try {
        await tournamentService.generateBrackets(id);
        alert('Torneo iniciado y brackets generados.');
        window.location.reload();
    } catch (err) { alert(err.response?.data?.msg || 'Error al generar brackets'); }
};

const handleAdvanceRound = async () => {
    try {
        const res = await tournamentService.advanceTournament(id);
        alert(res.data.msg);
        window.location.reload();
    } catch (err) { alert(err.response?.data?.msg || 'Error al avanzar de ronda'); }
};

    const handleJoin = async () => {
        try {
            await tournamentService.joinTournament(id); //
            alert('¡Inscripción realizada con éxito!');
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al inscribirse');
        }
    };

    // Lógica para verificar si el usuario ya está inscrito
    const isJoined = tournament.participantes.some(p => (p._id || p) === (user?.id || user?._id));
    // Solo mostramos el botón si es participante, el torneo está abierto y no está unido
    const showJoinButton = user?.rol === 'participante' && tournament.estado === 'Abierto' && !isJoined;

    // Agrupamos enfrentamientos por rondas para "FASES"
    const rounds = {};
    matches.forEach(m => {
        if (!rounds[m.ronda]) rounds[m.ronda] = [];
        rounds[m.ronda].push(m);
    });

    return (
        <div className="details-page-wrapper mt-navbar">
            <header className="tournament-hero" style={{ backgroundImage: `url(${tournament.juego?.header})` }}>
                <div className="hero-overlay-details"></div>
                <div className="container hero-info-content">
                    <div className="d-flex align-items-center mb-3">
                        <img src={tournament.juego?.logo} alt="Logo" className="game-logo-details me-4" />
                        <div>
                            <span className={`badge mb-2 ${tournament.estado === 'Finalizado' ? 'bg-success' : 'bg-accent'}`}>
                                {tournament.estado.toUpperCase()}
                            </span>
                            <h1 className="display-4 fw-bolder text-white text-uppercase">{tournament.nombre}</h1>
                        </div>
                    </div>

                    {/* BOTONES PARA EL ORGANIZADOR */}
                    {isOrganizer && (
                        <div className="d-flex gap-2 mt-3">
                            {tournament.estado === 'Borrador' && (
                                <button className="btn btn-accent px-4 fw-bold" onClick={handlePublish}>
                                    PUBLICAR TORNEO
                                </button>
                            )}
                            {tournament.estado === 'Abierto' && tournament.participantes?.length >= 2 && (
                                <button className="btn btn-accent px-4 fw-bold" onClick={handleGenerateBrackets}>
                                    INICIAR Y GENERAR BRACKETS
                                </button>
                            )}
                            {tournament.estado === 'En curso' && (
                                <button className="btn btn-outline-warning px-4 fw-bold" onClick={handleAdvanceRound}>
                                    AVANZAR RONDA / FINALIZAR
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="container py-5">
                <div className="row">
                    {/* INFO LATERAL (Se queda fija aquí) */}
                    <div className="col-lg-3">
                        <div className="info-card-custom mb-4 shadow-sm">
                            <h5 className="text-accent fw-bold text-uppercase mb-3">Resumen</h5>
                            <ul className="list-unstyled text-white small">
                                <li className="mb-2"><i className="bi bi-controller text-accent me-2"></i> {tournament.juego?.nombre}</li>
                                <li className="mb-2"><i className="bi bi-calendar-event text-accent me-2"></i> {new Date(tournament.fechaInicio).toLocaleDateString()}</li>
                                <li className="mb-2"><i className="bi bi-people text-accent me-2"></i> {tournament.participantes?.length} Inscritos</li>
                                <li className="mb-2"><i className="bi bi-shield-check text-accent me-2"></i> {tournament.formato || tournament.modalidad}</li>
                            </ul>

                            {/* BOTÓN DE INSCRIPCIÓN */}
                            {showJoinButton && (
                                <button className="btn btn-accent w-100 mt-3 fw-bold" onClick={handleJoin}>
                                    INSCRIBIRSE AHORA
                                </button>
                            )}
                            {isJoined && user?.rol === 'participante' && (
                                <div className="alert alert-success mt-3 py-2 text-center small fw-bold">
                                    <i className="bi bi-check-circle me-2"></i>ESTÁS INSCRITO
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CONTENIDO DINÁMICO CON MINI-NAV */}
                    <div className="col-lg-9">
                        <div className="tournament-mini-nav d-flex gap-4 mb-4 border-bottom border-secondary pb-2">
                            {['fases', 'información', 'participantes', 'streams'].map(tab => (
                                <button 
                                    key={tab}
                                    className={`nav-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="tab-content-wrapper">
                            {/* VISTA FASES (Brackets) */}
                            {activeTab === 'fases' && (
                                <div className="fases-content">
                                    {tournament.formato === 'Battle Royale' ? (
                                        <div className="br-standings text-white bg-dark-secondary p-4 rounded">
                                            <h5 className="mb-3 text-accent">Reportar Ganador de Ronda</h5>
                                            <div className="d-flex flex-wrap">
                                                {tournament.participantes.map(p => (
                                                    <button key={p._id} className="btn btn-outline-light m-2" onClick={() => handleSetWinnerBR(p._id)}>
                                                        {p.username} GANA RONDA
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : Object.keys(rounds).length > 0 ? (
                                        <div className="brackets-container d-flex gap-4 overflow-auto pb-4">
                                            {Object.keys(rounds).sort().map(rNum => (
                                                <div key={rNum} className="round-column">
                                                    <h6 className="text-center text-accent text-uppercase mb-3">Ronda {rNum}</h6>
                                                    {rounds[rNum].map(m => (
                                                        <div key={m._id} className="match-card-tree mb-3 p-2 text-white shadow-sm">
                                                            <div 
                                                                className={`p-2 rounded ${m.ganador?._id === m.jugador1?._id ? 'bg-winner' : 'bg-dark'} ${isOrganizer ? 'player-slot' : ''}`}
                                                                onClick={() => isOrganizer && m.jugador1 && handleSetWinner(m._id, m.jugador1._id)}
                                                            >
                                                                <small>{m.jugador1?.username || 'TBD'}</small>
                                                            </div>
                                                            <div className="text-center small py-1 text-dim">VS</div>
                                                            <div 
                                                                className={`p-2 rounded ${m.ganador?._id === m.jugador2?._id ? 'bg-winner' : 'bg-dark'} ${isOrganizer ? 'player-slot' : ''}`}
                                                                onClick={() => isOrganizer && m.jugador2 && handleSetWinner(m._id, m.jugador2._id)}
                                                            >
                                                                <small>{m.jugador2?.username || 'BYE'}</small>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 bg-dark-secondary rounded">
                                            <p className="text-dim m-0">El cuadro se generará cuando inicie el torneo.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VISTA INFORMACIÓN (Reglamento) */}
                            {activeTab === 'información' && (
                                <div className="info-tab-content text-white p-4 bg-dark-secondary rounded shadow-sm">
                                    <h4 className="text-accent text-uppercase fw-bold mb-3">Reglamento y Detalles</h4>
                                    <p className="reglas-text" style={{ whiteSpace: 'pre-wrap' }}>
                                        {tournament.reglas || "El organizador no ha proporcionado reglas específicas aún."}
                                    </p>
                                </div>
                            )}

                            {/* VISTA PARTICIPANTES (Tarjetas) */}
                            {activeTab === 'participantes' && (
                                <div className="row">
                                    {tournament.participantes.map(p => (
                                        <div key={p._id} className="col-md-4 mb-3">
                                            <div className="participant-card p-3 bg-dark-secondary rounded text-center shadow-sm">
                                                <div className="avatar-placeholder mb-2 mx-auto">
                                                    <i className="bi bi-person-circle fs-2 text-accent"></i>
                                                </div>
                                                <h6 className="text-white fw-bold mb-0">{p.username}</h6>
                                                <small className="text-dim text-uppercase" style={{fontSize: '0.7rem'}}>Jugador</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* VISTA STREAMS/VÍDEOS */}
                            {activeTab === 'streams' && (
                                <div className="streams-tab-content text-center py-5 bg-dark-secondary rounded">
                                    <i className="bi bi-broadcast fs-1 text-accent mb-3"></i>
                                    <h5 className="text-white">Sin transmisiones activas</h5>
                                    <p className="text-dim">Próximamente podrás ver aquí los directos de Twitch y vídeos de YouTube asociados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentDetails;