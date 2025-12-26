import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import { AuthContext } from '../context/AuthContext';

const TournamentDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const data = await tournamentService.getTournamentById(id);
                setTournament(data);
                if (data.estado === 'En curso') {
                    const matchesData = await tournamentService.getTournamentMatches(id);
                    setMatches(matchesData);
                }
            } catch (err) {
                console.error("Error cargando torneo", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTournament();
    }, [id]);

    const handleStart = async () => {
        try {
            await tournamentService.generateBrackets(id);
            alert('¡Torneo iniciado! Brackets generados.');
            window.location.reload();
        } catch (err) {
            alert('Error al iniciar el torneo.');
        }
    };

    const handlePublish = async () => {
        try {
            await tournamentService.publishTournament(id);
            alert('¡Torneo publicado! Ahora los usuarios pueden inscribirse.');
            window.location.reload();
        } catch (err) {
            alert('Error al publicar el torneo.');
        }
    };

    const handleReportResult = async (matchId) => {
        const resultado = prompt("Introduce el resultado (ej. 2-1):");
        if (!resultado) return;

        // Para simplificar, pediremos el nombre del ganador o su ID
        // En una versión más avanzada usaríamos un selector (Select/Modal)
        const ganadorId = prompt("ID del ganador (Copia el ID del jugador o introduce 1 para Jugador 1, 2 para Jugador 2):");
        
        // Aquí podrías mejorar la lógica para obtener el ID real basado en la selección
        // Por ahora, implementaremos la llamada básica
        try {
            const match = matches.find(m => m._id === matchId);
            const targetId = ganadorId === "1" ? match.jugador1._id : (ganadorId === "2" ? match.jugador2._id : ganadorId);

            await tournamentService.updateMatchResult(matchId, {
                ganadorId: targetId,
                resultado: resultado
            });
            alert('Resultado actualizado');
            window.location.reload();
        } catch (err) {
            alert('Error al actualizar resultado');
        }
    };

    const handleAdvance = async () => {
        try {
            const res = await tournamentService.advanceTournament(id);
            alert(res.data.msg);
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al avanzar de ronda');
        }
    };

    if (loading) return <div className="text-center mt-5">Cargando...</div>;
    if (!tournament) return <div className="text-center mt-5">Torneo no encontrado</div>;

    return (
        <div className="container mt-4">
            <div className="card shadow border-0 p-4">
                <h1 className="text-primary">{tournament.nombre}</h1>
                <p className="text-muted">{tournament.juego} | {tournament.modalidad}</p>
                <hr />
                
                <div className="row">
                    <div className="col-md-8">
                        <h5>Reglas</h5>
                        <p className="bg-light p-3 rounded">{tournament.reglas || "Sin reglas definidas."}</p>
                        
                        <h5>Estado: <span className="badge bg-info">{tournament.estado}</span></h5>
                        
                        {/* Botones solo para el organizador */}
                        {user && tournament.organizador && user.id === tournament.organizador._id && tournament.estado === 'Borrador' && (
                            <button className="btn btn-success mt-3 me-2" onClick={handlePublish}>
                                Publicar Torneo (Abrir Inscripciones)
                            </button>
                        )}

                        {user && tournament.organizador && user.id === tournament.organizador._id && tournament.estado === 'Abierto' && (
                            <button className="btn btn-warning mt-3" onClick={handleStart}>
                                Iniciar Torneo y Generar Brackets
                            </button>
                        )}
                    </div>
                    
                    <div className="col-md-4">
                        <h5>Participantes ({tournament.participantes.length})</h5>
                        <ul className="list-group">
                            {tournament.participantes.map(p => (
                                <li key={p._id} className="list-group-item">{p.username}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                {tournament.estado === 'En curso' && (
                    <div className="mt-5">
                        <div className="d-flex justify-content-between align-items-center">
                            <h3>Cuadro de Enfrentamientos</h3>
                            {user && tournament.organizador && user.id === tournament.organizador._id && (
                                <button className="btn btn-outline-warning" onClick={handleAdvance}>
                                    🚀 Avanzar de Ronda / Finalizar
                                </button>
                            )}
                        </div>
                        <div className="row mt-3">
                            {matches.map(m => (
                                <div key={m._id} className="col-md-6 col-lg-4 mb-3">
                                    <div className={`card text-center shadow-sm ${m.ganador ? 'border-success' : 'border-primary'}`}>
                                        <div className="card-header bg-dark text-white">Ronda {m.ronda}</div>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-around align-items-center">
                                                <span className="fw-bold">{m.jugador1?.username || 'POR DEFINIR'}</span>
                                                <span className="badge bg-secondary">VS</span>
                                                <span className="fw-bold">{m.jugador2?.username || 'BYE (Pasa solo)'}</span>
                                            </div>
                                            <hr />
                                            <p className="mb-0">Resultado: <span className="text-info">{m.resultado}</span></p>
                                            {m.ganador && <p className="text-success small">Ganador: {m.ganador.username}</p>}
                                            {user && tournament.organizador && user.id === tournament.organizador._id && (
                                                <button className="btn btn-outline-secondary btn-sm mt-2" onClick={() => handleReportResult(m._id)}>
                                                    Reportar Resultado
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {tournament.estado === 'Finalizado' && tournament.ganador && (
                    <div className="alert alert-success mt-5 text-center">
                        <h2>🏆 ¡El torneo ha finalizado! 🏆</h2>
                        <p className="display-6">Ganador: <strong>{tournament.ganador.username}</strong></p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentDetails;