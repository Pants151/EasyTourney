import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import './TournamentForm.css';

const Account = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', email: '', rol: '', pais: '', fechaNacimiento: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();
                setFormData({
                    username: data.username,
                    email: data.email,
                    rol: data.rol,
                    pais: data.pais || '',
                    fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : ''
                });
            } catch (err) { console.error(err); }
        };
        fetchProfile();
    }, []);

    const onUpdate = async (e) => {
        e.preventDefault();
        try {
            await authService.updateProfile(formData);
            alert('Perfil actualizado');
        } catch (err) { alert('Error al actualizar'); }
    };

    const onDelete = async () => {
        if (window.confirm("¿ESTÁS SEGURO? Esta acción eliminará permanentemente tu cuenta y progreso.")) {
            try {
                await authService.deleteAccount();
                logout();
            } catch (err) { alert('Error al eliminar cuenta'); }
        }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-uppercase fw-bolder m-0 text-white">Mi <span className="text-accent">Cuenta</span></h2>
                            <button className="btn btn-view-all btn-sm" onClick={() => navigate(-1)}>VOLVER ATRÁS</button>
                        </div>

                        <form onSubmit={onUpdate}>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nombre de Usuario</label>
                                    <input type="text" className="form-control form-control-custom" value={formData.username} 
                                        onChange={e => setFormData({...formData, username: e.target.value})} required />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Rol de Usuario (No editable)</label>
                                    <input type="text" className="form-control form-control-custom opacity-50" value={formData.rol} readOnly />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Correo Electrónico</label>
                                <input type="email" className="form-control form-control-custom" value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} required />
                            </div>
                            
                            <div className="d-flex gap-3 mt-4">
                                <button type="submit" className="btn-accent flex-grow-1">GUARDAR CAMBIOS</button>
                                <button type="button" className="btn btn-delete-custom px-4" onClick={onDelete}>ELIMINAR CUENTA</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;