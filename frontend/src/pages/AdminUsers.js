import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import './TournamentForm.css'; // Reutilizamos estilos de contenedores

const AdminUsers = () => {
    const [users, setUsers] = useState([]);

    // Estados para Filtros
    const [filterUsername, setFilterUsername] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterRol, setFilterRol] = useState('');
    const navigate = useNavigate();

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
        navigate(`/admin/edit-user/${user._id}`);
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
                            <option value="administrador">Administrador</option>
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
                                    (
                                        <tr key={u._id}>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`badge ${u.rol === 'administrador' ? 'bg-danger' : 'bg-primary'}`}>{u.rol.toUpperCase()}</span></td>
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