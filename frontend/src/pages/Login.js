import React, { useState, useContext } from 'react';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const data = await authService.login(formData);
            login(data.token); // Usamos la función del contexto
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-md-5">
                <div className="card p-4 shadow">
                    <h2 className="text-center mb-4">Iniciar Sesión</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={onSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input type="email" name="email" className="form-control" onChange={onChange} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Contraseña</label>
                            <input type="password" name="password" className="form-control" onChange={onChange} required />
                        </div>
                        <button type="submit" className="btn btn-success w-100">Entrar</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;