import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import config from '../config';
import authService from '../services/authService';
import { getStoredItem, setStoredItem, removeStoredItem } from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUser = async () => {
            const token = getStoredItem('userToken');
            const userData = getStoredItem('userData');
            if (token && userData) {
                // Initialize with local data first for fast render
                setUser({ token, ...JSON.parse(userData) });
                try {
                    // Fetch latest profile to sync roles and other updates invisibly
                    const freshData = await authService.getProfile();
                    if (freshData) {
                        freshData.id = freshData._id || freshData.id;
                        setStoredItem('userData', JSON.stringify(freshData));
                        setUser({ token, ...freshData });
                    }
                } catch (err) {
                    // Silently fail, it will be handled by the interceptor if 401
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    // Conectar Socket.io globalmente en la app si el usuario hace login o re-carga la app
    useEffect(() => {
        let socket = null;
        if (user && user.id) {
            socket = io(config.SOCKET_URL);

            // El usuario avisa de que se conecta para establecer una sala 1 a 1 de servidor a usuario
            socket.emit('joinUserRoom', user.id);

            // Escuchar el evento de expulsión en tiempo real
            socket.on('force_logout', () => {
                removeStoredItem('userToken');
                removeStoredItem('userData');
                window.location.href = '/login'; // Inmediatamente recarga a expensas de la vista actual
            });
        }
        return () => {
            if (socket) socket.disconnect();
        };
    }, [user]);

    const login = (data) => {
        setStoredItem('userToken', data.token);
        setStoredItem('userData', JSON.stringify(data.user));
        setUser({ token: data.token, ...data.user });
        navigate('/');
    };

    const logout = async () => {
        try {
            await authService.logout(); // Limpiar el status fantasma en backend
        } catch (err) { }
        removeStoredItem('userToken');
        removeStoredItem('userData');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};