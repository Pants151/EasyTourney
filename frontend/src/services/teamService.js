import axios from 'axios';
import config from '../config';
import { getStoredItem } from '../utils/storage';

const API_URL = `${config.API_URL}/teams/`;

const getAuthHeaders = () => {
    const token = getStoredItem('userToken');
    return { headers: { 'x-auth-token': token } };
};

const getTeams = async () => {
    const response = await axios.get(API_URL, getAuthHeaders());
    return response.data;
};

const deleteTeam = async (id) => {
    const response = await axios.delete(`${API_URL}${id}`, getAuthHeaders());
    return response.data;
};

const deleteTeamsBulk = async (ids) => {
    const response = await axios.delete(`${API_URL}bulk`, { ...getAuthHeaders(), data: { ids } });
    return response.data;
};

const teamService = {
    getTeams,
    deleteTeam,
    deleteTeamsBulk
};

export default teamService;
