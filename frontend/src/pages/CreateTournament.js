import React, { useState, useEffect } from 'react';
import tournamentService from '../services/tournamentService';
import gameService from '../services/gameService';
import { useNavigate } from 'react-router-dom';
import './TournamentForm.css';

const CreateTournament = () => {
    const [games, setGames] = useState([]);
    const [formData, setFormData] = useState({
        nombre: '', juego: '', modalidad: '1v1', fechaInicio: '', reglas: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            const data = await gameService.getGames();
            setGames(data);
        };
        fetchGames();
    }, []);

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await tournamentService.createTournament(formData);
            alert('¡Torneo creado!');
            navigate('/manage-my-tournaments');
        } catch (err) { alert('Error al crear'); }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <h2 className="text-uppercase fw-bolder mb-4">Crear <span className="text-accent">Torneo</span></h2>
                        <form onSubmit={onSubmit}>
                            <div className="mb-4">
                                <label className="form-label-custom">Nombre del Evento</label>
                                <input type="text" name="nombre" className="form-control-custom form-control" 
                                    placeholder="Ej: Copa de Invierno 2024" onChange={e => setFormData({...formData, nombre: e.target.value})} required />
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
                                    <label className="form-label-custom">Modalidad</label>
                                    <select name="modalidad" className="form-select form-select-custom" onChange={e => setFormData({...formData, modalidad: e.target.value})}>
                                        <option value="1v1">1v1 (Individual)</option>
                                        <option value="Equipos">Equipos</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Fecha de Inicio</label>
                                    <input type="datetime-local" name="fechaInicio" className="form-control-custom form-control" 
                                        onChange={e => setFormData({...formData, fechaInicio: e.target.value})} required />
                                </div>
                            </div>
                            <div className="mb-5">
                                <label className="form-label-custom">Reglamento y Detalles</label>
                                <textarea name="reglas" className="form-control-custom form-control" rows="5" 
                                    placeholder="Describe las reglas..." onChange={e => setFormData({...formData, reglas: e.target.value})}></textarea>
                            </div>
                            <button type="submit" className="btn-accent w-100">PUBLICAR TORNEO</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTournament;