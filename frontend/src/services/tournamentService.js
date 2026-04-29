import axios from 'axios';
import config from '../config';
import { getStoredItem } from '../utils/storage';

const API_URL = `${config.API_URL}/tournaments`;

const getAuthHeaders = () => {
    const token = getStoredItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

const updateMatchResult = async (matchId, resultData) => {
    const response = await axios.put(`${API_URL}/match/${matchId}`, resultData, getAuthHeaders());
    return response.data;
};

const getMyTournaments = async () => {
    const response = await axios.get(`${API_URL}/my-tournaments`, getAuthHeaders());
    return response.data;
};

const createTournament = async (data) => axios.post(API_URL, data, getAuthHeaders());
const updateTournament = async (id, data) => axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
const deleteTournament = async (id) => axios.delete(`${API_URL}/${id}`, getAuthHeaders());
const deleteTournamentsBulk = async (ids) => axios.delete(`${API_URL}/delete/bulk`, { ...getAuthHeaders(), data: { ids } });
// Caché en memoria (1s) para evitar múltiples peticiones en cadena
let tournamentsPromise = null;
const getTournaments = async () => {
    if (tournamentsPromise) return tournamentsPromise;
    tournamentsPromise = (async () => {
        try {
            return (await axios.get(API_URL)).data;
        } finally {
            tournamentsPromise = null;
        }
    })();
    return tournamentsPromise;
};

let tournamentDetailPromises = {};
const getTournamentById = async (id) => {
    if (tournamentDetailPromises[id]) return tournamentDetailPromises[id];
    tournamentDetailPromises[id] = (async () => {
        try {
            return (await axios.get(`${API_URL}/${id}`)).data;
        } finally {
            delete tournamentDetailPromises[id];
        }
    })();
    return tournamentDetailPromises[id];
};
const joinTournament = async (id) => axios.put(`${API_URL}/join/${id}`, {}, getAuthHeaders());
const generateBrackets = async (id) => axios.post(`${API_URL}/generate/${id}`, {}, getAuthHeaders());
const publishTournament = async (id) => axios.put(`${API_URL}/publish/${id}`, {}, getAuthHeaders());
const getTournamentMatches = async (id) => (await axios.get(`${API_URL}/${id}/matches`)).data;
const advanceTournament = async (id) => axios.post(`${API_URL}/advance/${id}`, {}, getAuthHeaders());
const createTeam = async (id, data) => axios.post(`${API_URL}/team/${id}`, data, getAuthHeaders());
const joinTeam = async (teamId) => axios.put(`${API_URL}/team/join/${teamId}`, {}, getAuthHeaders());
const respondToTeamRequest = async (teamId, data) => axios.put(`${API_URL}/team/respond/${teamId}`, data, getAuthHeaders());
const leaveTournament = async (id) => axios.put(`${API_URL}/leave/${id}`, {}, getAuthHeaders());
const expelParticipant = async (tId, uId) => axios.delete(`${API_URL}/${tId}/expel/${uId}`, getAuthHeaders());
const reportBRRoundWinner = async (id, data) => axios.put(`${API_URL}/${id}/br-round`, data, getAuthHeaders());
const addBot = async (id) => axios.post(`${API_URL}/${id}/add-bot`, {}, getAuthHeaders());
const clearBots = async (id) => axios.delete(`${API_URL}/${id}/clear-bots`, getAuthHeaders());
const renameBot = async (id, entityId, data) => axios.put(`${API_URL}/${id}/rename-bot/${entityId}`, data, getAuthHeaders());
const disqualifyParticipant = async (id, type, targetId) => axios.put(`${API_URL}/${id}/disqualify/${type}/${targetId}`, {}, getAuthHeaders());
const cancelTournament = async (id) => axios.put(`${API_URL}/${id}/cancel`, {}, getAuthHeaders());

const tournamentService = {
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
    deleteTournamentsBulk,
    createTeam,
    joinTeam,
    respondToTeamRequest,
    leaveTournament,
    expelParticipant,
    reportBRRoundWinner,
    addBot,
    clearBots,
    renameBot,
    disqualifyParticipant,
    cancelTournament
};

export default tournamentService;
