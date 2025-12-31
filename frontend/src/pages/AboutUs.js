import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
    return (
        <div className="about-page-wrapper">
            {/* ENCABEZADO CON LOGO GRANDE */}
            <div className="container text-center pt-5 mb-5 animate__animated animate__fadeIn">
                <img src="/assets/images/logo-big.png" alt="EasyTourney Logo" className="about-main-logo mb-4" />
                <h2 className="text-accent text-uppercase fw-bolder letter-spacing-2">Sobre Nosotros...</h2>
            </div>

            <div className="container pb-5">
                {/* SECCIÓN VISIÓN: IMAGEN IZQUIERDA - TEXTO DERECHA */}
                <section className="row align-items-center mb-100 animate__animated animate__fadeInLeft">
                    <div className="col-lg-5 mb-4 mb-lg-0">
                        <div className="about-img-container">
                            <img src="/assets/images/about-vision.jpg" alt="Nuestra Visión" className="img-fluid rounded about-img shadow-lg" />
                        </div>
                    </div>
                    <div className="col-lg-7 ps-lg-5">
                        <h3 className="text-white text-uppercase fw-bold mb-4">Nuestra <span className="text-accent">Visión</span></h3>
                        <p className="about-text">
                            El mundo de los eSports es una industria global que mueve a millones de jugadores y espectadores. 
                            Pero esta revolución no solo ocurre en los estadios; nace y crece cada día en comunidades amateur, 
                            ligas locales y eventos educativos.
                        </p>
                        <p className="about-text">
                            Nuestra visión es un ecosistema de eSports donde la pasión por competir no se vea frenada por 
                            herramientas complicadas o caras. Creemos que organizar un torneo debe ser tan accesible e 
                            intuitivo como jugarlo.
                        </p>
                    </div>
                </section>

                {/* SECCIÓN MISIÓN: TEXTO IZQUIERDA - IMAGEN DERECHA */}
                <section className="row align-items-center mb-100 flex-column-reverse flex-lg-row animate__animated animate__fadeInRight">
                    <div className="col-lg-7 pe-lg-5">
                        <h3 className="text-white text-uppercase fw-bold mb-4 text-lg-end">Nuestra <span className="text-accent">Misión</span></h3>
                        <p className="about-text text-lg-end">
                            Nuestra misión es dar una solución específica y accesible a los organizadores de torneos. 
                            Queremos eliminar los errores, retrasos y la mala experiencia causados por usar herramientas 
                            genéricas como hojas de cálculo o Discord.
                        </p>
                        <p className="about-text text-lg-end">
                            Proporcionamos una plataforma web full-stack que automatiza las tareas pesadas: desde la 
                            gestión de inscripciones hasta la generación automática de brackets.
                        </p>
                        <p className="about-text text-lg-end">
                            Ofrecemos una interfaz intuitiva pensada para gente sin conocimientos técnicos y, lo más 
                            importante, de forma totalmente gratuita, sin bloquear funciones esenciales tras una suscripción.
                        </p>
                    </div>
                    <div className="col-lg-5 mb-4 mb-lg-0">
                        <div className="about-img-container">
                            <img src="/assets/images/about-mission.jpg" alt="Nuestra Misión" className="img-fluid rounded about-img shadow-lg" />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN AUTOR: CENTRADO */}
                <section className="text-center mt-5 pt-5 animate__animated animate__zoomIn">
                    <h4 className="text-white text-uppercase fw-bold mb-4">Hecho por...</h4>
                    <div className="author-card mx-auto">
                        <div className="author-img-wrapper mb-3">
                            <img src="/assets/images/about-author.jpg" alt="José Antonio Valenzuela Núñez" className="author-img" />
                        </div>
                        <h5 className="text-accent fw-bold m-0">José Antonio Valenzuela Núñez</h5>
                        <p className="text-dim small text-uppercase mt-1">Desarrollador de EasyTourney</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;