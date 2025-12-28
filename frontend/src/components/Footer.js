import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer py-4 mt-auto">
            <div className="container text-center">
                <img src="/assets/images/logo-nav.png" alt="Logo" height="100" className="mb-3" />
                <p className="text-muted small">© 2024 EasyTourney. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;