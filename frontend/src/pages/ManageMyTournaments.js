/* frontend/src/pages/ManageMyTournaments.js */
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

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.')) {
            try {
                await tournamentService.deleteTournament(id);
                alert('Torneo eliminado');
                setMyTournaments(myTournaments.filter(t => t._id !== id));
            } catch (err) {
                alert('Error al eliminar');
            }
        }
    };

    return (
        <div className="tournaments-page-wrapper mt-navbar">
            <div className="container py-5">
                {/* 1. CABECERA CON BOTÓN DE CREAR AL LADO DE VOLVER */}
                <div className="mb-5 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h1 className="fw-bolder text-uppercase m-0 text-white">MIS TORNEOS</h1>
                    <div className="d-flex gap-2">
                        <button className="btn btn-view-more" onClick={() => navigate('/tournaments')}>
                            Volver a Torneos
                        </button>
                        <button className="btn btn-accent" onClick={() => navigate('/create-tournament')}>
                            + Crear Torneo
                        </button>
                    </div>
                </div>

                <div className="row">
                    {myTournaments.length > 0 ? myTournaments.map(t => (
                        <div key={t._id} className="col-lg-3 col-md-6 mb-4">
                            <div className="tournament-card-page h-100 bg-dark-secondary shadow-sm">
                                {/* Imagen: Ahora usamos la carátula o logo del juego */}
                                <div className="card-image-wrapper">
                                    <img 
                                        src={t.juego?.caratula || t.juego?.logo} 
                                        alt={t.juego?.nombre} 
                                        className="game-logo-card" 
                                    />
                                </div>

                                <div className="card-content-page p-3">
                                    {/* 2. LOGO Y NOMBRE DEL JUEGO */}
                                    <div className="d-flex align-items-center mb-2">
                                        {t.juego?.logo && (
                                            <img 
                                                src={t.juego.logo} 
                                                alt="Icon" 
                                                style={{ width: '20px', height: '20px', objectFit: 'contain' }} 
                                                className="me-2"
                                            />
                                        )}
                                        <span className="text-accent small fw-bold text-uppercase">
                                            {t.juego?.nombre || 'Sin Juego'}
                                        </span>
                                    </div>

                                    {/* Nombre del Torneo */}
                                    <h5 className="fw-bold mb-1 text-white text-truncate">{t.nombre}</h5>
                                    
                                    {/* 3. ESTADO DEBAJO DEL NOMBRE */}
                                    <div className="mb-4">
                                        <span className={`badge ${t.estado === 'Borrador' ? 'bg-warning' : 'bg-accent'}`} style={{ fontSize: '0.7rem' }}>
                                            {t.estado.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button className="btn btn-accent btn-sm" onClick={() => navigate(`/tournament/${t._id}`)}>
                                            Ver / Gestionar
                                        </button>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-outline-light btn-sm flex-grow-1" onClick={() => navigate(`/edit-tournament/${t._id}`)}>
                                                Editar Datos
                                            </button>
                                            
                                            {/* 4. BOTÓN BORRAR CON UNA X CLARA */}
                                            <button 
                                                className="btn btn-danger btn-sm px-3 fw-bold" 
                                                onClick={() => handleDelete(t._id)}
                                                title="Eliminar Torneo"
                                            >
                                                &times;
                                            </button>
                                        </div>
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