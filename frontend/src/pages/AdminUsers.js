import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import './TournamentForm.css'; // Reutilizamos estilos de contenedores

const AdminUsers = () => {
    const [users, setUsers] = useState([]);

    // Estados para Filtros
    const [filterUsername, setFilterUsername] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterRol, setFilterRol] = useState('');

    const [editingUser, setEditingUser] = useState(null); // Usuario en modo edición
    const [editFormData, setEditFormData] = useState({ username: '', email: '', rol: '' });
    const [editError, setEditError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await authService.getAllUsers();
                setUsers(data);
            } catch (err) { console.error(err); }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (id, name) => {
        if (window.confirm(`¿Seguro que quieres borrar a ${name} y TODOS sus datos (torneos, equipos, etc)?`)) {
            try {
                await authService.deleteUserByAdmin(id);
                setUsers(users.filter(u => u._id !== id));
            } catch (err) { alert("Error al borrar"); }
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user._id);
        setEditFormData({ username: user.username, email: user.email, rol: user.rol });
        setEditError('');
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditError('');
    };

    const handleSaveEdit = async (e, id) => {
        e.preventDefault();
        setEditError('');

        if (editFormData.username.trim().length < 3) {
            return setEditError('El nombre debe tener al menos 3 caracteres.');
        }

        try {
            const updatedUser = await authService.updateUserByAdmin(id, editFormData);
            // Actualizar la lista local
            setUsers(users.map(u => u._id === id ? { ...u, ...updatedUser } : u));
            setEditingUser(null); // Cerrar modo edición
        } catch (err) {
            setEditError(err.response?.data?.msg || "Error al actualizar usuario");
        }
    };

    // Funcionalidad de filtrado
    const filteredUsers = users.filter(u => {
        const matchUsername = u.username.toLowerCase().includes(filterUsername.toLowerCase());
        const matchEmail = u.email.toLowerCase().includes(filterEmail.toLowerCase());
        const matchRol = filterRol === '' ? true : u.rol === filterRol;
        return matchUsername && matchEmail && matchRol;
    });

    return (
        <div className="container py-5 mt-navbar">
            <div className="form-container-custom p-4 p-md-5">
                <h2 className="text-uppercase fw-bolder mb-4 text-white text-center">Gestión de <span className="text-accent">Usuarios</span></h2>

                {/* --- SECCIÓN DE FILTROS --- */}
                <div className="row g-3 mb-4 bg-dark p-3 rounded border border-secondary">
                    <div className="col-md-4">
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar por Username..." value={filterUsername} onChange={e => setFilterUsername(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                        <input type="text" className="form-control form-control-sm form-control-custom"
                            placeholder="Buscar por Email..." value={filterEmail} onChange={e => setFilterEmail(e.target.value)} />
                    </div>
                    <div className="col-md-4">
                        <select className="form-select form-select-sm form-select-custom"
                            value={filterRol} onChange={e => setFilterRol(e.target.value)}>
                            <option value="">Cualquier Rol</option>
                            <option value="participante">Participante</option>
                            <option value="organizador">Organizador</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                </div>
                {/* --------------------------- */}

                <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th className="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-white-50">No se encontraron usuarios</td>
                                </tr>
                            ) : (
                                filteredUsers.map(u => (
                                    editingUser === u._id ? (
                                        <tr key={u._id} className="table-secondary align-middle">
                                            <td colSpan="4" className="p-0">
                                                <div className="p-3 bg-dark border border-secondary rounded m-2">
                                                    <h6 className="text-white mb-3">Editando a {u.username}</h6>
                                                    {editError && <div className="alert alert-danger py-1 px-2 small">{editError}</div>}
                                                    <form className="row g-2 align-items-end" onSubmit={(e) => handleSaveEdit(e, u._id)}>
                                                        <div className="col-md-3">
                                                            <label className="form-label-custom small mb-1">Username</label>
                                                            <input type="text" className="form-control form-control-sm form-control-custom"
                                                                value={editFormData.username} onChange={e => setEditFormData({ ...editFormData, username: e.target.value })} required minLength="3" maxLength="20" />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label-custom small mb-1">Email</label>
                                                            <input type="email" className="form-control form-control-sm form-control-custom"
                                                                value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} required maxLength="50" />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <label className="form-label-custom small mb-1">Rol</label>
                                                            <select className="form-select form-select-sm form-select-custom"
                                                                value={editFormData.rol} onChange={e => setEditFormData({ ...editFormData, rol: e.target.value })}>
                                                                <option value="participante">Participante</option>
                                                                <option value="organizador">Organizador</option>
                                                                <option value="admin">Administrador</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-3 text-end d-flex justify-content-end gap-2">
                                                            <button type="button" className="btn btn-outline-light btn-sm" onClick={handleCancelEdit}>Cancelar</button>
                                                            <button type="submit" className="btn btn-warning btn-sm fw-bold">Guardar</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={u._id}>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`badge ${u.rol === 'admin' ? 'bg-danger' : 'bg-primary'}`}>{u.rol.toUpperCase()}</span></td>
                                            <td className="text-end">
                                                <button className="btn btn-outline-warning btn-sm me-2 fw-bold" onClick={() => handleEditClick(u)}>Editar</button>
                                                <button className="btn btn-delete-custom btn-sm" onClick={() => handleDelete(u._id, u.username)}>ELIMINAR</button>
                                            </td>
                                        </tr>
                                    )
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;