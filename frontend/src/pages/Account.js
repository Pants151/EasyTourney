import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import './TournamentForm.css';

const Account = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', email: '', rol: ''
    });
    // Estado separado para el cambio de contraseña
    const [passwords, setPasswords] = useState({ passwordActual: '', passwordNuevo: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();
                setFormData({ username: data.username, email: data.email, rol: data.rol });
            } catch (err) { console.error(err); }
        };
        fetchProfile();
    }, []);

    const onUpdateProfile = async (e) => {
        e.preventDefault();
        
        // VALIDACIONES LOCALES
        if (formData.username.trim().length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Por favor, introduce un correo electrónico válido.');
            return;
        }

        try {
            await authService.updateProfile(formData);
            alert('Perfil actualizado con éxito');
        } catch (err) { 
            const errorMsg = err.response?.data?.msg || 'Error al actualizar perfil';
            alert(errorMsg); 
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();

        // VALIDACIÓN LOCAL
        if (passwords.passwordNuevo.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            await authService.changePassword(passwords);
            alert('Contraseña cambiada con éxito');
            setPasswords({ passwordActual: '', passwordNuevo: '' });
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al cambiar contraseña');
        }
    };

    const onDelete = async () => {
        if (window.confirm("¿ESTÁS SEGURO? Esta acción es irreversible.")) {
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

                        {/* --- SECCIÓN DATOS PERSONALES --- */}
                        <form onSubmit={onUpdateProfile} className="mb-5 pb-5 border-bottom border-secondary">
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Datos Personales</h5>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nombre de Usuario</label>
                                    <input type="text" className="form-control form-control-custom" value={formData.username} 
                                        onChange={e => setFormData({...formData, username: e.target.value})} required />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Rol de Usuario</label>
                                    <input type="text" className="form-control form-control-custom opacity-50" value={formData.rol} readOnly />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Correo Electrónico</label>
                                <input type="email" className="form-control form-control-custom" value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} required />
                            </div>
                            <button type="submit" className="btn-accent px-5">GUARDAR DATOS</button>
                        </form>

                        {/* --- SECCIÓN SEGURIDAD (CONTRASEÑA) --- */}
                        <form onSubmit={onChangePassword} className="mb-5">
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Seguridad</h5>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Contraseña Actual</label>
                                    <input type="password" name="passwordActual" className="form-control form-control-custom" 
                                        value={passwords.passwordActual} onChange={e => setPasswords({...passwords, passwordActual: e.target.value})} required />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nueva Contraseña</label>
                                    <input type="password" name="passwordNuevo" className="form-control form-control-custom" 
                                        value={passwords.passwordNuevo} onChange={e => setPasswords({...passwords, passwordNuevo: e.target.value})} required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-outline-warning fw-bold px-5">ACTUALIZAR CONTRASEÑA</button>
                        </form>

                        <div className="text-end border-top border-secondary pt-4">
                            <button type="button" className="btn btn-delete-custom px-4" onClick={onDelete}>ELIMINAR MI CUENTA</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;