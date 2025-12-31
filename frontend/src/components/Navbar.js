import React, { useContext, useState } from 'react'; // Añadimos useState
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // Estado para controlar si el menú está abierto o cerrado
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Función para cerrar el menú cuando se hace clic en un enlace
    const closeMenu = () => setIsMenuOpen(false);

    const handleLogout = () => {
        logout();
        closeMenu();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg fixed-top custom-navbar">
            <div className="container">
                {/* Logo */}
                <Link className="navbar-brand py-0" to="/" onClick={closeMenu}>
                    <img src="/assets/images/logo-nav.png" alt="EasyTourney" className="nav-logo" />
                </Link>

                {/* BOTÓN HAMBURGUESA: Controlado por isMenuOpen */}
                <button 
                    className={`navbar-toggler custom-toggler ${!isMenuOpen ? 'collapsed' : ''}`} 
                    type="button" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    aria-expanded={isMenuOpen} 
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* CONTENIDO COLAPSABLE: La clase 'show' controla la visibilidad */}
                <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link nav-link-custom" to="/tournaments" onClick={closeMenu}>TORNEOS</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link nav-link-custom" to="/games" onClick={closeMenu}>JUEGOS</Link>
                        </li>
                    </ul>

                    <ul className="navbar-nav align-items-lg-center">
                        {user ? (
                            <li className="nav-item">
                                <Link className="nav-link nav-link-custom" to="/account" onClick={closeMenu}>CUENTA</Link>
                            </li>
                        ) : (
                            <li className="nav-item">
                                <Link className="nav-link nav-link-custom" to="/" onClick={closeMenu}>INICIO</Link>
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
                                    onClick={closeMenu}
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