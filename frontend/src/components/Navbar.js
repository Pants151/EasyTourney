import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <nav className="navbar navbar-expand-lg fixed-top custom-navbar">
            <div className="container">
                {/* Logo más grande */}
                <Link className="navbar-brand py-0" to="/">
                    <img src="/assets/images/logo-nav.png" alt="EasyTourney" className="nav-logo" />
                </Link>

                {/* Secciones al lado del logo */}
                <div className="d-flex me-auto align-items-center">
                    <Link className="nav-link nav-link-custom px-3" to="/tournaments">TORNEOS</Link>
                    <Link className="nav-link nav-link-custom px-3" to="/games">JUEGOS</Link>
                </div>

                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                    <ul className="navbar-nav align-items-center">
                        {user ? (
                            <li className="nav-item">
                                <Link className="nav-link nav-link-custom" to="/account">CUENTA</Link>
                            </li>
                        ) : (
                            <li className="nav-item">
                                <Link className="nav-link nav-link-custom" to="/">INICIO</Link>
                            </li>
                        )}
                        {user ? (
                            <li className="nav-item ms-3">
                                <button className="btn btn-outline-light btn-sm" onClick={() => { logout(); navigate('/login'); }}>CERRAR SESIÓN</button>
                            </li>
                        ) : (
                            <li className="nav-item ms-3">
                                <Link className="btn btn-accent btn-sm" to="/login">LOGIN / REGISTRO</Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;