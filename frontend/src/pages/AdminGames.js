import React, { useState, useEffect } from 'react';
import gameService from '../services/gameService';

const AdminGames = () => {
    const PLATAFORMAS_DISPONIBLES = ["PC", "PS5", "PS4", "Xbox Series X", "Xbox Series S", "Xbox One", "Nintendo Switch", "Mobile"];

    const [games, setGames] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [formData, setFormData] = useState({
        nombre: '',
        plataformas: [],
        caratula: '',
        logo: '',
        header: ''
    });

    useEffect(() => { loadGames(); }, []);

    const loadGames = async () => {
        const data = await gameService.getGames();
        setGames(data);
    };

    // Función para añadir plataforma desde el combobox
    const addPlatform = () => {
        if (selectedPlatform && !formData.plataformas.includes(selectedPlatform)) {
            setFormData({
                ...formData,
                plataformas: [...formData.plataformas, selectedPlatform]
            });
            setSelectedPlatform("");
        }
    };

    // Función para quitar plataforma
    const removePlatform = (plat) => {
        setFormData({
            ...formData,
            plataformas: formData.plataformas.filter(p => p !== plat)
        });
    };

    const handleEdit = (game) => {
        setEditingId(game._id);
        setFormData({
            nombre: game.nombre,
            plataformas: game.plataformas,
            caratula: game.caratula,
            logo: game.logo,
            header: game.header
        });
    };

    const onSubmit = async e => {
        e.preventDefault();
        if (formData.plataformas.length === 0) return alert("Añade al menos una plataforma");
        try {
            if (editingId) {
                await gameService.updateGame(editingId, formData);
            } else {
                await gameService.createGame(formData);
            }
            resetForm();
            loadGames();
        } catch (err) { alert('Error en la operación'); }
    };

    const resetForm = () => {
        setFormData({ nombre: '', plataformas: [], caratula: '', logo: '', header: '' });
        setEditingId(null);
    };

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-5">
                    <div className="card p-4 shadow">
                        <h3>{editingId ? 'Editar Juego' : 'Nuevo Juego'}</h3>
                        <form onSubmit={onSubmit}>
                            <input type="text" name="nombre" placeholder="Nombre del juego" className="form-control mb-3"
                                value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />

                            {/* COMBOBOX DE PLATAFORMAS */}
                            <div className="input-group mb-2">
                                <select className="form-select" value={selectedPlatform}
                                    onChange={e => setSelectedPlatform(e.target.value)}>
                                    <option value="">Selecciona plataforma...</option>
                                    {PLATAFORMAS_DISPONIBLES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <button type="button" className="btn btn-outline-secondary" onClick={addPlatform}>Añadir</button>
                            </div>

                            {/* LISTA DE PLATAFORMAS SELECCIONADAS */}
                            <div className="mb-3">
                                {formData.plataformas.map(p => (
                                    <span key={p} className="badge bg-primary me-2 p-2">
                                        {p} <button type="button" className="btn-close btn-close-white ms-2"
                                            style={{ fontSize: '0.6rem' }} onClick={() => removePlatform(p)}></button>
                                    </span>
                                ))}
                            </div>

                            <input type="text" placeholder="URL Carátula" className="form-control mb-3"
                                value={formData.caratula} onChange={e => setFormData({ ...formData, caratula: e.target.value })} required />

                            <input type="text" placeholder="URL Logo" className="form-control mb-3"
                                value={formData.logo} onChange={e => setFormData({ ...formData, logo: e.target.value })} required />

                            <input type="text" placeholder="URL Header/Banner" className="form-control mb-3"
                                value={formData.header} onChange={e => setFormData({ ...formData, header: e.target.value })} required />

                            <button className="btn btn-dark w-100">{editingId ? 'Actualizar' : 'Guardar Juego'}</button>
                            {editingId && <button className="btn btn-link w-100" onClick={resetForm}>Cancelar</button>}
                        </form>
                    </div>
                </div>

                <div className="col-md-7">
                    <h4>Juegos Oficiales</h4>
                    <div className="list-group">
                        {games.map(g => (
                            <div key={g._id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <img src={g.logo} alt="logo" style={{ width: '40px', marginRight: '15px' }} />
                                    <div>
                                        <h6 className="mb-0">{g.nombre}</h6>
                                        <small className="text-muted">{g.plataformas.join(', ')}</small>
                                    </div>
                                </div>
                                <div>
                                    <button className="btn btn-sm btn-info me-2" onClick={() => handleEdit(g)}>Editar</button>
                                    <button className="btn btn-sm btn-danger" onClick={async () => {
                                        if (window.confirm("¿Borrar juego?")) { await gameService.deleteGame(g._id); loadGames(); }
                                    }}>Borrar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGames;