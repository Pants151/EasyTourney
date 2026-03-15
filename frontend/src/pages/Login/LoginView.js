import React from 'react';
import { Link } from 'react-router-dom';
import PasswordInput from '../../components/common/PasswordInput';
import logoNav from '../../assets/images/logo-nav.png';
import '../TournamentForm.css';

const LoginView = ({
    onChange,
    onSubmit
}) => {
return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="text-center mb-4">
                            <img src={logoNav} alt="Logo" height="50" className="mb-3" />
                            <h2 className="text-uppercase fw-bolder text-white">Iniciar <span className="text-accent">Sesión</span></h2>
                        </div>

                        <form onSubmit={onSubmit}>
                            <div className="mb-4">
                                <label className="form-label-custom">Correo Electrónico</label>
                                <input type="email" name="email" className="form-control form-control-custom"
                                    placeholder="tu@email.com" onChange={onChange} required maxLength="50" />
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Contraseña</label>
                                <PasswordInput name="password" className="form-control form-control-custom"
                                    placeholder="********" onChange={onChange} required maxLength="100" />
                            </div>

                            <button type="submit" className="btn-accent w-100 mb-4">ENTRAR</button>

                            <div className="text-center mb-3">
                                <Link to="/forgot-password" className="text-white small text-decoration-none">¿Olvidaste tu contraseña?</Link>
                            </div>

                            <div className="text-center">
                                <p className="text-white small mb-0">
                                    ¿No tienes cuenta? <Link to="/register" className="text-accent fw-bold text-decoration-none">Regístrate aquí</Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default LoginView;
