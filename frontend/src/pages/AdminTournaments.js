import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import './TournamentForm.css'; // Reutilizamos estilos

const AdminTournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const navigate = useNavigate();

    // Estados para Filtros
    const [filterName, setFilterName] = useState('');
    const [filterGame, setFilterGame] = useState('');
    const [filterFormat, setFilterFormat] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                // Obtener TODOS los torneos de la plataforma
                const data = await tournamentService.getTournaments();
                setTournaments(data);
            } catch (err) { console.error("Error obteniendo torneos", err); }
        };
        fetchTournaments();
    }, []);

    const handleDelete = async (id, name) => {
        if (window.confirm(`¿Seguro que quieres borrar el torneo "${name}" y todos sus datos de forma permanente? Esta acción no se puede deshacer.`)) {
            try {
                await tournamentService.deleteTournament(id);
                setTournaments(tournaments.filter(t => t._id !== id));
            } catch (err) { alert(err.response?.data?.msg || "Error al borrar el torneo"); }
        }
    };

    // Funcionalidad de filtrado
    const filteredTournaments = tournaments.filter(t => {
        const matchName = t.nombre.toLowerCase().includes(filterName.toLowerCase());
        const matchGame = t.juego?.nombre?.toLowerCase().includes(filterGame.toLowerCase()) ?? true;
        const matchFormat = filterFormat === '' ? true : t.formato === filterFormat;
        const matchStatus = filterStatus === '' ? true : t.estado === filterStatus;

        // Filtro por fecha (comparando año-mes-día)
        let matchDate = true;
        if (filterDate) {
            const tDate = new Date(t.fechaInicio).toISOString().split('T')[0];
            matchDate = tDate === filterDate;
        }

        return matchName && matchGame && matchFormat && matchStatus && matchDate;
    });

    return (
        <div className="container py-5 mt-navbar">
            <div className="form-container-custom p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-uppercase fw-bolder m-0 text-white">Gestión Global de <span className="text-accent">Torneos</span></h2>
                    <button className="btn btn-outline-light" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left me-2"></i> Volver
                    </button>
                </div>

                {/* --- SECCIÓN DE FILTROS --- */}
                <div className="row g-3 mb-4 bg-dark p-3 rounded border border-secondary">
                    <div className="col-lg-3 col-md-6">
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Nombre del Torneo..." value={filterName} onChange={e => setFilterName(e.target.value)} />
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Nombre del Juego..." value={filterGame} onChange={e => setFilterGame(e.target.value)} />
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <select className="form-select form-select-sm form-select-custom"
                            value={filterFormat} onChange={e => setFilterFormat(e.target.value)}>
                            <option value="">Formato (Todos)</option>
                            <option value="1v1">1 vs 1</option>
                            <option value="Equipos">Equipos</option>
                            <option value="Battle Royale">Battle Royale</option>
                        </select>
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <input type="date" className="form-control form-control-sm form-control-custom"
                            value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <select className="form-select form-select-sm form-select-custom"
                            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">Estado (Todos)</option>
                            <option value="Borrador">Borrador</option>
                            <option value="Abierto">Abierto</option>
                            <option value="En curso">En curso</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>
                </div>
                {/* --------------------------- */}

                <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Juego</th>
                                <th>Formato</th>
                                <th>Fecha Inicio</th>
                                <th>Organizador</th>
                                <th>Estado</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTournaments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-white-50">No se encontraron torneos</td>
                                </tr>
                            ) : (
                                filteredTournaments.map(t => (
                                    <tr key={t._id}>
                                        <td className="fw-bold">{t.nombre}</td>
                                        <td>{t.juego?.nombre || 'Juego desconocido'}</td>
                                        <td>{t.formato}</td>
                                        <td>{new Date(t.fechaInicio).toLocaleDateString()}</td>
                                        <td>{t.organizador?.username || 'Desconocido'}</td>
                                        <td>
                                            <span className={`badge ${t.estado === 'Finalizado' ? 'bg-success' :
                                                t.estado === 'En curso' ? 'bg-danger' :
                                                    t.estado === 'Abierto' ? 'bg-primary' : 'bg-secondary'
                                                }`}>
                                                {t.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            {/* El botón redirige a la VISTA NORMAL de edición, pero como somos ADMIN el backend nos dejará guardar cambios y la UI bloqueará lógicamente los dropdowns */}
                                            <button className="btn btn-outline-warning btn-sm me-2 fw-bold" onClick={() => navigate(`/edit-tournament/${t._id}`)}>Editar</button>
                                            <button className="btn btn-delete-custom btn-sm" onClick={() => handleDelete(t._id, t.nombre)}>ELIMINAR</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminTournaments;
