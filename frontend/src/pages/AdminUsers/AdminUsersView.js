import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../TournamentForm.css';

const AdminUsersView = ({
    users,
    filterUsername,
    setFilterUsername,
    filterEmail,
    setFilterEmail,
    filterRol,
    setFilterRol,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    selectedIds,
    setSelectedIds,
    viewingItem,
    setViewingItem,
    modalPage,
    setModalPage,
    MODAL_ITEMS_PER_PAGE,
    modalBodyRef,
    handleDelete,
    handleEditClick,
    handleSelectAll,
    handleSelectOne,
    handleDeleteSelected,
    handleDeleteAll,
    exportToJSON,
    exportToXML,
    filteredUsers,
    currentItems,
    totalPages,
    paginate
}) => {
    const navigate = useNavigate();

    return (
        <div className="container py-5 mt-navbar">
            <div className="form-container-custom p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-uppercase fw-bolder mb-0 text-white">
                        Gestión de <span className="text-accent">Usuarios</span>
                    </h2>
                    <button className="btn btn-view-all btn-sm" onClick={() => navigate(-1)}>
                        VOLVER
                    </button>
                </div>

                <div className="row g-3 mb-4 bg-dark p-3 rounded border border-secondary shadow-sm">
                    <div className="col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Nombre de Usuario</label>
                        <input
                            type="text"
                            className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar username..."
                            value={filterUsername}
                            onChange={e => {
                                setFilterUsername(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Email</label>
                        <input
                            type="text"
                            className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar email..."
                            value={filterEmail}
                            onChange={e => {
                                setFilterEmail(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="text-white-50 small fw-bold mb-1">Rol</label>
                        <select
                            className="form-select form-select-sm form-select-custom"
                            value={filterRol}
                            onChange={e => {
                                setFilterRol(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Cualquier Rol</option>
                            <option value="participante">Participante</option>
                            <option value="organizador">Organizador</option>
                            <option value="administrador">Administrador</option>
                        </select>
                    </div>
                </div>

                <div className="d-flex justify-content-end align-items-center mb-4 gap-2">
                    {selectedIds.length > 0 && (
                        <>
                            <button
                                className="btn btn-info btn-sm fw-bold shadow-sm"
                                onClick={() =>
                                    setViewingItem(
                                        filteredUsers.filter(u => selectedIds.includes(u._id))
                                    )
                                }
                            >
                                <i className="icon-custom icon-eye me-1"></i> VISUALIZAR (
                                {selectedIds.length})
                            </button>
                            <button
                                className="btn btn-danger btn-sm fw-bold shadow-sm"
                                onClick={handleDeleteSelected}
                            >
                                <i className="icon-custom icon-trash me-1"></i> BORRAR SELECCIONADOS
                            </button>
                        </>
                    )}
                    <button
                        className="btn btn-outline-danger btn-sm fw-bold shadow-sm"
                        onClick={handleDeleteAll}
                    >
                        <i className="icon-custom icon-alert me-1"></i> BORRAR TODO
                    </button>
                </div>

                <div className="table-responsive info-card-custom p-0 shadow">
                    <table className="table table-dark table-hover mb-0 align-middle">
                        <thead>
                            <tr className="text-accent text-uppercase small fw-bold border-bottom border-secondary">
                                <th className="ps-4 py-3" style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        onChange={handleSelectAll}
                                        checked={
                                            selectedIds.length === filteredUsers.length &&
                                            filteredUsers.length > 0
                                        }
                                    />
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
                                    <td
                                        colSpan="5"
                                        className="text-center py-5 text-white-50"
                                    >
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map(u => (
                                    <tr key={u._id} className="border-bottom border-secondary">
                                        <td className="ps-4">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedIds.includes(u._id)}
                                                onChange={() => handleSelectOne(u._id)}
                                            />
                                        </td>
                                        <td className="fw-bold fs-6">{u.username}</td>
                                        <td className="text-white-50 small">{u.email}</td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    u.rol === 'administrador'
                                                        ? 'bg-danger shadow-sm'
                                                        : u.rol === 'organizador'
                                                        ? 'bg-success shadow-sm'
                                                        : 'bg-primary shadow-sm'
                                                }`}
                                            >
                                                {u.rol.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            <div className="table-actions-wrapper">
                                                <button
                                                    className="btn btn-outline-info btn-sm fw-bold"
                                                    onClick={() => setViewingItem([u])}
                                                    title="Visualizar"
                                                >
                                                    <i className="icon-custom icon-eye"></i>
                                                </button>
                                                <button
                                                    className="btn btn-outline-warning btn-sm fw-bold"
                                                    onClick={() => handleEditClick(u)}
                                                    title="Editar"
                                                >
                                                    <i className="icon-custom icon-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-delete-custom btn-sm fw-bold"
                                                    onClick={() =>
                                                        handleDelete(u._id, u.username)
                                                    }
                                                    title="Borrar"
                                                >
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

                {totalPages > 1 && (
                    <nav className="mt-4 d-flex justify-content-center">
                        <ul className="pagination pagination-custom shadow-sm">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => paginate(currentPage - 1)}
                                >
                                    <i className="icon-custom icon-chevron-left small"></i>
                                </button>
                            </li>
                            {[...Array(totalPages).keys()].map(num => (
                                <li
                                    key={num + 1}
                                    className={`page-item ${
                                        currentPage === num + 1 ? 'active' : ''
                                    }`}
                                >
                                    <button
                                        className="page-link px-3"
                                        onClick={() => paginate(num + 1)}
                                    >
                                        {num + 1}
                                    </button>
                                </li>
                            ))}
                            <li
                                className={`page-item ${
                                    currentPage === totalPages ? 'disabled' : ''
                                }`}
                            >
                                <button
                                    className="page-link"
                                    onClick={() => paginate(currentPage + 1)}
                                >
                                    <i className="icon-custom icon-chevron-right small"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}

                <div className="mt-4 d-flex gap-2 justify-content-end">
                    <button
                        className="btn btn-sm btn-dark border-secondary text-white-50"
                        onClick={exportToJSON}
                    >
                        <i className="icon-custom icon-file me-1"></i> JSON
                    </button>
                    <button
                        className="btn btn-sm btn-dark border-secondary text-white-50"
                        onClick={exportToXML}
                    >
                        <i className="icon-custom icon-file me-1"></i> XML
                    </button>
                </div>
            </div>

            {viewingItem && (
                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(4px)',
                        paddingTop: '50px',
                        paddingBottom: '50px',
                        zIndex: 9999,
                        overflowY: 'auto'
                    }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div
                            className="modal-content border-secondary shadow-lg overflow-hidden"
                            style={{
                                backgroundColor: '#121212',
                                color: 'white',
                                borderRadius: '15px'
                            }}
                        >
                            <div className="modal-header border-secondary p-4">
                                <h5 className="modal-title fw-bold text-accent text-uppercase letter-spacing-1">
                                    <i className="icon-custom icon-person me-2"></i> Perfil de
                                    Usuario
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setViewingItem(null)}
                                ></button>
                            </div>
                            <div className="modal-body p-4" ref={modalBodyRef}>
                                {Array.isArray(viewingItem) &&
                                    viewingItem
                                        .slice(
                                            (modalPage - 1) * MODAL_ITEMS_PER_PAGE,
                                            modalPage * MODAL_ITEMS_PER_PAGE
                                        )
                                        .map((item, idx) => (
                                            <div
                                                key={item._id}
                                                className={`mb-5 ${
                                                    idx !== viewingItem.length - 1
                                                        ? 'border-bottom border-secondary pb-5'
                                                        : ''
                                                }`}
                                            >
                                                <div className="row g-4 align-items-center">
                                                    <div className="col-md-3 text-center">
                                                        <div
                                                            className="avatar-placeholder-large bg-dark border border-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                                            style={{
                                                                width: '120px',
                                                                height: '120px',
                                                                fontSize: '3rem'
                                                            }}
                                                        >
                                                            <i
                                                                className="icon-custom icon-person text-accent"
                                                                style={{
                                                                    width: '60px',
                                                                    height: '60px'
                                                                }}
                                                            ></i>
                                                        </div>
                                                        <span
                                                            className={`badge ${
                                                                item.rol === 'administrador'
                                                                    ? 'bg-danger'
                                                                    : 'bg-primary'
                                                            } text-uppercase`}
                                                        >
                                                            {item.rol}
                                                        </span>
                                                    </div>
                                                    <div className="col-md-9">
                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                            <h3 className="text-white fw-bolder mb-0">
                                                                {item.username}
                                                            </h3>
                                                            {item.isBot && (
                                                                <span className="badge bg-secondary x-small">
                                                                    BOT
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-accent small mb-4 font-monospace">
                                                            {item._id}
                                                        </p>

                                                        <div className="row g-3">
                                                            <div className="col-sm-6">
                                                                <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                    <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">
                                                                        Correo Electrónico
                                                                    </span>
                                                                    <span className="text-white break-all">
                                                                        {item.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-sm-6">
                                                                <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                    <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">
                                                                        Nombre Completo
                                                                    </span>
                                                                    <span className="text-white">
                                                                        {item.nombre || 'No proporcionado'}{' '}
                                                                        {item.apellidos || ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-sm-6">
                                                                <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                    <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">
                                                                        País
                                                                    </span>
                                                                    <span className="text-white">
                                                                        {item.pais || 'No especificado'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-sm-6">
                                                                <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                    <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">
                                                                        Fecha de Nacimiento
                                                                    </span>
                                                                    <span className="text-white">
                                                                        {item.fechaNacimiento
                                                                            ? new Date(
                                                                                  item.fechaNacimiento
                                                                              ).toLocaleDateString()
                                                                            : 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-sm-6">
                                                                <div className="p-3 bg-dark rounded border border-secondary h-100 shadow-sm">
                                                                    <span className="text-white-50 x-small fw-bold text-uppercase d-block mb-1">
                                                                        Fecha de Registro
                                                                    </span>
                                                                    <span className="text-white">
                                                                        {item.fechaRegistro
                                                                            ? new Date(
                                                                                  item.fechaRegistro
                                                                              ).toLocaleDateString()
                                                                            : 'N/A'}
                                                                    </span>
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
                                    {Array.isArray(viewingItem) &&
                                        viewingItem.length > MODAL_ITEMS_PER_PAGE && (
                                            <>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm fw-bold px-3"
                                                    onClick={() =>
                                                        setModalPage(prev =>
                                                            Math.max(1, prev - 1)
                                                        )
                                                    }
                                                    disabled={modalPage === 1}
                                                >
                                                    ANTERIOR
                                                </button>
                                                <span className="text-white-50 small align-self-center mx-2">
                                                    Página {modalPage} de{' '}
                                                    {Math.ceil(
                                                        viewingItem.length /
                                                            MODAL_ITEMS_PER_PAGE
                                                    )}
                                                </span>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm fw-bold px-3"
                                                    onClick={() =>
                                                        setModalPage(prev =>
                                                            Math.min(
                                                                Math.ceil(
                                                                    viewingItem.length /
                                                                        MODAL_ITEMS_PER_PAGE
                                                                ),
                                                                prev + 1
                                                            )
                                                        )
                                                    }
                                                    disabled={
                                                        modalPage >=
                                                        Math.ceil(
                                                            viewingItem.length /
                                                                MODAL_ITEMS_PER_PAGE
                                                        )
                                                    }
                                                >
                                                    SIGUIENTE
                                                </button>
                                            </>
                                        )}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-accent px-4 fw-bold"
                                    onClick={() => setViewingItem(null)}
                                >
                                    CERRAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersView;

