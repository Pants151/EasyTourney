import axios from 'axios';

const API_URL = 'https://easytourney.onrender.com/api/auth/';

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

export default { register, login, getProfile, updateProfile, deleteAccount, changePassword, getAllUsers, deleteUserByAdmin };