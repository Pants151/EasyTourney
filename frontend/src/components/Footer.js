import React from 'react';
import { Link } from 'react-router-dom'; // Importación necesaria para la navegación
import './Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer py-5 mt-auto">
            <div className="container text-center">
                <img src="/assets/images/logo-nav.png" alt="Logo" height="80" className="mb-4" />
                
                {/* Enlaces de navegación solicitados */}
                <div className="footer-links d-flex justify-content-center flex-wrap gap-4 mb-4">
                    <Link to="/tournaments" className="footer-link-item">Ver todos los torneos</Link>
                    <Link to="/games" className="footer-link-item">Ver todos los juegos</Link>
                    <Link to="/about" className="footer-link-item">Sobre nosotros</Link>
                    <Link to="/contact" className="footer-link-item">Contáctanos</Link>
                </div>

                <p className="text-muted small m-0">© 2024 EasyTourney. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;