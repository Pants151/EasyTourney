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
                        <h3>Cuadro de Enfrentamientos (Ronda 1)</h3>
                        <div className="row mt-3">
                            {matches.map(m => (
                                <div key={m._id} className="col-md-6 col-lg-4 mb-3">
                                    <div className="card text-center border-primary shadow-sm">
                                        <div className="card-header bg-primary text-white">Partida</div>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-around align-items-center">
                                                <span className="fw-bold">{m.jugador1?.username || 'POR DEFINIR'}</span>
                                                <span className="badge bg-secondary">VS</span>
                                                <span className="fw-bold">{m.jugador2?.username || 'BYE (Pasa solo)'}</span>
                                            </div>
                                            <hr />
                                            <p className="mb-0">Resultado: <span className="text-info">{m.resultado}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentDetails;