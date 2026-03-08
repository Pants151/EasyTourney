import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    const handleNavigation = () => {
        setIsMenuOpen(false);
        setIsAdminOpen(false);
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleLogout = () => {
        logout();
        handleNavigation();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg fixed-top custom-navbar">
            <div className="container">
                {/* Logo - Ya cumple la función de ir a Inicio */}
                <Link className="navbar-brand py-0" to="/" onClick={handleNavigation}>
                    <img src="/assets/images/logo-nav.png" alt="EasyTourney" className="nav-logo" />
                </Link>

                <button
                    className={`navbar-toggler custom-toggler ${!isMenuOpen ? 'collapsed' : ''}`}
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-controls="navbarNav"
                    aria-expanded={isMenuOpen}
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link nav-link-custom" to="/tournaments" onClick={handleNavigation}>TORNEOS</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link nav-link-custom" to="/games" onClick={handleNavigation}>JUEGOS</Link>
                        </li>
                        {/* SECCIÓN ADMIN: Desplegable profesional controlado por React */}
                        {user && user.rol === 'administrador' && (
                            <li className={`nav-item dropdown ${isAdminOpen ? 'show' : ''}`}>
                                <button
                                    className="nav-link dropdown-toggle nav-link-custom text-warning fw-bold bg-transparent border-0"
                                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                                    aria-expanded={isAdminOpen}
                                >
                                    ADMIN
                                </button>
                                <ul className={`dropdown-menu dropdown-menu-dark border-secondary shadow-lg anim-dropdown ${isAdminOpen ? 'show' : ''}`} style={{ position: 'absolute' }}>
                                    <li>
                                        <Link className="dropdown-item py-2 px-4 fw-bold" to="/admin/tournaments" onClick={handleNavigation}>
                                            <i className="icon-custom icon-eye me-2 small"></i> TORNEOS
                                        </Link>
                                    </li>
                                    <li>
                                        <Link className="dropdown-item py-2 px-4 fw-bold" to="/admin/games" onClick={handleNavigation}>
                                            <i className="icon-custom icon-eye me-2 small"></i> JUEGOS
                                        </Link>
                                    </li>
                                    <li><hr className="dropdown-divider border-secondary" /></li>
                                    <li>
                                        <Link className="dropdown-item py-2 px-4 fw-bold" to="/admin-users" onClick={handleNavigation}>
                                            <i className="icon-custom icon-person me-2 small"></i> USUARIOS
                                        </Link>
                                    </li>
                                </ul>
                            </li>
                        )}
                    </ul>

                    <ul className="navbar-nav align-items-lg-center">
                        {/* Mantenemos CUENTA solo si el usuario está logueado, eliminamos el 'else' de INICIO */}
                        {user && (
                            <li className="nav-item">
                                <Link className="nav-link nav-link-custom" to="/account" onClick={handleNavigation}>CUENTA</Link>
                            </li>
                        )}

                        <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                            {user ? (
                                <button
                                    className="btn btn-outline-light btn-sm w-100 w-lg-auto"
                                    onClick={handleLogout}
                                >
                                    CERRAR SESIÓN
                                </button>
                            ) : (
                                <Link
                                    className="btn btn-accent btn-sm w-100 w-lg-auto"
                                    to="/login"
                                    onClick={handleNavigation}
                                >
                                    LOGIN / REGISTRO
                                </Link>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;