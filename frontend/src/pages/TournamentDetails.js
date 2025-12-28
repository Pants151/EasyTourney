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

    const handlePublish = async () => {
        try {
            await tournamentService.publishTournament(id);
            alert('Torneo publicado. Ahora los usuarios pueden inscribirse.');
            window.location.reload();
        } catch (err) { alert('Error al publicar'); }
    };

    const handleGenerateBrackets = async () => {
        try {
            await tournamentService.generateBrackets(id);
            alert('Torneo iniciado y enfrentamientos generados.');
            window.location.reload();
        } catch (err) { alert(err.response?.data?.msg || 'Error al generar brackets'); }
    };

    const handleAdvanceRound = async () => {
        try {
            const res = await tournamentService.advanceTournament(id);
            alert(res.data.msg);
            window.location.reload();
        } catch (err) { alert(err.response?.data?.msg || 'Error al avanzar'); }
    };

    const handleReportMatch = async (matchId, player1, player2) => {
        const winnerUsername = prompt(`¿Quién ganó? Escribe el nombre de usuario exacto (${player1?.username} o ${player2?.username}):`);
        if (!winnerUsername) return;

        let winnerId = null;
        if (winnerUsername === player1?.username) winnerId = player1._id;
        else if (winnerUsername === player2?.username) winnerId = player2._id;
        else {
            alert("Usuario no coincide con ninguno de los participantes.");
            return;
        }

        const score = prompt("Ingresa el resultado (ej: 2-1):", "1-0");

        try {
            await tournamentService.updateMatchResult(matchId, { ganadorId: winnerId, resultado: score });
            alert("Resultado registrado");
            window.location.reload();
        } catch (err) {
            alert("Error al registrar resultado");
        }
    };

    if (!tournament) return <div className="text-center py-5 text-white">Cargando...</div>;

    const isOrganizer = user && tournament.organizador && user.id === tournament.organizador._id;

    // Agrupamos los enfrentamientos por ronda para la vista de árbol
    const rounds = {};
    matches.forEach(m => {
        if (!rounds[m.ronda]) rounds[m.ronda] = [];
        rounds[m.ronda].push(m);
    });

    return (
        <div className="details-page-wrapper mt-navbar">
            {/* --- HERO SECTION --- */}
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
                    
                    {/* BOTONES DE ACCIÓN PARA EL ORGANIZADOR */}
                    {isOrganizer && (
                        <div className="d-flex gap-2 mt-3">
                            {tournament.estado === 'Borrador' && (
                                <button className="btn btn-accent px-4" onClick={handlePublish}>PUBLICAR TORNEO</button>
                            )}
                            {tournament.estado === 'Abierto' && tournament.participantes.length >= 2 && (
                                <button className="btn btn-accent px-4" onClick={handleGenerateBrackets}>INICIAR Y GENERAR BRACKETS</button>
                            )}
                            {tournament.estado === 'En curso' && (
                                <button className="btn btn-outline-warning px-4" onClick={handleAdvanceRound}>AVANZAR RONDA / FINALIZAR</button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="container py-5">
                <div className="row">
                    {/* INFO LATERAL */}
                    <div className="col-lg-3">
                        <div className="info-card-custom mb-4">
                            <h5 className="text-accent fw-bold text-uppercase mb-3">Información</h5>
                            {tournament.estado === 'Finalizado' && tournament.ganador && (
                                <div className="alert alert-success p-2 text-center mb-3">
                                    <small className="d-block text-uppercase fw-bold">Campeón 🏆</small>
                                    <strong>{tournament.ganador.username}</strong>
                                </div>
                            )}
                            <ul className="list-unstyled text-white small">
                                <li className="mb-2"><strong>Plataformas:</strong> {tournament.plataformas?.join(', ')}</li>
                                <li className="mb-2"><strong>Inscritos:</strong> {tournament.participantes?.length}</li>
                                <li className="mb-2"><strong>Fecha:</strong> {new Date(tournament.fechaInicio).toLocaleDateString()}</li>
                            </ul>
                            
                            {/* Botón de inscripción para usuarios */}
                            {!isOrganizer && tournament.estado === 'Abierto' && (
                                <button className="btn btn-accent w-100 mt-3 fw-bold" onClick={async () => {
                                    try {
                                        await tournamentService.joinTournament(id);
                                        alert('¡Inscripción exitosa!');
                                        window.location.reload();
                                    } catch (err) { alert(err.response?.data?.msg || 'Error al inscribirse'); }
                                }}>
                                    INSCRIBIRSE AHORA
                                </button>
                            )}
                        </div>
                    </div>

                    {/* VISTA DE BRACKETS POR RONDAS */}
                    <div className="col-lg-9">
                        <h3 className="text-white fw-bold text-uppercase mb-4">Cuadro del Torneo</h3>
                        {Object.keys(rounds).length > 0 ? (
                            <div className="brackets-container d-flex gap-4 overflow-auto pb-4">
                                {Object.keys(rounds).sort().map(rondaNum => (
                                    <div key={rondaNum} className="round-column">
                                        <h6 className="text-center text-accent text-uppercase mb-3">Ronda {rondaNum}</h6>
                                        {rounds[rondaNum].map(m => (
                                            <div key={m._id} className="match-card-tree mb-3 p-2 text-white">
                                                <div className={`p-2 rounded ${m.ganador?._id === m.jugador1?._id ? 'bg-winner' : 'bg-dark'}`}>
                                                    <small>{m.jugador1?.username || 'TBD'}</small>
                                                </div>
                                                <div className="text-center small py-1 text-dim">VS</div>
                                                <div className={`p-2 rounded ${m.ganador?._id === m.jugador2?._id ? 'bg-winner' : 'bg-dark'}`}>
                                                    <small>{m.jugador2?.username || 'BYE'}</small>
                                                </div>
                                                {/* El organizador puede reportar el resultado haciendo clic aquí */}
                                                {isOrganizer && tournament.estado === 'En curso' && !m.ganador && (
                                                    <button className="btn btn-link btn-sm text-accent w-100 p-0 mt-1" 
                                                        onClick={() => handleReportMatch(m._id, m.jugador1, m.jugador2)}>Reportar</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 bg-dark-secondary rounded">
                                <p className="text-dim m-0">Esperando el inicio del torneo para mostrar los brackets.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentDetails;