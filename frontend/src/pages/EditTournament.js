import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import gameService from '../services/gameService';
import './TournamentForm.css';

const EditTournament = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [formData, setFormData] = useState({ nombre: '', juego: '', modalidad: '1v1', fechaInicio: '', reglas: '' });

    useEffect(() => {
        const fetchData = async () => {
            const [tData, gData] = await Promise.all([tournamentService.getTournamentById(id), gameService.getGames()]);
            const formattedDate = new Date(tData.fechaInicio).toISOString().slice(0, 16);
            setFormData({
                nombre: tData.nombre,
                juego: tData.juego?._id || tData.juego,
                modalidad: tData.modalidad,
                fechaInicio: formattedDate,
                reglas: tData.reglas || ''
            });
            setGames(gData);
        };
        fetchData();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm("¿Estás seguro de que deseas ELIMINAR este torneo? Esta acción es irreversible.")) {
            try {
                await tournamentService.deleteTournament(id);
                alert("Torneo eliminado satisfactoriamente.");
                navigate('/manage-my-tournaments');
            } catch (err) { alert("Error al eliminar."); }
        }
    };

    const onUpdate = async (e) => {
        e.preventDefault();
        try {
            await tournamentService.updateTournament(id, formData);
            alert("Torneo actualizado.");
            navigate('/manage-my-tournaments');
        } catch (err) { alert("Error al actualizar."); }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-uppercase fw-bolder m-0">Editar <span className="text-accent">Torneo</span></h2>
                            <button type="button" className="btn btn-delete-custom px-4" onClick={handleDelete}>
                                <i className="bi bi-trash me-2"></i>ELIMINAR
                            </button>
                        </div>
                        <form onSubmit={onUpdate}>
                            {/* ... (Mismos campos que CreateTournament pero con value={formData.xxx}) ... */}
                            <div className="mb-4">
                                <label className="form-label-custom">Nombre del Torneo</label>
                                <input type="text" className="form-control-custom form-control" value={formData.nombre} 
                                    onChange={e => setFormData({...formData, nombre: e.target.value})} required />
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Juego</label>
                                <select className="form-select form-select-custom" value={formData.juego} 
                                    onChange={e => setFormData({...formData, juego: e.target.value})} required>
                                    {games.map(g => <option key={g._id} value={g._id}>{g.nombre}</option>)}
                                </select>
                            </div>
                            <div className="mb-5">
                                <label className="form-label-custom">Fecha de Inicio</label>
                                <input type="datetime-local" className="form-control-custom form-control" value={formData.fechaInicio} 
                                    onChange={e => setFormData({...formData, fechaInicio: e.target.value})} required />
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