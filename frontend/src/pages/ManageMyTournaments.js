import React, { useEffect, useState } from 'react';
import tournamentService from '../services/tournamentService';
import { useNavigate } from 'react-router-dom';
import './TournamentsPage.css'; // Reutilizamos estilos base

const ManageMyTournaments = () => {
    const [myTournaments, setMyTournaments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyTournaments = async () => {
            try {
                const data = await tournamentService.getMyTournaments();
                setMyTournaments(data);
            } catch (err) {
                console.error("Error cargando tus torneos", err);
            }
        };
        fetchMyTournaments();
    }, []);

    return (
        <div className="tournaments-page-wrapper mt-navbar">
            <div className="container py-5">
                <div className="mb-5 d-flex justify-content-between align-items-center">
                    <h1 className="fw-bolder text-uppercase m-0">MIS TORNEOS</h1>
                    <button className="btn btn-view-more" onClick={() => navigate('/tournaments')}>
                        Volver a Torneos
                    </button>
                </div>

                <div className="row">
                    {myTournaments.length > 0 ? myTournaments.map(t => (
                        <div key={t._id} className="col-lg-3 col-md-6 mb-4">
                            <div className="tournament-card-page">
                                <div className="card-image-wrapper">
                                    <img src={t.juego?.logo} alt="Game Logo" className="game-logo-card" />
                                    <div className="card-overlay-info">
                                        <span className={`badge ${t.estado === 'Borrador' ? 'bg-warning' : 'bg-accent'}`}>
                                            {t.estado}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-content-page p-3">
                                    <h5 className="fw-bold mb-3 text-truncate">{t.nombre}</h5>
                                    <div className="d-grid gap-2">
                                        <button 
                                            className="btn btn-accent btn-sm" 
                                            onClick={() => navigate(`/tournament/${t._id}`)}
                                        >
                                            Ver / Gestionar
                                        </button>
                                        <button 
                                            className="btn btn-outline-light btn-sm"
                                            // Aquí iría la lógica de edición en el futuro
                                            onClick={() => alert('Función de edición en desarrollo')}
                                        >
                                            Editar Datos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-12 text-center py-5">
                            <p className="text-dim">No has creado ningún torneo todavía.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageMyTournaments;