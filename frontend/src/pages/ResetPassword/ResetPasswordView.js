import React from 'react';
import { Link } from 'react-router-dom';
import PasswordInput from '../../components/common/PasswordInput';
import '../TournamentForm.css';

const ResetPasswordView = ({
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    message,
    error,
    onSubmit
}) => {
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

export default ResetPasswordView;
