import React from 'react';
import '../TournamentsPage/TournamentsPage.css';

const AdminTeamsView = ({
    loading,
    isOnline,
    adminSearchTerm,
    setAdminSearchTerm,
    currentPage,
    setCurrentPage,
    currentItems,
    totalPages,
    selectedIds,
    handleSelectAll,
    handleSelectOne,
    handleDeleteSelected,
    handleDeleteAll,
    handleDelete,
    viewingItem,
    setViewingItem,
    modalPage,
    setModalPage,
    MODAL_ITEMS_PER_PAGE,
    modalBodyRef,
    exportToJSON,
    filteredTeams,
    paginate
}) => {
    if (loading) return <div className="text-center py-5 text-white">Verificando...</div>;

    return (
        <div className="tournaments-page-wrapper mt-navbar">
            <div className="container py-5">
                <h1 className="fw-bolder text-uppercase mb-5 text-white text-center">
                    GESTIÓN DE <span className="text-accent">EQUIPOS</span>
                </h1>

                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div className="search-box-wrapper m-0" style={{ maxWidth: '400px', flex: '1' }}>
                        <input
                            type="text"
                            className="search-input-custom"
                            placeholder="Buscar por equipo o capitán..."
                            value={adminSearchTerm}
                            onChange={e => {
                                setAdminSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <i className="icon-custom icon-search search-icon-page"></i>
                    </div>

                    <div className="d-flex gap-2">
                        {selectedIds.length > 0 && (
                            <>
                                <button
                                    className="btn btn-info btn-sm fw-bold shadow-sm"
                                    onClick={() => setViewingItem(filteredTeams.filter(t => selectedIds.includes(t._id)))}
                                >
                                    <i className="icon-custom icon-eye me-1"></i> VISUALIZAR ({selectedIds.length})
                                </button>
                                <button
                                    className="btn btn-danger btn-sm fw-bold shadow-sm"
                                    onClick={handleDeleteSelected}
                                    disabled={!isOnline}
                                >
                                    <i className="icon-custom icon-trash me-1"></i> BORRAR SELECCIONADOS
                                </button>
                            </>
                        )}
                        <button
                            className="btn btn-outline-danger btn-sm fw-bold shadow-sm"
                            onClick={handleDeleteAll}
                            disabled={!isOnline}
                        >
                            <i className="icon-custom icon-alert me-1"></i> BORRAR TODO
                        </button>
                    </div>
                </div>

                <div className="info-card-custom p-0 shadow">
                    <div className="table-responsive">
                        <table className="table table-dark table-hover mb-0 align-middle">
                            <thead>
                                <tr className="text-accent text-uppercase small fw-bold">
                                    <th className="ps-4 py-3" style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            onChange={handleSelectAll}
                                            checked={selectedIds.length > 0 && selectedIds.length === filteredTeams.filter(t => t.torneo?.estado !== 'En curso').length}
                                        />
                                    </th>
                                    <th>Nombre Equipo</th>
                                    <th>Capitán</th>
                                    <th>Torneo</th>
                                    <th>Miembros</th>
                                    <th className="text-end pe-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map(t => (
                                    <tr key={t._id} className={`border-bottom border-secondary ${t.torneo?.estado === 'En curso' ? 'opacity-75' : ''}`}>
                                        <td className="ps-4">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedIds.includes(t._id)}
                                                onChange={() => handleSelectOne(t._id)}
                                                disabled={t.torneo?.estado === 'En curso'}
                                                title={t.torneo?.estado === 'En curso' ? 'No se puede seleccionar (Torneo en curso)' : ''}
                                            />
                                        </td>
                                        <td className="fw-bold fs-5 text-white">
                                            {t.nombre}
                                            {t.torneo?.estado === 'En curso' && <span className="badge bg-warning text-dark ms-2 small">En curso</span>}
                                        </td>
                                        <td>{t.capitan?.username || 'Desconocido'}</td>
                                        <td>{t.torneo?.nombre || 'Eliminado'}</td>
                                        <td>{t.miembros?.length || 0} / 5</td>
                                        <td className="text-end pe-4">
                                            <div className="table-actions-wrapper">
                                                <button
                                                    className="btn btn-sm btn-outline-info fw-bold"
                                                    onClick={() => setViewingItem([t])}
                                                    title="Visualizar"
                                                >
                                                    <i className="icon-custom icon-eye"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger fw-bold"
                                                    onClick={() => handleDelete(t._id)}
                                                    title={t.torneo?.estado === 'En curso' ? "Torneo en curso: No se puede borrar" : "Borrar"}
                                                    disabled={t.torneo?.estado === 'En curso'}
                                                >
                                                    <i className="icon-custom icon-x"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-secondary">
                                            No se encontraron equipos
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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
                                    <button className="page-link px-3" onClick={() => paginate(num + 1)}>
                                        {num + 1}
                                    </button>
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

                <div className="mt-4 d-flex gap-2 justify-content-end">
                    <button className="btn btn-sm btn-dark border-secondary text-white-50" onClick={exportToJSON}>
                        <i className="icon-custom icon-file me-1"></i> JSON
                    </button>
                </div>
            </div>

            {/* Modal de visualización */}
            {viewingItem && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.85)', paddingTop: '50px', zIndex: 9999 }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content border-secondary shadow-lg" style={{ backgroundColor: '#121212', color: 'white', borderRadius: '15px' }}>
                            <div className="modal-header border-secondary p-4">
                                <h5 className="modal-title fw-bold text-accent text-uppercase"><i className="icon-custom icon-eye me-2"></i> Detalles del Equipo</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingItem(null)}></button>
                            </div>
                            <div className="modal-body p-4" ref={modalBodyRef}>
                                {Array.isArray(viewingItem) && viewingItem.slice((modalPage - 1) * MODAL_ITEMS_PER_PAGE, modalPage * MODAL_ITEMS_PER_PAGE).map(item => (
                                    <div key={item._id} className="mb-4 pb-4 border-bottom border-secondary">
                                        <h4 className="text-accent fw-bold">{item.nombre}</h4>
                                        <p><strong>ID:</strong> {item._id}</p>
                                        <p><strong>Capitán:</strong> {item.capitan?.username} ({item.capitan?.email})</p>
                                        <p><strong>Torneo:</strong> {item.torneo?.nombre} ({item.torneo?.formato})</p>
                                        <p><strong>Estado del Torneo:</strong> {item.torneo?.estado || 'Desconocido'}</p>
                                        <p><strong>Miembros ({item.miembros?.length}):</strong></p>
                                        <ul>
                                            {item.miembros?.map(m => (
                                                <li key={m._id}>{m.usuario?.username} - Estado: {m.estado}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer border-secondary p-3">
                                <button type="button" className="btn btn-accent px-4 fw-bold" onClick={() => setViewingItem(null)}>ENTENDIDO</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTeamsView;
