import axios from 'axios';
import config from '../config';

const API_URL = `${config.API_URL}/auth/`;

const register = async (userData) => {
    const response = await axios.post(API_URL + 'register', userData);
    return response.data;
};

const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    if (response.data.token) {
        localStorage.setItem('userToken', response.data.token);
    }
    return response.data;
};

const getAuthHeaders = () => ({
    headers: { 'x-auth-token': localStorage.getItem('userToken') }
});

const getProfile = async () => (await axios.get(API_URL + 'profile', getAuthHeaders())).data;
const updateProfile = async (userData) => (await axios.put(API_URL + 'profile', userData, getAuthHeaders())).data;
const deleteAccount = async () => (await axios.delete(API_URL + 'profile', getAuthHeaders())).data;
const changePassword = async (passwords) =>
    (await axios.put(API_URL + 'change-password', passwords, getAuthHeaders())).data;

const getAllUsers = async () => (await axios.get(API_URL + 'users', getAuthHeaders())).data;
const deleteUserByAdmin = async (id) => (await axios.delete(`${API_URL}users/${id}`, getAuthHeaders())).data;
const forgotPassword = async (email) => (await axios.post(API_URL + 'forgot-password', { email })).data;
const resetPassword = async (token, password) => (await axios.post(API_URL + `reset-password/${token}`, { password })).data;

export default { register, login, getProfile, updateProfile, deleteAccount, changePassword, getAllUsers, deleteUserByAdmin, forgotPassword, resetPassword };