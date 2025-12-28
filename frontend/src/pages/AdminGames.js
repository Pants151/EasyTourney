import React, { useEffect, useState, useContext } from 'react';
import gameService from '../services/gameService';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './TournamentForm.css';
import './TournamentsPage.css';

const AdminGames = () => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [adminSearchTerm, setAdminSearchTerm] = useState(""); // Estado para el buscador
    
    const availablePlatforms = ['PC', 'PS5', 'Xbox Series X/S', 'PS4', 'Xbox One', 'Nintendo Switch', 'Mobile'];

    const [formData, setFormData] = useState({
        nombre: '',
        plataformas: [],
        caratula: '',
        logo: '',
        header: ''
    });

    useEffect(() => {
        if (!loading && user?.rol !== 'administrador') {
            navigate('/');
        }
        fetchGames();
    }, [user, loading, navigate]);

    const fetchGames = async () => {
        try {
            const data = await gameService.getGames();
            setGames(data);
        } catch (err) { console.error(err); }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handlePlatformSelect = (e) => {
        const value = e.target.value;
        if (value && !formData.plataformas.includes(value)) {
            setFormData({
                ...formData,
                plataformas: [...formData.plataformas, value]
            });
        }
        e.target.value = ""; 
    };

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este juego?')) {
            try {
                await gameService.deleteGame(id);
                fetchGames();
            } catch (err) {
                alert('Error al eliminar');
            }
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (formData.plataformas.length === 0) return alert("Selecciona al menos una plataforma.");

        try {
            if (editingId) {
                await gameService.updateGame(editingId, formData);
                setEditingId(null);
            } else {
                await gameService.createGame(formData);
            }
            setFormData({ nombre: '', plataformas: [], caratula: '', logo: '', header: '' });
            fetchGames();
            alert('¡Operación exitosa!');
        } catch (err) {
            alert('Error en la operación');
        }
    };

    // Filtrado de juegos para el buscador
    const filteredGames = games.filter(g => 
        g.nombre.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );

    if (loading) return <div className="text-center py-5 text-white">Verificando...</div>;

    return (
        <div className="tournaments-page-wrapper mt-navbar">
            <div className="container py-5">
                <h1 className="fw-bolder text-uppercase mb-5 text-white text-center">
                    GESTIÓN DE <span className="text-accent">JUEGOS</span>
                </h1>

                {/* FORMULARIO */}
                <div className="form-container-custom p-4 p-md-5 mb-5 shadow-lg">
                    <h3 className="text-uppercase fw-bold mb-4 text-white">
                        {editingId ? 'Editar Juego' : 'Añadir Nuevo Juego'}
                    </h3>
                    <form onSubmit={onSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-4">
                                <label className="form-label-custom">Nombre del Juego</label>
                                <input type="text" name="nombre" className="form-control form-control-custom" 
                                    value={formData.nombre} onChange={onChange} required />
                            </div>
                            
                            <div className="col-md-6 mb-4">
                                <label className="form-label-custom">Seleccionar Plataformas</label>
                                <select className="form-select form-select-custom mb-2" onChange={handlePlatformSelect}>
                                    <option value="">-- Añadir plataforma --</option>
                                    {availablePlatforms.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <div className="d-flex flex-wrap gap-2">
                                    {formData.plataformas.map(p => (
                                        <span key={p} className="badge bg-accent d-flex align-items-center">
                                            {p}
                                            <button type="button" className="btn-close btn-close-white ms-2" 
                                                style={{fontSize: '0.6rem'}} onClick={() => removePlatform(p)}></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4 mb-4">
                                <label className="form-label-custom">URL Portada</label>
                                <input type="text" name="caratula" className="form-control form-control-custom" 
                                    value={formData.caratula} onChange={onChange} required />
                            </div>
                            <div className="col-md-4 mb-4">
                                <label className="form-label-custom">URL Logo</label>
                                <input type="text" name="logo" className="form-control form-control-custom" 
                                    value={formData.logo} onChange={onChange} required />
                            </div>
                            <div className="col-md-4 mb-4">
                                <label className="form-label-custom">URL Banner</label>
                                <input type="text" name="header" className="form-control form-control-custom" 
                                    value={formData.header} onChange={onChange} required />
                            </div>
                        </div>

                        <div className="d-flex gap-3">
                            <button type="submit" className="btn-accent flex-grow-1">
                                {editingId ? 'ACTUALIZAR DATOS' : 'CREAR JUEGO'}
                            </button>
                            {editingId && (
                                <button type="button" className="btn btn-view-all" 
                                    onClick={() => { setEditingId(null); setFormData({ nombre: '', plataformas: [], caratula: '', logo: '', header: '' }); }}>
                                    CANCELAR
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* BUSCADOR DE LA TABLA */}
                <div className="search-box-wrapper mb-4" style={{maxWidth: '400px'}}>
                    <input 
                        type="text" 
                        className="search-input-custom" 
                        placeholder="Filtrar por nombre..." 
                        value={adminSearchTerm}
                        onChange={(e) => setAdminSearchTerm(e.target.value)}
                    />
                    <i className="bi bi-search search-icon-page"></i>
                </div>

                {/* TABLA */}
                <div className="info-card-custom p-0 overflow-hidden shadow">
                    <div className="table-responsive">
                        <table className="table table-dark table-hover mb-0 align-middle">
                            <thead>
                                <tr className="text-accent text-uppercase small fw-bold">
                                    <th className="ps-4 py-3">Miniatura</th>
                                    <th>Nombre</th>
                                    <th>Plataformas</th>
                                    <th className="text-end pe-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGames.map(g => (
                                    <tr key={g._id} className="border-bottom border-secondary">
                                        <td className="ps-4 py-3">
                                            <img src={g.caratula} alt="cover" className="rounded shadow-sm" style={{height: '60px', width: '45px', objectFit: 'cover'}} />
                                        </td>
                                        <td className="fw-bold">{g.nombre}</td>
                                        <td>
                                            {g.plataformas.map(p => (
                                                <span key={p} className="badge bg-dark border border-secondary me-1">{p}</span>
                                            ))}
                                        </td>
                                        <td className="text-end pe-4">
                                            {/* TEXTO AÑADIDO A LOS BOTONES */}
                                            <button className="btn btn-sm btn-outline-info me-2" onClick={() => handleEdit(g)}>
                                                <i className="bi bi-pencil-square me-1"></i> EDITAR
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(g._id)}>
                                                <i className="bi bi-trash me-1"></i> BORRAR
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGames;