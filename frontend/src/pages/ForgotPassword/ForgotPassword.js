import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import '../TournamentForm.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await authService.forgotPassword(email);
            setMessage(res.msg || 'Correo de recuperación enviado exitosamente');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al solicitar la recuperación de contraseña.');
        }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="text-center mb-4">
                            <h2 className="text-uppercase fw-bolder text-white">Recuperar <span className="text-accent">Contraseña</span></h2>
                            <p className="text-white-50 small mt-2">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                        </div>

                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={onSubmit}>
                            <div className="mb-4">
                                <label className="form-label-custom">Correo Electrónico</label>
                                <input type="email" name="email" className="form-control form-control-custom"
                                    placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength="50" />
                            </div>

                            <button type="submit" className="btn-accent w-100 mb-4">ENVIAR ENLACE</button>

                            <div className="text-center">
                                <p className="text-white small mb-0">
                                    <Link to="/login" className="text-accent fw-bold text-decoration-none">Volver a iniciar sesión</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
