import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import PasswordInput from '../components/PasswordInput';
import './TournamentForm.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            return setError('Las contraseñas no coinciden.');
        }

        if (password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres.');
        }

        try {
            const res = await authService.resetPassword(token, password);
            setMessage(res.msg || 'La contraseña se ha restablecido correctamente.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
        }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="text-center mb-4">
                            <h2 className="text-uppercase fw-bolder text-white">Nueva <span className="text-accent">Contraseña</span></h2>
                            <p className="text-white-50 small mt-2">Ingresa tu nueva contraseña para tu cuenta.</p>
                        </div>

                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={onSubmit}>
                            <div className="mb-4">
                                <label className="form-label-custom">Nueva Contraseña</label>
                                <PasswordInput name="password" className="form-control form-control-custom"
                                    placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" maxLength="100" />
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Confirmar Contraseña</label>
                                <PasswordInput name="confirmPassword" className="form-control form-control-custom"
                                    placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="6" maxLength="100" />
                            </div>

                            <button type="submit" className="btn-accent w-100 mb-4">GUARDAR CONTRASEÑA</button>

                            <div className="text-center">
                                <p className="text-white small mb-0">
                                    <Link to="/login" className="text-accent fw-bold text-decoration-none">Ir a iniciar sesión</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
