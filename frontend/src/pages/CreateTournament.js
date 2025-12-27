import React, { useState, useEffect } from 'react';
import tournamentService from '../services/tournamentService';
import gameService from '../services/gameService'; // Importamos el nuevo servicio
import { useNavigate } from 'react-router-dom';

const CreateTournament = () => {
    const [games, setGames] = useState([]); // Para almacenar los juegos de la DB
    const [formData, setFormData] = useState({
        nombre: '',
        juego: '', // Aquí guardaremos el ID del juego seleccionado
        modalidad: '1v1',
        fechaInicio: '',
        reglas: ''
    });
    const navigate = useNavigate();

    // Cargar los juegos al montar el componente
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await gameService.getGames();
                setGames(data);
            } catch (err) {
                console.error("Error cargando juegos", err);
            }
        };
        fetchGames();
    }, []);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if(!formData.juego) return alert("Por favor, selecciona un juego");
        try {
            await tournamentService.createTournament(formData);
            alert('¡Torneo creado con éxito!');
            navigate('/');
        } catch (err) {
            alert('Error al crear el torneo.');
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
                
                {/* SELECTOR DE JUEGOS OFICIALES */}
                <div className="mb-3">
                    <label className="form-label">Juego Oficial</label>
                    <select name="juego" className="form-select" onChange={onChange} required>
                        <option value="">-- Selecciona un juego --</option>
                        {games.map(g => (
                            <option key={g._id} value={g._id}>{g.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Resto de campos... */}
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