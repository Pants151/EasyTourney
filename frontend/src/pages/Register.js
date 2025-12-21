import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        rol: 'participante'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await authService.register(formData);
            alert('Registro exitoso. Ahora puedes iniciar sesión.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al registrarse');
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card p-4 shadow">
                    <h2 className="text-center mb-4">Registro en EasyTourney</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={onSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Nombre de Usuario</label>
                            <input type="text" name="username" className="form-control" onChange={onChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input type="email" name="email" className="form-control" onChange={onChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Contraseña</label>
                            <input type="password" name="password" className="form-control" onChange={onChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Rol</label>
                            <select name="rol" className="form-select" onChange={onChange}>
                                <option value="participante">Participante</option>
                                <option value="organizador">Organizador</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Registrarse</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;