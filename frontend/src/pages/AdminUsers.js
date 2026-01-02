import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import './TournamentForm.css'; // Reutilizamos estilos de contenedores

const AdminUsers = () => {
    const [users, setUsers] = useState([]);

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

    return (
        <div className="container py-5 mt-navbar">
            <div className="form-container-custom p-4 p-md-5">
                <h2 className="text-uppercase fw-bolder mb-5 text-white text-center">Gestión de <span className="text-accent">Usuarios</span></h2>
                <div className="table-responsive">
                    <table className="table table-dark table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th className="text-end">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`badge ${u.rol === 'admin' ? 'bg-danger' : 'bg-primary'}`}>{u.rol.toUpperCase()}</span></td>
                                    <td className="text-end">
                                        <button className="btn btn-delete-custom btn-sm" onClick={() => handleDelete(u._id, u.username)}>ELIMINAR</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;