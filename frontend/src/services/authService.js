import axios from 'axios';
import config from '../config';
import { getStoredItem, setStoredItem, removeStoredItem } from '../utils/storage';

const API_URL = `${config.API_URL}/auth/`;

// --- INTERCEPTOR DE Cierre de Sesión Automático (401) ---
axios.interceptors.response.use(
    (response) => response, // Si todo va bien, dejar pasar la respuesta
    (error) => {
        // Si el servidor responde con 401 No Autorizado (ej. Sesión expirada por sesión concurrente)
        if (error.response && error.response.status === 401) {
            removeStoredItem('userToken');
            removeStoredItem('userData');
            // Forzamos recarga y redirección agresiva para limpiar la memoria de React y estados
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const register = async (userData) => {
    const response = await axios.post(API_URL + 'register', userData);
    return response.data;
};

const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    if (response.data.token) {
        setStoredItem('userToken', response.data.token);
    }
    return response.data;
};

const getAuthHeaders = () => ({
    headers: { 'x-auth-token': getStoredItem('userToken') }
});

let profilePromise = null;

const getProfile = async () => {
    if (profilePromise) return profilePromise;

    profilePromise = (async () => {
        try {
            const response = await axios.get(API_URL + 'profile', getAuthHeaders());
            return response.data;
        } finally {
            // Reset promise after a short delay or immediately to allow future fresh fetches
            // but prevent simultaneous redundant calls.
            setTimeout(() => {
                profilePromise = null;
            }, 1000);
        }
    })();

    return profilePromise;
};

const updateProfile = async (userData) => (await axios.put(API_URL + 'profile', userData, getAuthHeaders())).data;
const deleteAccount = async () => (await axios.delete(API_URL + 'profile', getAuthHeaders())).data;
const changePassword = async (passwords) =>
    (await axios.put(API_URL + 'change-password', passwords, getAuthHeaders())).data;

const getAllUsers = async () => (await axios.get(API_URL + 'users', getAuthHeaders())).data;
const getUserByIdByAdmin = async (id) => (await axios.get(`${API_URL}users/${id}`, getAuthHeaders())).data;
const deleteUserByAdmin = async (id) => (await axios.delete(`${API_URL}users/${id}`, getAuthHeaders())).data;
const deleteUsersBulk = async (ids) => (await axios.delete(`${API_URL}users/bulk`, { ...getAuthHeaders(), data: { ids } })).data;
const updateUserByAdmin = async (id, userData) => (await axios.put(`${API_URL}users/${id}`, userData, getAuthHeaders())).data;
const changeUserPasswordByAdmin = async (id, passwordNuevo) => (await axios.put(`${API_URL}users/${id}/password`, { passwordNuevo }, getAuthHeaders())).data;

const forgotPassword = async (email) => (await axios.post(API_URL + 'forgot-password', { email })).data;
const resetPassword = async (token, password) => (await axios.post(API_URL + `reset-password/${token}`, { password })).data;
const logout = async () => (await axios.post(API_URL + 'logout', {}, getAuthHeaders())).data;

const authService = {
    register,
    login,
    getProfile,
    updateProfile,
    deleteAccount,
    changePassword,
    getAllUsers,
    getUserByIdByAdmin,
    updateUserByAdmin,
    changeUserPasswordByAdmin,
    deleteUserByAdmin,
    deleteUsersBulk,
    forgotPassword,
    resetPassword,
    logout
};

export default authService;
