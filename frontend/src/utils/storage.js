// Detectar PWA
const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

// Aislar sesión en PWA
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
