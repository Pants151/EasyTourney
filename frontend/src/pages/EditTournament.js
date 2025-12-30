import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import gameService from '../services/gameService';
import './TournamentForm.css';

const EditTournament = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [tournamentStatus, setTournamentStatus] = useState('');
    const [formData, setFormData] = useState({
        nombre: '', juego: '', formato: '1v1', limiteParticipantes: 16,
        tamanoEquipoMax: 1, alMejorDe: 1, ubicacion: 'Online', 
        fechaInicio: '', reglas: '', plataformas: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tData, gData] = await Promise.all([
                    tournamentService.getTournamentById(id),
                    gameService.getGames()
                ]);
                const formattedDate = new Date(tData.fechaInicio).toISOString().slice(0, 16);
                setTournamentStatus(tData.estado);
                setFormData({
                    nombre: tData.nombre,
                    juego: tData.juego?._id || tData.juego,
                    formato: tData.formato,
                    limiteParticipantes: tData.limiteParticipantes,
                    tamanoEquipoMax: tData.tamanoEquipoMax || 1,
                    alMejorDe: tData.alMejorDe || 1,
                    ubicacion: tData.ubicacion,
                    fechaInicio: formattedDate,
                    reglas: tData.reglas || '',
                    plataformas: tData.plataformas || []
                });
                setGames(gData);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, [id]);

    const isLocked = tournamentStatus !== 'Borrador';

    const onUpdate = async (e) => {
        e.preventDefault();
        try {
            await tournamentService.updateTournament(id, formData);
            alert("Torneo actualizado correctamente.");
            navigate('/manage-my-tournaments');
        } catch (err) { alert(err.response?.data?.msg || "Error al actualizar."); }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <h2 className="text-uppercase fw-bolder mb-4">Editar <span className="text-accent">Torneo</span></h2>
                        {isLocked && <div className="alert alert-info py-2 small">Los ajustes competitivos están bloqueados porque el torneo ya ha sido publicado.</div>}
                        
                        <form onSubmit={onUpdate}>
                            <div className="mb-4">
                                <label className="form-label-custom">Nombre del Torneo</label>
                                <input type="text" className="form-control-custom form-control" value={formData.nombre} 
                                    onChange={e => setFormData({...formData, nombre: e.target.value})} required />
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Juego</label>
                                    <select className="form-select form-select-custom" value={formData.juego} 
                                        disabled={isLocked} onChange={e => setFormData({...formData, juego: e.target.value})} required>
                                        {games.map(g => <option key={g._id} value={g._id}>{g.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Formato</label>
                                    <select className="form-select form-select-custom" value={formData.formato} 
                                        disabled={isLocked} onChange={e => setFormData({...formData, formato: e.target.value})}>
                                        <option value="1v1">1 vs 1</option>
                                        <option value="Equipos">Por Equipos</option>
                                        <option value="Battle Royale">Battle Royale</option>
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">{formData.formato === 'Equipos' ? 'Límite de Equipos' : 'Límite de Participantes'}</label>
                                    <select className="form-select form-select-custom" value={formData.limiteParticipantes} 
                                        disabled={isLocked} onChange={e => setFormData({...formData, limiteParticipantes: e.target.value})}>
                                        {[2, 4, 8, 16, 32, 64].map(num => <option key={num} value={num}>{num}</option>)}
                                    </select>
                                </div>
                                {formData.formato === 'Equipos' && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Jugadores por Equipo</label>
                                        <input type="number" className="form-control-custom form-control" value={formData.tamanoEquipoMax} 
                                            disabled={isLocked} onChange={e => setFormData({...formData, tamanoEquipoMax: e.target.value})} min="2" max="10" />
                                    </div>
                                )}
                                {formData.formato === 'Battle Royale' && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Al mejor de (Victorias)</label>
                                        <input type="number" className="form-control-custom form-control" value={formData.alMejorDe} 
                                            disabled={isLocked} onChange={e => setFormData({...formData, alMejorDe: e.target.value})} min="1" />
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="form-label-custom">Reglas</label>
                                <textarea className="form-control-custom form-control" rows="4" value={formData.reglas} 
                                    onChange={e => setFormData({...formData, reglas: e.target.value})}></textarea>
                            </div>

                            <div className="d-flex gap-3">
                                <button type="submit" className="btn-accent flex-grow-1">GUARDAR CAMBIOS</button>
                                <button type="button" className="btn btn-view-all" onClick={() => navigate(-1)}>CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTournament;