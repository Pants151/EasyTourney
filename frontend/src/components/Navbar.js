import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css'; // Crearemos este archivo específico

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg custom-navbar fixed-top">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    {/* Reemplaza el texto por tu logo pequeño */}
                    <img src="/assets/images/logo-nav.png" alt="EasyTourney Logo" height="40" />
                </Link>
                <button className="navbar-toggler navbar-dark" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                    <ul className="navbar-nav align-items-center">
                        <li className="nav-item"><Link className="nav-link nav-link-custom" to="/">INICIO</Link></li>
                        <li className="nav-item"><Link className="nav-link nav-link-custom" to="/">TORNEOS</Link></li>
                        
                        {user ? (
                            <>
                                {user.rol === 'administrador' && (
                                     <li className="nav-item"><Link className="nav-link nav-link-custom text-accent" to="/admin/games">ADMIN JUEGOS</Link></li>
                                )}
                                {user.rol === 'organizador' && (
                                     <li className="nav-item"><Link className="nav-link nav-link-custom" to="/create-tournament">CREAR TORNEO</Link></li>
                                )}
                                <li className="nav-item ms-3">
                                    <button className="btn btn-outline-light btn-sm px-3" onClick={handleLogout}>CERRAR SESIÓN</button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item ms-3">
                                <Link className="btn btn-accent btn-sm px-4" to="/login">LOGIN / REGISTRO</Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;