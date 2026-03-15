import React, { useEffect, useState, useContext } from 'react';
import gameService from '../../services/gameService';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import HomeView from './HomeView';

const Home = () => {
    const { user } = useContext(AuthContext);
    const [topGames, setTopGames] = useState([]);
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Detectar si ya estamos dentro de la App (modo standalone)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsInstalled(true);
        }

        // Capturar evento de instalación disponible
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });

        // Detectar si se instaló con éxito para ocultar botón
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert("Si el instalador no se abre automáticamente puede deberse a dos motivos:\n\n1. Ya tienes la App instalada en tu dispositivo.\n2. Tu navegador (Brave, Safari, Firefox...) requiere instalación manual. Busca el icono de descarga en la barra de direcciones, o pulsa 'Añadir a la pantalla de inicio' en el menú de opciones.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleScrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
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
        <HomeView
            user={user}
            topGames={topGames}
            navigate={navigate}
            isInstalled={isInstalled}
            handleInstallClick={handleInstallClick}
            handleScrollToTop={handleScrollToTop}
        />
    );
};

export default Home;
