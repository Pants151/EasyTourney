import React from 'react';
import './ContactUs.css';

const ContactUs = () => {
    return (
        <div className="contact-page-wrapper">
            <div className="container text-center pt-5 animate__animated animate__fadeIn">
                <img src="/assets/images/logo-big.png" alt="EasyTourney Logo" className="contact-main-logo mb-4" />
                
                <h2 className="text-accent text-uppercase fw-bolder letter-spacing-2 mb-5">Contáctanos...</h2>

                <div className="contact-card mx-auto p-5 bg-dark-secondary rounded shadow-lg border-accent-thin">
                    <i className="bi bi-envelope-paper-heart text-accent display-4 mb-4 d-block"></i>
                    
                    <h4 className="text-white mb-3 fw-bold">¿Necesitas información?</h4>
                    <p className="text-dim lead mb-4">Puedes preguntarnos en:</p>
                    
                    {/* Cambiado de <a> a <span> para que no haga nada */}
                    <span className="contact-email-link text-accent fw-bold d-block">
                        business@easytourney.com
                    </span>
                </div>
                
                <p className="mt-5 text-dim small">Responderemos a tu solicitud en la mayor brevedad posible.</p>
            </div>
        </div>
    );
};

export default ContactUs;