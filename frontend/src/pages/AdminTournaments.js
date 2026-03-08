import React, { useEffect, useState, useRef } from 'react';
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

    // --- NUEVOS ESTADOS ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingItem, setViewingItem] = useState(null);
    const [modalPage, setModalPage] = useState(1);
    const MODAL_ITEMS_PER_PAGE = 5;
    const modalBodyRef = useRef(null);

    const fetchTournaments = async () => {
        try {
            const data = await tournamentService.getTournaments();
            setTournaments(data);
        } catch (err) { console.error("Error obteniendo torneos", err); }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (viewingItem) setModalPage(1);
    }, [viewingItem]);

    useEffect(() => {
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTo(0, 0);
        }
    }, [modalPage]);

    const handleDelete = async (id, name) => {
        if (window.confirm(`¿Seguro que quieres borrar el torneo "${name}" y todos sus datos de forma permanente? Esta acción no se puede deshacer.`)) {
            try {
                await tournamentService.deleteTournament(id);
                fetchTournaments();
                setSelectedIds(selectedIds.filter(i => i !== id));
            } catch (err) { alert(err.response?.data?.msg || "Error al borrar el torneo"); }
        }
    };

    // --- LÓGICA DE SELECCIÓN ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredTournaments.map(t => t._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} torneos seleccionados?`)) {
            try {
                await tournamentService.deleteTournamentsBulk(selectedIds);
                setSelectedIds([]);
                fetchTournaments();
                alert('Torneos eliminados');
            } catch (err) { alert('Error al eliminar en bloque'); }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm('¡ATENCIÓN! Vas a borrar TODOS los torneos de la plataforma. ¿Estás absolutamente seguro?')) {
            if (window.confirm('Esta es la última advertencia. Se borrarán todos los registros asociados. ¿Proceder?')) {
                try {
                    const allIds = tournaments.map(t => t._id);
                    await tournamentService.deleteTournamentsBulk(allIds);
                    fetchTournaments();
                    alert('Todos los torneos han sido eliminados.');
                } catch (err) { alert('Error al borrar todo'); }
            }
        }
    };

    // --- LÓGICA DE EXPORTACIÓN ---
    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTournaments, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "torneos_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const exportToXML = () => {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<torneos>\n';
        filteredTournaments.forEach(t => {
            xmlContent += `  <torneo>\n    <id>${t._id}</id>\n    <nombre>${t.nombre}</nombre>\n    <juego>${t.juego?.nombre || 'N/A'}</juego>\n    <estado>${t.estado}</estado>\n  </torneo>\n`;
        });
        xmlContent += '</torneos>';

        const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "torneos_export.xml");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Funcionalidad de filtrado
    const filteredTournaments = tournaments.filter(t => {
        const matchName = t.nombre.toLowerCase().includes(filterName.toLowerCase());
        const matchGame = t.juego?.nombre?.toLowerCase().includes(filterGame.toLowerCase()) ?? true;
        const matchFormat = filterFormat === '' ? true : t.formato === filterFormat;
        const matchStatus = filterStatus === '' ? true : t.estado === filterStatus;

        let matchDate = true;
        if (filterDate) {
            const tDate = new Date(t.fechaInicio).toISOString().split('T')[0];
            matchDate = tDate === filterDate;
        }

        return matchName && matchGame && matchFormat && matchStatus && matchDate;
    });

    // --- CÁLCULOS DE PAGINACIÓN ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTournaments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedIds([]);
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="form-container-custom p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-uppercase fw-bolder m-0 text-white">Gestión Global de <span className="text-accent">Torneos</span></h2>
                    <button className="btn btn-outline-light" onClick={() => navigate(-1)}>
                        <i className="icon-custom icon-chevron-left me-2"></i> Volver
                    </button>
                </div>

                {/* --- SECCIÓN DE FILTROS --- */}
                <div className="row g-3 mb-4 bg-dark p-3 rounded border border-secondary shadow-sm">
                    <div className="col-lg-3 col-md-6">
                        <label className="text-white-50 small fw-bold mb-1">Nombre</label>
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar torneo..." value={filterName}
                            onChange={e => { setFilterName(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="col-lg-3 col-md-6">
                        <label className="text-white-50 small fw-bold mb-1">Juego</label>
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar juego..." value={filterGame}
                            onChange={e => { setFilterGame(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Formato</label>
                        <select className="form-select form-select-sm form-select-custom"
                            value={filterFormat} onChange={e => { setFilterFormat(e.target.value); setCurrentPage(1); }}>
                            <option value="">Todos</option>
                            <option value="1v1">1 vs 1</option>
                            <option value="Equipos">Equipos</option>
                            <option value="Battle Royale">Battle Royale</option>
                        </select>
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Fecha</label>
                        <input type="date" className="form-control form-control-sm form-control-custom"
                            value={filterDate} onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="col-lg-2 col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Estado</label>
                        <select className="form-select form-select-sm form-select-custom"
                            value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                            <option value="">Todos</option>
                            <option value="Borrador">Borrador</option>
                            <option value="Abierto">Abierto</option>
                            <option value="En curso">En curso</option>
                            <option value="Finalizado">Finalizado</option>
                        </select>
                    </div>
                </div>

                {/* HERRAMIENTAS DE TABLA */}
                <div className="d-flex justify-content-end align-items-center mb-4 gap-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button className="btn btn-info btn-sm fw-bold shadow-sm" onClick={() => setViewingItem(filteredTournaments.filter(t => selectedIds.includes(t._id)))}>
                                <i className="icon-custom icon-eye me-1"></i> VISUALIZAR ({selectedIds.length})
                            </button>
                            <button className="btn btn-danger btn-sm fw-bold shadow-sm" onClick={handleDeleteSelected}>
                                <i className="icon-custom icon-trash me-1"></i> BORRAR SELECCIONADOS
                            </button>
                        </>
                    )}
                    <button className="btn btn-outline-danger btn-sm fw-bold shadow-sm" onClick={handleDeleteAll}>
                        <i className="icon-custom icon-alert me-1"></i> BORRAR TODO
                    </button>
                </div>

                <div className="table-responsive info-card-custom p-0 shadow">
                    <table className="table table-dark table-hover mb-0 align-middle table-tournaments-admin">
                        <thead>
                            <tr className="text-accent text-uppercase small fw-bold border-bottom border-secondary">
                                <th className="ps-4 py-3" style={{ width: '40px' }}>
                                    <input type="checkbox" className="form-check-input"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === filteredTournaments.length && filteredTournaments.length > 0} />
                                </th>
                                <th>Nombre</th>
                                <th>Juego</th>
                                <th>Formato</th>
                                <th>Fecha Inicio</th>
                                <th>Organizador</th>
                                <th>Estado</th>
                                <th className="text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5 text-white-50">No se encontraron torneos</td>
                                </tr>
                            ) : (
                                currentItems.map(t => (
                                    <tr key={t._id} className="border-bottom border-secondary">
                                        <td className="ps-4">
                                            <input type="checkbox" className="form-check-input"
                                                checked={selectedIds.includes(t._id)}
                                                onChange={() => handleSelectOne(t._id)} />
                                        </td>
                                        <td className="fw-bold fs-6">{t.nombre}</td>
                                        <td className="text-white-50">{t.juego?.nombre || 'Juego desconocido'}</td>
                                        <td><span className="badge bg-dark border border-secondary">{t.formato}</span></td>
                                        <td className="small text-white-50">{new Date(t.fechaInicio).toLocaleDateString()}</td>
                                        <td className="small">{t.organizador?.username || 'Desconocido'}</td>
                                        <td>
                                            <span className={`badge ${t.estado === 'Finalizado' ? 'bg-success' :
                                                t.estado === 'En curso' ? 'bg-danger' :
                                                    t.estado === 'Abierto' ? 'bg-primary' : 'bg-secondary'
                                                }`}>
                                                {t.estado.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="table-actions-wrapper">
                                                <button className="btn btn-outline-info btn-sm fw-bold" onClick={() => setViewingItem([t])} title="Visualizar">
                                                    <i className="icon-custom icon-eye"></i>
                                                </button>
                                                <button className="btn btn-outline-warning btn-sm fw-bold" onClick={() => navigate(`/edit-tournament/${t._id}`)} title="Editar">
                                                    <i className="icon-custom icon-pencil"></i>
                                                </button>
                                                <button className="btn btn-delete-custom btn-sm fw-bold" onClick={() => handleDelete(t._id, t.nombre)} title="Borrar">
                                                    <i className="icon-custom icon-x"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                {totalPages > 1 && (
                    <nav className="mt-4 d-flex justify-content-center">
                        <ul className="pagination pagination-custom shadow-sm">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                    <i className="icon-custom icon-chevron-left small"></i>
                                </button>
                            </li>
                            {[...Array(totalPages).keys()].map(num => (
                                <li key={num + 1} className={`page-item ${currentPage === num + 1 ? 'active' : ''}`}>
                                    <button className="page-link px-3" onClick={() => paginate(num + 1)}>{num + 1}</button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                    <i className="icon-custom icon-chevron-right small"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}

                {/* EXPORTACIÓN */}
                <div className="mt-4 d-flex gap-2 justify-content-end">
                    <button className="btn btn-sm btn-dark border-secondary text-white-50" onClick={exportToJSON}>
                        <i className="icon-custom icon-file me-1"></i> JSON
                    </button>
                    <button className="btn btn-sm btn-dark border-secondary text-white-50" onClick={exportToXML}>
                        <i className="icon-custom icon-file me-1"></i> XML
                    </button>
                </div>
            </div>

            {/* MODAL DE VISUALIZACIÓN */}
            {viewingItem && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', paddingTop: '50px', paddingBottom: '50px', zIndex: 9999, overflowY: 'auto' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content border-secondary shadow-lg overflow-hidden" style={{ backgroundColor: '#121212', color: 'white', borderRadius: '15px' }}>
                            <div className="modal-header border-secondary p-4">
                                <h5 className="modal-title fw-bold text-accent text-uppercase letter-spacing-1">
                                    <i className="icon-custom icon-eye me-2"></i> Detalles del Torneo
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingItem(null)}></button>
                            </div>
                            <div className="modal-body p-4" ref={modalBodyRef}>
                                {Array.isArray(viewingItem) && viewingItem
                                    .slice((modalPage - 1) * MODAL_ITEMS_PER_PAGE, modalPage * MODAL_ITEMS_PER_PAGE)
                                    .map((item, idx) => (
                                        <div key={item._id} className={`mb-5 ${idx !== viewingItem.length - 1 ? 'border-bottom border-secondary pb-5' : ''}`}>
                                            <div className="row g-4">
                                                <div className="col-md-5">
                                                    <div className="position-relative">
                                                        <img src={item.juego?.caratula} alt="game cover" className="img-fluid rounded shadow-lg border border-secondary" style={{ maxHeight: '250px', width: '100%', objectFit: 'cover' }} />
                                                        <div className="position-absolute top-0 start-0 m-2">
                                                            <span className="badge bg-accent shadow-sm">{item.estado.toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-7">
                                                    <h3 className="text-white fw-bolder mb-3">{item.nombre}</h3>
                                                    <div className="info-box-custom p-3 bg-dark rounded border border-secondary mb-3">
                                                        <div className="row small">
                                                            <div className="col-6 mb-2">
                                                                <span className="text-accent fw-bold text-uppercase d-block mb-1">Juego</span>
                                                                <span className="text-white">{item.juego?.nombre || 'N/A'}</span>
                                                            </div>
                                                            <div className="col-6 mb-2">
                                                                <span className="text-accent fw-bold text-uppercase d-block mb-1">Formato</span>
                                                                <span className="text-white">{item.formato}</span>
                                                            </div>
                                                            <div className="col-6 mb-2">
                                                                <span className="text-accent fw-bold text-uppercase d-block mb-1">Organizador</span>
                                                                <span className="text-white">{item.organizador?.username || 'Desconocido'}</span>
                                                            </div>
                                                            <div className="col-6 mb-2">
                                                                <span className="text-accent fw-bold text-uppercase d-block mb-1">
                                                                    {item.formato?.toLowerCase().includes('equipos') ? 'Equipos' : 'Participantes'}
                                                                </span>
                                                                <span className="text-white">
                                                                    {item.formato?.toLowerCase().includes('equipos')
                                                                        ? (item.equipos?.length || 0)
                                                                        : (item.participantes?.length || 0)} / {item.limiteParticipantes}
                                                                </span>
                                                            </div>
                                                            <div className="col-12">
                                                                <span className="text-accent fw-bold text-uppercase d-block mb-1">ID Sistema</span>
                                                                <span className="font-monospace text-white-50">{item._id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 border border-secondary rounded bg-black">
                                                        <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">Fecha de inicio</span>
                                                        <span className="text-info fw-bold">{new Date(item.fechaInicio).toLocaleString()}</span>
                                                    </div>
                                                    <div className="d-grid mt-2">
                                                        <button
                                                            className="btn btn-accent btn-sm fw-bold border-0 shadow-sm"
                                                            onClick={() => {
                                                                setViewingItem(null);
                                                                navigate(`/tournament/${item._id}`);
                                                            }}
                                                        >
                                                            <i className="icon-custom icon-eye me-2"></i> IR AL TORNEO
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            <div className="modal-footer border-secondary p-3 d-flex justify-content-between align-items-center">
                                <div className="d-flex gap-2">
                                    {Array.isArray(viewingItem) && viewingItem.length > MODAL_ITEMS_PER_PAGE && (
                                        <>
                                            <button
                                                className="btn btn-outline-secondary btn-sm fw-bold px-3"
                                                onClick={() => setModalPage(prev => Math.max(1, prev - 1))}
                                                disabled={modalPage === 1}
                                            >
                                                ANTERIOR
                                            </button>
                                            <span className="text-white-50 small align-self-center mx-2">
                                                Página {modalPage} de {Math.ceil(viewingItem.length / MODAL_ITEMS_PER_PAGE)}
                                            </span>
                                            <button
                                                className="btn btn-outline-secondary btn-sm fw-bold px-3"
                                                onClick={() => setModalPage(prev => Math.min(Math.ceil(viewingItem.length / MODAL_ITEMS_PER_PAGE), prev + 1))}
                                                disabled={modalPage >= Math.ceil(viewingItem.length / MODAL_ITEMS_PER_PAGE)}
                                            >
                                                SIGUIENTE
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button type="button" className="btn btn-accent px-4 fw-bold" onClick={() => setViewingItem(null)}>CERRAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTournaments;
