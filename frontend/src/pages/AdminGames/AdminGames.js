import React, { useEffect, useState, useContext, useRef } from 'react';
import gameService from '../../services/gameService';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import '../TournamentForm.css';
import '../TournamentsPage/TournamentsPage.css';

const AdminGames = () => {
    const { user, loading } = useContext(AuthContext);
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [adminSearchTerm, setAdminSearchTerm] = useState(""); // Estado para el buscador

    const availablePlatforms = ['PC', 'PS5', 'PS4', 'PS3', 'PS2', 'PS1', 'Xbox Series X/S', 'Xbox One', 'Xbox 360', 'Xbox', 'Nintendo Switch', 'Nintendo Switch 2', 'Nintendo 3DS', 'Nintendo DS', 'Wii', 'Wii U', 'Gamecube', 'Mobile'];

    const [formData, setFormData] = useState({
        nombre: '',
        plataformas: [],
        caratula: '',
        logo: '',
        header: ''
    });

    // --- NUEVOS ESTADOS PARA PAGINACIÓN Y SELECCIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingItem, setViewingItem] = useState(null); // Para el modal de visualizar
    const [modalPage, setModalPage] = useState(1);
    const MODAL_ITEMS_PER_PAGE = 5;
    const modalBodyRef = useRef(null);

    useEffect(() => {
        if (!loading && user?.rol !== 'administrador') {
            navigate('/');
        }
        fetchGames();
    }, [user, loading, navigate]);

    useEffect(() => {
        if (viewingItem) setModalPage(1);
    }, [viewingItem]);

    useEffect(() => {
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTo(0, 0);
        }
    }, [modalPage]);

    const fetchGames = async () => {
        try {
            const data = await gameService.getGames();
            setGames(data);
        } catch (err) { console.error(err); }
    };

    // --- LÓGICA DE SELECCIÓN ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredGames.map(g => g._id));
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

    // --- LÓGICA DE BORRADO MASIVO ---
    const handleDeleteSelected = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} juegos seleccionados?`)) {
            try {
                await gameService.deleteGamesBulk(selectedIds);
                setSelectedIds([]);
                fetchGames();
                alert('Juegos eliminados');
            } catch (err) { alert('Error al eliminar en bloque'); }
        }
    };

    const handleDeleteAll = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (window.confirm('¡ATENCIÓN! Vas a borrar TODOS los juegos de la base de datos. ¿Estás absolutamente seguro?')) {
            if (window.confirm('Esta es la última advertencia. Se borrarán todos los registros de juegos. ¿Proceder?')) {
                try {
                    const allIds = games.map(g => g._id);
                    await gameService.deleteGamesBulk(allIds);
                    fetchGames();
                    alert('Todos los juegos han sido eliminados.');
                } catch (err) { alert('Error al borrar todo'); }
            }
        }
    };

    // --- LÓGICA DE EXPORTACIÓN ---
    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredGames, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "juegos_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const exportToXML = () => {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<juegos>\n';
        filteredGames.forEach(g => {
            xmlContent += `  <juego>\n    <id>${g._id}</id>\n    <nombre>${g.nombre}</nombre>\n    <plataformas>${g.plataformas.join(', ')}</plataformas>\n  </juego>\n`;
        });
        xmlContent += '</juegos>';

        const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "juegos_export.xml");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
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

    const filteredGames = games.filter(g =>
        g.nombre.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );

    // --- CÁLCULOS DE PAGINACIÓN ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredGames.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGames.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedIds([]);
    };

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
                                                style={{ fontSize: '0.6rem' }} onClick={() => removePlatform(p)}></button>
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
                            <button type="submit" className={`btn-accent flex-grow-1 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!isOnline}>
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

                {/* HERRAMIENTAS DE TABLA */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div className="search-box-wrapper m-0" style={{ maxWidth: '400px', flex: '1' }}>
                        <input
                            type="text"
                            className="search-input-custom"
                            placeholder="Filtrar por nombre..."
                            value={adminSearchTerm}
                            onChange={(e) => { setAdminSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                        <i className="icon-custom icon-search search-icon-page"></i>
                    </div>

                    <div className="d-flex gap-2">
                        {selectedIds.length > 0 && (
                            <>
                                <button className="btn btn-info btn-sm fw-bold shadow-sm" onClick={() => setViewingItem(filteredGames.filter(g => selectedIds.includes(g._id)))}>
                                    <i className="icon-custom icon-eye me-1"></i> VISUALIZAR ({selectedIds.length})
                                </button>
                                <button className="btn btn-danger btn-sm fw-bold shadow-sm" onClick={handleDeleteSelected} disabled={!isOnline}>
                                    <i className="icon-custom icon-trash me-1"></i> BORRAR SELECCIONADOS
                                </button>
                            </>
                        )}
                        <button className="btn btn-outline-danger btn-sm fw-bold shadow-sm" onClick={handleDeleteAll} disabled={!isOnline}>
                            <i className="icon-custom icon-alert me-1"></i> BORRAR TODO
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="info-card-custom p-0 shadow">
                    <div className="table-responsive">
                        <table className="table table-dark table-hover mb-0 align-middle">
                            <thead>
                                <tr className="text-accent text-uppercase small fw-bold">
                                    <th className="ps-4 py-3" style={{ width: '40px' }}>
                                        <input type="checkbox" className="form-check-input"
                                            onChange={handleSelectAll}
                                            checked={selectedIds.length === filteredGames.length && filteredGames.length > 0} />
                                    </th>
                                    <th>Miniatura</th>
                                    <th>Nombre</th>
                                    <th>Plataformas</th>
                                    <th className="text-end pe-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map(g => (
                                    <tr key={g._id} className="border-bottom border-secondary">
                                        <td className="ps-4">
                                            <input type="checkbox" className="form-check-input"
                                                checked={selectedIds.includes(g._id)}
                                                onChange={() => handleSelectOne(g._id)} />
                                        </td>
                                        <td className="py-3">
                                            <img src={g.caratula} alt="cover" className="rounded shadow-sm" style={{ height: '60px', width: '45px', objectFit: 'cover' }} />
                                        </td>
                                        <td className="fw-bold fs-5 text-white">{g.nombre}</td>
                                        <td>
                                            {g.plataformas.map(p => (
                                                <span key={p} className="badge bg-dark border border-secondary me-1">{p}</span>
                                            ))}
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="table-actions-wrapper">
                                                <button className="btn btn-sm btn-outline-info fw-bold" onClick={() => setViewingItem([g])} title="Visualizar">
                                                    <i className="icon-custom icon-eye"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-warning fw-bold" onClick={() => handleEdit(g)} title="Editar">
                                                    <i className="icon-custom icon-pencil"></i>
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger fw-bold" onClick={() => handleDelete(g._id)} title="Borrar">
                                                    <i className="icon-custom icon-x"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-secondary">
                                            {adminSearchTerm ? 'No se encontraron juegos con ese nombre' : 'No hay juegos registrados'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
                                    <i className="icon-custom icon-eye me-2"></i> Detalles del Registro
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingItem(null)}></button>
                            </div>
                            <div className="modal-body p-4" ref={modalBodyRef}>
                                {Array.isArray(viewingItem) ? (
                                    viewingItem
                                        .slice((modalPage - 1) * MODAL_ITEMS_PER_PAGE, modalPage * MODAL_ITEMS_PER_PAGE)
                                        .map((item, idx) => (
                                            <div key={item._id} className={`mb-5 ${idx !== viewingItem.length - 1 ? 'border-bottom border-secondary pb-5' : ''}`}>
                                                <div className="row g-4">
                                                    <div className="col-md-4">
                                                        <div className="position-relative">
                                                            <img src={item.caratula} alt="cover" className="img-fluid rounded shadow-lg border border-secondary" />
                                                            <div className="position-absolute top-0 end-0 m-2">
                                                                <span className="badge bg-accent shadow-sm">{idx + 1}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-8">
                                                        <h3 className="text-white fw-bolder mb-3">{item.nombre}</h3>
                                                        <div className="info-box-custom p-3 bg-dark rounded border border-secondary mb-3">
                                                            <p className="mb-2"><span className="text-accent fw-bold small text-uppercase me-2">ID Sistema:</span> <span className="font-monospace small text-white-50">{item._id}</span></p>
                                                            <p className="mb-0"><span className="text-accent fw-bold small text-uppercase me-2">Plataformas:</span> <span className="text-white">{item.plataformas.join(', ')}</span></p>
                                                        </div>
                                                        <div className="mt-4">
                                                            <label className="text-white-50 small mb-2 text-uppercase fw-bold">Recursos Gráficos</label>
                                                            <div className="p-3 bg-black rounded shadow-inner border border-secondary">
                                                                <div className="mb-3">
                                                                    <span className="d-block text-accent x-small fw-bold mb-1">LOGO URL</span>
                                                                    <code className="text-info x-small d-block text-break">{item.logo}</code>
                                                                </div>
                                                                <div>
                                                                    <span className="d-block text-accent x-small fw-bold mb-1">BANNER URL</span>
                                                                    <code className="text-info x-small d-block text-break">{item.header}</code>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {item.header && (
                                                            <div className="mt-4 rounded overflow-hidden border border-secondary shadow-sm" style={{ height: '100px' }}>
                                                                <img src={item.header} alt="banner" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : null}
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
                                <button type="button" className="btn btn-accent px-4 fw-bold" onClick={() => setViewingItem(null)}>ENTENDIDO</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminGames;
