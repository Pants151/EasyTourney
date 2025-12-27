import axios from 'axios';

const API_URL = 'http://localhost:5000/api/games/';

const getAuthHeaders = () => {
    const token = localStorage.getItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

const getGames = async () => (await axios.get(API_URL)).data;
const createGame = async (data) => (await axios.post(API_URL, data, getAuthHeaders())).data;
const updateGame = async (id, data) => (await axios.put(`${API_URL}${id}`, data, getAuthHeaders())).data;
const deleteGame = async (id) => (await axios.delete(`${API_URL}${id}`, getAuthHeaders())).data;

export default { getGames, createGame, updateGame, deleteGame };