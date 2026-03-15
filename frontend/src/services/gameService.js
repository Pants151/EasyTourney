import axios from 'axios';
import config from '../config';
import { getStoredItem } from '../utils/storage';

const API_URL = `${config.API_URL}/games/`;

const getAuthHeaders = () => {
    const token = getStoredItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

let gamesPromise = null;
const getGames = async () => {
    if (gamesPromise) return gamesPromise;
    gamesPromise = (async () => {
        try {
            return (await axios.get(API_URL)).data;
        } finally {
            setTimeout(() => { gamesPromise = null; }, 1000);
        }
    })();
    return gamesPromise;
};
const createGame = async (data) => (await axios.post(API_URL, data, getAuthHeaders())).data;
const updateGame = async (id, data) => (await axios.put(`${API_URL}${id}`, data, getAuthHeaders())).data;
const deleteGame = async (id) => (await axios.delete(`${API_URL}${id}`, getAuthHeaders())).data;
const deleteGamesBulk = async (ids) => (await axios.delete(`${API_URL}bulk`, { ...getAuthHeaders(), data: { ids } })).data;
const getTop5Games = async () => (await axios.get(`${API_URL}top5`)).data;

const gameService = {
    getGames,
    createGame,
    updateGame,
    deleteGame,
    deleteGamesBulk,
    getTop5Games
};

export default gameService;
