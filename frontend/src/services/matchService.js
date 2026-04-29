import axios from 'axios';
import config from '../config';
import { getStoredItem } from '../utils/storage';

const API_URL = `${config.API_URL}/matches/`;

const getAuthHeaders = () => {
    const token = getStoredItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

const getMatches = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
};

const deleteMatch = async (id) => {
    const response = await axios.delete(`${API_URL}${id}`, getAuthHeaders());
    return response.data;
};

const deleteMatchesBulk = async (ids) => {
    const response = await axios.delete(`${API_URL}bulk`, { ...getAuthHeaders(), data: { ids } });
    return response.data;
};

const matchService = {
    getMatches,
    deleteMatch,
    deleteMatchesBulk
};

export default matchService;
