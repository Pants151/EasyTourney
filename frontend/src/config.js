// Configuración unificada
// Cambiar IS_PRODUCTION a true para deploy en Render

const IS_PRODUCTION = false;

const config = {
    API_URL: IS_PRODUCTION
        ? 'https://easytourney.onrender.com/api'
        : 'http://localhost:5000/api',
    SOCKET_URL: IS_PRODUCTION
        ? 'https://easytourney.onrender.com'
        : 'http://localhost:5000'
};

export default config;
