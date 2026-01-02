import React, { useState, useEffect } from 'react';
import tournamentService from '../services/tournamentService';
import gameService from '../services/gameService';
import { useNavigate } from 'react-router-dom';
import './TournamentForm.css';

const CreateTournament = () => {
    const [games, setGames] = useState([]);
    const [formData, setFormData] = useState({
        nombre: '', 
        juego: '', 
        formato: '1v1', 
        tamanoEquipoMax: 2, 
        limiteParticipantes: 16,
        fechaInicio: '', 
        reglas: '',
        alMejorDe: 1
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            const data = await gameService.getGames();
            setGames(data);
        };
        fetchGames();
    }, []);

    const validate = () => {
        let tempErrors = {};
        if (!formData.nombre.trim()) tempErrors.nombre = "El nombre es obligatorio";
        if (!formData.fechaInicio) tempErrors.fechaInicio = "La fecha es obligatoria";
        else if (new Date(formData.fechaInicio) < new Date()) {
            tempErrors.fechaInicio = "La fecha no puede ser anterior a la actual";
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const onSubmit = async e => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;

        try {
            await tournamentService.createTournament(formData);
            navigate('/manage-my-tournaments');
        } catch (err) {
            setServerError(err.response?.data?.msg || 'Error al crear el torneo');
        }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <h2 className="text-uppercase fw-bolder mb-4">Crear <span className="text-accent">Torneo</span></h2>
                        {serverError && <div className="form-alert form-alert-danger">{serverError}</div>}
                        <form onSubmit={onSubmit}>
                            {/* ... (campos del formulario se mantienen igual) */}
                            <div className="mb-4">
                                <label className="form-label-custom">Nombre del Evento</label>
                                <input type="text" name="nombre" className={`form-control-custom form-control ${errors.nombre ? 'is-invalid' : ''}`} 
                                    placeholder="Ej: Copa de Invierno 2024" onChange={e => setFormData({...formData, nombre: e.target.value})} required />
                                {errors.nombre && <span className="error-feedback">{errors.nombre}</span>}
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Juego Oficial</label>
                                <select name="juego" className="form-select form-select-custom" onChange={e => setFormData({...formData, juego: e.target.value})} required>
                                    <option value="">Selecciona un juego...</option>
                                    {games.map(g => <option key={g._id} value={g._id}>{g.nombre}</option>)}
                                </select>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Formato de Juego</label>
                                    <select name="formato" className="form-select form-select-custom" 
                                        value={formData.formato}
                                        onChange={e => setFormData({...formData, formato: e.target.value})}>
                                        <option value="1v1">1v1 (Individual)</option>
                                        <option value="Equipos">Por Equipos</option>
                                        <option value="Battle Royale">Battle Royale</option>
                                    </select>
                                </div>
                                
                                {formData.formato === 'Equipos' && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Integrantes por Equipo (1-6)</label>
                                        <input type="number" className="form-control form-control-custom" 
                                            min="1" max="6" value={formData.tamanoEquipoMax}
                                            onChange={e => setFormData({...formData, tamanoEquipoMax: e.target.value})} />
                                    </div>
                                )}

                                {formData.formato === 'Battle Royale' && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Al mejor de (Victorias para ganar)</label>
                                        <input type="number" className="form-control form-control-custom" 
                                            min="1" value={formData.alMejorDe}
                                            onChange={e => setFormData({...formData, alMejorDe: e.target.value})} />
                                    </div>
                                )}

                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">
                                        {formData.formato === 'Equipos' ? 'Límite de Equipos' : 'Límite de Participantes'}
                                    </label>
                                    <select 
                                        name="limiteParticipantes" 
                                        className="form-select form-select-custom" 
                                        value={formData.limiteParticipantes}
                                        onChange={e => setFormData({...formData, limiteParticipantes: e.target.value})}
                                    >
                                        {[2, 4, 8, 16, 32, 64].map(num => (
                                            <option key={num} value={num}>
                                                {num} {formData.formato === 'Equipos' ? 'Equipos' : 'Participantes'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Fecha de Inicio</label>
                                    <input type="datetime-local" name="fechaInicio" className={`form-control-custom form-control ${errors.fechaInicio ? 'is-invalid' : ''}`} 
                                        onChange={e => setFormData({...formData, fechaInicio: e.target.value})} required />
                                    {errors.fechaInicio && <span className="error-feedback">{errors.fechaInicio}</span>}
                                </div>
                            </div>
                            <div className="mb-5">
                                <label className="form-label-custom">Reglamento y Detalles</label>
                                <textarea name="reglas" className="form-control-custom form-control" rows="5" 
                                    placeholder="Describe las reglas..." onChange={e => setFormData({...formData, reglas: e.target.value})}></textarea>
                            </div>

                            {/* ACCIONES DEL FORMULARIO: BOTÓN CANCELAR Y PUBLICAR */}
                            <div className="d-flex gap-3 mt-4">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-light flex-grow-1 fw-bold text-uppercase" 
                                    onClick={() => navigate(-1)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-accent flex-grow-1">
                                    PUBLICAR TORNEO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTournament;