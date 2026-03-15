import React, { useEffect, useState, useRef } from 'react';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import '../TournamentForm.css'; // Reutilizamos estilos de contenedores

const AdminUsers = () => {
    const [users, setUsers] = useState([]);

    // Estados para Filtros
    const [filterUsername, setFilterUsername] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterRol, setFilterRol] = useState('');
    const navigate = useNavigate();

    // --- NUEVOS ESTADOS ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingItem, setViewingItem] = useState(null);
    const [modalPage, setModalPage] = useState(1);
    const MODAL_ITEMS_PER_PAGE = 5;
    const modalBodyRef = useRef(null);

    const fetchUsers = async () => {
        try {
            const data = await authService.getAllUsers();
            setUsers(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchUsers();
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
        if (window.confirm(`¿Seguro que quieres borrar a ${name} y TODOS sus datos (torneos, equipos, etc)?`)) {
            try {
                await authService.deleteUserByAdmin(id);
                fetchUsers();
                setSelectedIds(selectedIds.filter(i => i !== id));
            } catch (err) { alert("Error al borrar"); }
        }
    };

    const handleEditClick = (user) => {
        navigate(`/admin/edit-user/${user._id}`);
    };

    // --- LÓGICA DE SELECCIÓN ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredUsers.map(u => u._id));
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
        if (window.confirm(`¿Estás seguro de que quieres eliminar a los ${selectedIds.length} usuarios seleccionados y todos sus datos?`)) {
            try {
                await authService.deleteUsersBulk(selectedIds);
                setSelectedIds([]);
                fetchUsers();
                alert('Usuarios eliminados');
            } catch (err) { alert('Error al eliminar en bloque'); }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm('¡ATENCIÓN! Vas a borrar TODOS los usuarios de la base de datos. ¿Estás absolutamente seguro?')) {
            if (window.confirm('Esta es la última advertencia. Se borrarán todos los registros asociados. ¿Proceder?')) {
                try {
                    const allIds = users.map(u => u._id);
                    await authService.deleteUsersBulk(allIds);
                    fetchUsers();
                    alert('Todos los usuarios han sido eliminados.');
                } catch (err) { alert('Error al borrar todo'); }
            }
        }
    };

    // --- LÓGICA DE EXPORTACIÓN ---
    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredUsers, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "usuarios_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const exportToXML = () => {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<usuarios>\n';
        filteredUsers.forEach(u => {
            xmlContent += `  <usuario>\n    <id>${u._id}</id>\n    <username>${u.username}</username>\n    <email>${u.email}</email>\n    <rol>${u.rol}</rol>\n  </usuario>\n`;
        });
        xmlContent += '</usuarios>';

        const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "usuarios_export.xml");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Funcionalidad de filtrado
    const filteredUsers = users.filter(u => {
        const matchUsername = u.username.toLowerCase().includes(filterUsername.toLowerCase());
        const matchEmail = u.email.toLowerCase().includes(filterEmail.toLowerCase());
        const matchRol = filterRol === '' ? true : u.rol === filterRol;
        return matchUsername && matchEmail && matchRol;
    });

    // --- CÁLCULOS DE PAGINACIÓN ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedIds([]);
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="form-container-custom p-4 p-md-5">
                <h2 className="text-uppercase fw-bolder mb-4 text-white text-center">Gestión de <span className="text-accent">Usuarios</span></h2>

                {/* --- SECCIÓN DE FILTROS --- */}
                <div className="row g-3 mb-4 bg-dark p-3 rounded border border-secondary shadow-sm">
                    <div className="col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Nombre de Usuario</label>
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar username..." value={filterUsername}
                            onChange={e => { setFilterUsername(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Email</label>
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar email..." value={filterEmail}
                            onChange={e => { setFilterEmail(e.target.value); setCurrentPage(1); }} />
                    </div>
                    <div className="col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Rol</label>
                        <select className="form-select form-select-sm form-select-custom"
                            value={filterRol} onChange={e => { setFilterRol(e.target.value); setCurrentPage(1); }}>
                            <option value="">Cualquier Rol</option>
                            <option value="participante">Participante</option>
                            <option value="organizador">Organizador</option>
                            <option value="administrador">Administrador</option>
                        </select>
                    </div>
                </div>

                {/* HERRAMIENTAS DE TABLA */}
                <div className="d-flex justify-content-end align-items-center mb-4 gap-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button className="btn btn-info btn-sm fw-bold shadow-sm" onClick={() => setViewingItem(filteredUsers.filter(u => selectedIds.includes(u._id)))}>
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
                    <table className="table table-dark table-hover mb-0 align-middle">
                        <thead>
                            <tr className="text-accent text-uppercase small fw-bold border-bottom border-secondary">
                                <th className="ps-4 py-3" style={{ width: '40px' }}>
                                    <input type="checkbox" className="form-check-input"
                                        onChange={handleSelectAll}
                                        checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} />
                                </th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th className="text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-5 text-white-50">No se encontraron usuarios</td>
                                </tr>
                            ) : (
                                currentItems.map(u => (
                                    <tr key={u._id} className="border-bottom border-secondary">
                                        <td className="ps-4">
                                            <input type="checkbox" className="form-check-input"
                                                checked={selectedIds.includes(u._id)}
                                                onChange={() => handleSelectOne(u._id)} />
                                        </td>
                                        <td className="fw-bold fs-6">{u.username}</td>
                                        <td className="text-white-50 small">{u.email}</td>
                                        <td>
                                            <span className={`badge ${u.rol === 'administrador' ? 'bg-danger shadow-sm' :
                                                u.rol === 'organizador' ? 'bg-success shadow-sm' : 'bg-primary shadow-sm'
                                                }`}>
                                                {u.rol.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="table-actions-wrapper">
                                                <button className="btn btn-outline-info btn-sm fw-bold" onClick={() => setViewingItem([u])} title="Visualizar">
                                                    <i className="icon-custom icon-eye"></i>
                                                </button>
                                                <button className="btn btn-outline-warning btn-sm fw-bold" onClick={() => handleEditClick(u)} title="Editar">
                                                    <i className="icon-custom icon-pencil"></i>
                                                </button>
                                                <button className="btn btn-delete-custom btn-sm fw-bold" onClick={() => handleDelete(u._id, u.username)} title="Borrar">
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
                                    <i className="icon-custom icon-person me-2"></i> Perfil de Usuario
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingItem(null)}></button>
                            </div>
                            <div className="modal-body p-4" ref={modalBodyRef}>
                                {Array.isArray(viewingItem) && viewingItem
                                    .slice((modalPage - 1) * MODAL_ITEMS_PER_PAGE, modalPage * MODAL_ITEMS_PER_PAGE)
                                    .map((item, idx) => (
                                        <div key={item._id} className={`mb-5 ${idx !== viewingItem.length - 1 ? 'border-bottom border-secondary pb-5' : ''}`}>
                                            <div className="row g-4 align-items-center">
                                                <div className="col-md-3 text-center">
                                                    <div className="avatar-placeholder-large bg-dark border border-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '120px', height: '120px', fontSize: '3rem' }}>
                                                        <i className="icon-custom icon-person text-accent" style={{ width: '60px', height: '60px' }}></i>
                                                    </div>
                                                    <span className={`badge ${item.rol === 'administrador' ? 'bg-danger' : 'bg-primary'} text-uppercase`}>
                                                        {item.rol}
                                                    </span>
                                                </div>
                                                <div className="col-md-9">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <h3 className="text-white fw-bolder mb-0">{item.username}</h3>
                                                        {item.isBot && <span className="badge bg-secondary x-small">BOT</span>}
                                                    </div>
                                                    <p className="text-accent small mb-4 font-monospace">{item._id}</p>

                                                    <div className="row g-3">
                                                        <div className="col-sm-6">
                                                            <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">Correo Electrónico</span>
                                                                <span className="text-white break-all">{item.email}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">Nombre Completo</span>
                                                                <span className="text-white">{item.nombre || 'No proporcionado'} {item.apellidos || ''}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">País</span>
                                                                <span className="text-white">{item.pais || 'No especificado'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">Fecha de Nacimiento</span>
                                                                <span className="text-white">{item.fechaNacimiento ? new Date(item.fechaNacimiento).toLocaleDateString() : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-sm-6">
                                                            <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">Fecha de Registro</span>
                                                                <span className="text-white">{item.fechaRegistro ? new Date(item.fechaRegistro).toLocaleDateString() : 'N/A'}</span>
                                                            </div>
                                                        </div>
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

export default AdminUsers;
