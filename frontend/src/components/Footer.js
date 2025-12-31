import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    // Función para realizar el desplazamiento suave hacia arriba
    const handleScrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="footer-custom py-5 mt-5">
            <div className="container text-center">
                {/* Enlaces del Footer con el evento onClick añadido */}
                <div className="footer-links d-flex justify-content-center flex-wrap gap-4 mb-4">
                    <Link 
                        to="/tournaments" 
                        className="footer-link-item" 
                        onClick={handleScrollToTop}
                    >
                        Ver todos los torneos
                    </Link>
                    <Link 
                        to="/games" 
                        className="footer-link-item" 
                        onClick={handleScrollToTop}
                    >
                        Ver todos los juegos
                    </Link>
                    <Link 
                        to="/about" 
                        className="footer-link-item" 
                        onClick={handleScrollToTop}
                    >
                        Sobre nosotros
                    </Link>
                    <Link 
                        to="/contact" 
                        className="footer-link-item" 
                        onClick={handleScrollToTop}
                    >
                        Contáctanos
                    </Link>
                </div>
                
                <div className="footer-bottom">
                    <p className="text-dim small mb-0">
                        &copy; {new Date().getFullYear()} EasyTourney - Tu plataforma de eSports.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;