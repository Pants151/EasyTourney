import React, { useEffect, useState } from 'react';
import gameService from '../services/gameService'; // Usamos el servicio de juegos
import { Link } from 'react-router-dom';
import './Home.css'; // CSS Específico para esta página

const Home = () => {
    const [topGames, setTopGames] = useState([]);

    useEffect(() => {
        // Cargar los 5 juegos para la barra horizontal
        const fetchTopGames = async () => {
            try {
                const data = await gameService.getTop5Games();
                setTopGames(data);
            } catch (err) {
                console.error("Error cargando top juegos", err);
            }
        };
        fetchTopGames();
    }, []);

    return (
        <div className="home-wrapper">
            
            {/* --- SECCIÓN HERO --- */}
            <section className="hero-section d-flex align-items-center justify-content-center">
                {/* Fondo de imagen sutil o gradiente */}
                <div className="hero-bg-overlay"></div>
                
                <div className="hero-content text-center text-uppercase position-relative z-2">
                    {/* Logo grande */}
                    <img src="/assets/images/logo-big.png" alt="Logo Grande" className="hero-logo img-fluid mb-4 animate-fade-up" />
                    
                    {/* Texto en blanco puro */}
                    <h1 className="hero-title fw-bolder mb-3 animate-fade-up delay-1 text-white">
                        DONDE NACEN LAS <span className="text-accent outline-text">LEYENDAS</span>
                    </h1>
                    <p className="hero-subtitle h4 mb-5 text-white animate-fade-up delay-2">
                        Compite. Gana. Escribe tu historia.
                    </p>
                    <Link to="/register" className="btn btn-accent btn-lg animate-fade-up delay-3 text-white">
                        EMPIEZA TU LEGADO
                    </Link>
                </div>
            </section>


            {/* --- BARRA DE JUEGOS POPULARES --- */}
            <section className="popular-games-bar py-5 bg-dark-secondary position-relative z-3">
                <div className="container text-center">
                    <h4 className="text-uppercase fw-bold mb-4">
                        JUEGOS MÁS <span className="text-accent">POPULARES</span>
                    </h4>
                    
                    {/* Lista horizontal de carátulas */}
                    <div className="games-scroll-container d-flex justify-content-center mb-4">
                        {topGames.map(game => (
                            <div key={game._id} className="game-cover-item mx-2">
                                <img src={game.caratula} alt={game.nombre} className="img-fluid" />
                            </div>
                        ))}
                    </div>

                    {/* Botón debajo de los juegos */}
                    <button className="btn btn-outline-light mt-2 px-4">Ver todos los juegos</button>
                </div>
            </section>


            {/* --- SECCIÓN VIDEO FEATURES --- */}
            <section className="video-feature-section position-relative">
                {/* Contenedor del Video de fondo */}
                <div className="video-background-container">
                    <video autoPlay loop muted playsInline className="video-bg">
                        {/* Asegúrate de tener este archivo en /public/assets/images/ */}
                        <source src="/assets/images/esports-video.mp4" type="video/mp4" />
                    </video>
                    <div className="video-overlay-gradient"></div>
                </div>

                <div className="container position-relative z-2 content-container h-100 d-flex align-items-center">
                    <div className="row w-100 align-items-center">
                        {/* Texto e Iconos a la izquierda */}
                        <div className="col-lg-6 text-white">
                            <h2 className="feature-title text-uppercase fw-bolder mb-4 lh-1">
                                VIVE LA <span className="text-accent">INTENSIDAD</span> DE LA COMPETICIÓN PROFESIONAL
                            </h2>
                            <p className="lead text-dim mb-5">
                                Participa en torneos diarios, sube en el ranking y consigue premios exclusivos. Tu camino al estrellato comienza aquí.
                            </p>
                            
                            <div className="d-flex feature-icons">
                                <div className="feature-item d-flex align-items-center me-5">
                                    <img src="/assets/images/icon-trophy.png" alt="Trofeo" height="50" className="me-3" />
                                    <div>
                                        <h5 className="fw-bold mb-0">TORNEOS ÉPICOS</h5>
                                        <small className="text-dim">Premios reales</small>
                                    </div>
                                </div>
                                <div className="feature-item d-flex align-items-center">
                                    <img src="/assets/images/icon-controller.png" alt="Mando" height="50" className="me-3" />
                                    <div>
                                        <h5 className="fw-bold mb-0">TODAS LAS PLATAFORMAS</h5>
                                        <small className="text-dim">Juega donde quieras</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* El lado derecho queda libre para ver el video de fondo */}
                        <div className="col-lg-6"></div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;