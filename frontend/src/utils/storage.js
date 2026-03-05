// Detectar si la app se ejecuta como PWA instalada o en el navegador
const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

// Si es PWA, usaremos un prefijo para aislar la sesión del navegador principal
const PREFIX = isPWA() ? 'pwa_' : '';

export const setStoredItem = (key, value) => {
    localStorage.setItem(PREFIX + key, value);
};

export const getStoredItem = (key) => {
    return localStorage.getItem(PREFIX + key);
};

export const removeStoredItem = (key) => {
    localStorage.removeItem(PREFIX + key);
};
