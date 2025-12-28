import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './TournamentForm.css'; // Reutilizamos los estilos de formulario

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err) {
            alert('Error al iniciar sesión. Comprueba tus credenciales.');
        }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="text-center mb-4">
                            <img src="/assets/images/logo-nav.png" alt="Logo" height="50" className="mb-3" />
                            <h2 className="text-uppercase fw-bolder text-white">Iniciar <span className="text-accent">Sesión</span></h2>
                        </div>
                        
                        <form onSubmit={onSubmit}>
                            <div className="mb-4">
                                <label className="form-label-custom">Correo Electrónico</label>
                                <input type="email" name="email" className="form-control form-control-custom" 
                                    placeholder="tu@email.com" onChange={onChange} required />
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Contraseña</label>
                                <input type="password" name="password" className="form-control form-control-custom" 
                                    placeholder="********" onChange={onChange} required />
                            </div>
                            
                            <button type="submit" className="btn-accent w-100 mb-4">ENTRAR</button>
                            
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

export default Login;