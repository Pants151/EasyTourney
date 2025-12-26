import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tournaments/';

const getAuthHeaders = () => {
    const token = localStorage.getItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

const createTournament = async (data) => axios.post(API_URL, data, getAuthHeaders());
const getTournaments = async () => (await axios.get(API_URL)).data;
const getTournamentById = async (id) => (await axios.get(API_URL + id)).data;
const joinTournament = async (id) => axios.put(`${API_URL}join/${id}`, {}, getAuthHeaders());
const generateBrackets = async (id) => axios.post(`${API_URL}generate/${id}`, {}, getAuthHeaders());
const publishTournament = async (id) => axios.put(`${API_URL}publish/${id}`, {}, getAuthHeaders());

export default { 
    createTournament, 
    getTournaments, 
    getTournamentById, 
    joinTournament, 
    generateBrackets,
    publishTournament
};