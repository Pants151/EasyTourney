import React, { useState } from 'react';
import tournamentService from '../services/tournamentService';
import { useNavigate } from 'react-router-dom';

const CreateTournament = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        juego: '',
        modalidad: '1v1',
        fechaInicio: '',
        reglas: ''
    });
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await tournamentService.createTournament(formData);
            alert('¡Torneo creado con éxito!');
            navigate('/');
        } catch (err) {
            alert('Error al crear el torneo. Asegúrate de estar logueado como organizador.');
        }
    };

    return (
        <div className="card p-4 shadow-sm">
            <h3>Crear Nuevo Torneo 🏆</h3>
            <form onSubmit={onSubmit}>
                <div className="mb-3">
                    <label className="form-label">Nombre del Torneo</label>
                    <input type="text" name="nombre" className="form-control" onChange={onChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Juego</label>
                    <input type="text" name="juego" className="form-control" onChange={onChange} required />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Modalidad</label>
                        <select name="modalidad" className="form-select" onChange={onChange}>
                            <option value="1v1">1v1</option>
                            <option value="Equipos">Equipos</option>
                        </select>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Fecha de Inicio</label>
                        <input type="datetime-local" name="fechaInicio" className="form-control" onChange={onChange} required />
                    </div>
                </div>
                <div className="mb-3">
                    <label className="form-label">Reglas</label>
                    <textarea name="reglas" className="form-control" rows="3" onChange={onChange}></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Publicar Torneo</button>
            </form>
        </div>
    );
};

export default CreateTournament;