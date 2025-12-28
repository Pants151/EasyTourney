import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';
import './TournamentForm.css';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', rol: 'participante' });
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await authService.register(formData);
            alert('Usuario registrado con éxito');
            navigate('/login');
        } catch (err) {
            alert('Error al registrar usuario.');
        }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-md-7 col-lg-6">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-uppercase fw-bolder m-0 text-white">Crear <span className="text-accent">Cuenta</span></h2>
                            <button className="btn btn-view-all btn-sm" onClick={() => navigate(-1)}>VOLVER</button>
                        </div>

                        <form onSubmit={onSubmit}>
                            <div className="mb-3">
                                <label className="form-label-custom">Nombre de Usuario</label>
                                <input type="text" name="username" className="form-control form-control-custom" onChange={onChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label-custom">Correo Electrónico</label>
                                <input type="email" name="email" className="form-control form-control-custom" onChange={onChange} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label-custom">Contraseña</label>
                                <input type="password" name="password" className="form-control form-control-custom" onChange={onChange} required />
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">¿Qué quieres ser?</label>
                                <select name="rol" className="form-select form-select-custom" onChange={onChange}>
                                    <option value="participante">Participante (Jugador)</option>
                                    <option value="organizador">Organizador de Eventos</option>
                                </select>
                            </div>
                            
                            <button type="submit" className="btn-accent w-100">REGISTRARSE</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;