import React from 'react';
import { Link } from 'react-router-dom';
import backgroundHero from '../../assets/images/mi-fondo-hero.jpg';
import logoBig from '../../assets/images/logo-big.png';
import esportsVideo from '../../assets/images/esports-video.mp4';
import iconTrophy from '../../assets/images/icon-trophy.png';
import iconController from '../../assets/images/icon-controller.png';
import './Home.css';

const HomeView = ({
    user,
    topGames,
    navigate,
    isInstalled,
    handleInstallClick,
    handleScrollToTop
}) => {
    return (
        <div className="home-wrapper">

            {/* Hero */}
            <section
                className="hero-section d-flex align-items-center justify-content-center"
                style={{
                    // Ruta directa a public sin imports fallidos
                    backgroundImage: `url(${backgroundHero})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="hero-bg-overlay"></div>

                <div className="hero-content text-center text-uppercase position-relative z-2">
                    <div className="hero-logo-container mb-2 animate-fade-up">
                        <img src={logoBig} alt="Logo Grande" className="hero-logo img-fluid" />
                    </div>

                    <h1 className="hero-title fw-bolder mb-3 animate-fade-up delay-1 text-white">
                        DONDE NACEN LAS <span className="text-accent outline-text">LEYENDAS</span>
                    </h1>
                    <p className="hero-subtitle h4 mb-5 text-white animate-fade-up delay-2">
                        Compite. Gana. Escribe tu historia.
                    </p>

                    <div className="hero-buttons d-flex justify-content-center flex-wrap gap-3">
                        {!user && (
                            <Link
                                to="/register"
                                className="btn btn-accent btn-lg animate-fade-up delay-3 text-white"
                                onClick={handleScrollToTop}
                            >
                                EMPIEZA TU LEGADO
                            </Link>
                        )}

                        {!isInstalled && (
                            <button
                                onClick={handleInstallClick}
                                className="btn btn-download-app btn-lg animate-fade-up delay-3"
                            >
                                DESCARGAR APP
                            </button>
                        )}
                    </div>
                </div>
            </section>


            {/* Juegos populares */}
            <section className="popular-games-bar py-5 bg-dark-secondary position-relative z-3">
                <div className="container text-center">
                    <h4 className="text-uppercase fw-bold mb-4">
                        JUEGOS MÁS <span className="text-accent">POPULARES</span>
                    </h4>

                    <div className="games-scroll-container mb-4">
                        {topGames.map(game => (
                            <div
                                key={game._id}
                                className="game-cover-item mx-2"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    handleScrollToTop();
                                    navigate(`/tournaments?game=${game._id}`);
                                }}
                            >
                                <img src={game.caratula} alt={game.nombre} className="img-fluid" />
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn btn-view-all mt-2"
                        onClick={() => {
                            handleScrollToTop();
                            navigate('/games');
                        }}
                    >
                        Ver todos los juegos
                    </button>
                </div>
            </section>


            {/* Features */}
            <section className="video-feature-section position-relative">
                <div className="video-background-container">
                    <video autoPlay loop muted playsInline className="video-bg">
                        <source src={esportsVideo} type="video/mp4" />
                    </video>
                    <div className="video-overlay-gradient"></div>
                </div>

                <div className="container position-relative z-2 content-container h-100 d-flex align-items-center">
                    <div className="row w-100 align-items-center">
                        <div className="col-lg-6 text-white">
                            <h2 className="feature-title text-uppercase fw-bolder mb-4 lh-1">
                                VIVE LA <span className="text-accent">INTENSIDAD</span> DE LA COMPETICIÓN AMATEUR
                            </h2>
                            <p className="lead text-dim mb-5">
                                Crea torneos, participa en ellos y demuestra quien manda. Tu camino al estrellato comienza aquí.
                            </p>

                            <div className="d-flex feature-icons">
                                <div className="feature-item d-flex align-items-center me-5">
                                    <img src={iconTrophy} alt="Trofeo" height="50" className="me-3" />
                                    <div>
                                        <h5 className="fw-bold mb-0">TORNEOS ÉPICOS</h5>
                                        <small className="text-dim">Juega y compite</small>
                                    </div>
                                </div>
                                <div className="feature-item d-flex align-items-center">
                                    <img src={iconController} alt="Mando" height="50" className="me-3" />
                                    <div>
                                        <h5 className="fw-bold mb-0">PLATAFORMAS MÚLTIPLES</h5>
                                        <small className="text-dim">Montones de plataformas disponibles</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6"></div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default HomeView;
