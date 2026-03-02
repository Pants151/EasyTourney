// Archivo unificado de configuración
// Cambia la variable IS_PRODUCTION a true cuando vayas a subir tu código a Render.
// Déjala en false mientras estás desarrollando en tu ordenador local.

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
