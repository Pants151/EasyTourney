import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tournaments/';

// Configurar el token en los headers para rutas protegidas
const getAuthHeaders = () => {
    const token = localStorage.getItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

const createTournament = async (tournamentData) => {
    const response = await axios.post(API_URL, tournamentData, getAuthHeaders());
    return response.data;
};

const getTournaments = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

const joinTournament = async (id) => {
    const response = await axios.put(`${API_URL}join/${id}`, {}, getAuthHeaders());
    return response.data;
};

const getTournamentById = async (id) => {
    const response = await axios.get(API_URL + id);
    return response.data;
};

export default { createTournament, getTournaments, joinTournament, getTournamentById };