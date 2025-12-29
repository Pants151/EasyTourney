import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tournaments/';

const getAuthHeaders = () => {
    const token = localStorage.getItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

const updateMatchResult = async (matchId, resultData) => {
    const response = await axios.put(`${API_URL}match/${matchId}`, resultData, getAuthHeaders());
    return response.data;
};

const getMyTournaments = async () => {
    const response = await axios.get(API_URL + 'my-tournaments', getAuthHeaders());
    return response.data;
};

const createTournament = async (data) => axios.post(API_URL, data, getAuthHeaders());
const updateTournament = async (id, data) => axios.put(API_URL + id, data, getAuthHeaders());
const deleteTournament = async (id) => axios.delete(API_URL + id, getAuthHeaders());
const getTournaments = async () => (await axios.get(API_URL)).data;
const getTournamentById = async (id) => (await axios.get(API_URL + id)).data;
const joinTournament = async (id) => axios.put(`${API_URL}join/${id}`, {}, getAuthHeaders());
const generateBrackets = async (id) => axios.post(`${API_URL}generate/${id}`, {}, getAuthHeaders());
const publishTournament = async (id) => axios.put(`${API_URL}publish/${id}`, {}, getAuthHeaders());
const getTournamentMatches = async (id) => (await axios.get(`${API_URL}${id}/matches`)).data;
const advanceTournament = async (id) => axios.post(`${API_URL}advance/${id}`, {}, getAuthHeaders());
const createTeam = async (id, data) => axios.post(`${API_URL}team/${id}`, data, getAuthHeaders());
const joinTeam = async (teamId) => axios.put(`${API_URL}team/join/${teamId}`, {}, getAuthHeaders());
const leaveTournament = async (id) => axios.put(`${API_URL}leave/${id}`, {}, getAuthHeaders());
const expelParticipant = async (tId, uId) => axios.delete(`${API_URL}${tId}/expel/${uId}`, getAuthHeaders());

export default { 
    createTournament, 
    getTournaments, 
    getTournamentById, 
    joinTournament, 
    generateBrackets,
    publishTournament,
    getTournamentMatches,
    updateMatchResult,
    advanceTournament,
    getMyTournaments,
    updateTournament,
    deleteTournament,
    createTeam,
    joinTeam,
    leaveTournament,
    expelParticipant
};