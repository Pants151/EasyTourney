/* frontend/src/components/Footer.js */
import React from 'react';
import { Link } from 'react-router-dom';
import logoNav from '../../assets/images/logo-nav.png';
import './Footer.css';

const Footer = () => {
    const handleScrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="main-footer py-5 mt-auto">
            <div className="container text-center">
                <Link to="/" onClick={handleScrollToTop}>
                    <img
                        src={logoNav}
                        alt="EasyTourney Logo"
                        className="footer-logo mb-4"
                    />
                </Link>

                <div className="footer-links d-flex justify-content-center flex-wrap gap-4 mb-4">
                    <Link to="/tournaments" className="footer-link-item" onClick={handleScrollToTop}>
                        Ver todos los torneos
                    </Link>
                    <Link to="/games" className="footer-link-item" onClick={handleScrollToTop}>
                        Ver todos los juegos
                    </Link>
                    <Link to="/about" className="footer-link-item" onClick={handleScrollToTop}>
                        Sobre nosotros
                    </Link>
                    <Link to="/contact" className="footer-link-item" onClick={handleScrollToTop}>
                        Contáctanos
                    </Link>
                </div>

                <p className="text-muted small m-0">
                    © {new Date().getFullYear()} EasyTourney. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;