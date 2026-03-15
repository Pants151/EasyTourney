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
                try {
                    const parsed = JSON.parse(userData);
                    setUser({ token, ...parsed });

                    // No bloquear render inicial si hay email
                    if (parsed.email) {
                        setLoading(false);
                    }

                    // Sincronizar perfil fresco
                    const freshData = await authService.getProfile();
                    if (freshData) {
                        freshData.id = freshData._id || freshData.id;
                        setStoredItem('userData', JSON.stringify(freshData));
                        setUser({ token, ...freshData });
                    }
                } catch (err) {
                    console.error("Auth sync error:", err);
                    // Permitir renderizado aunque falle el perfil si no hay 401
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        loadUser();
    }, []);


    // Conectar Socket.io globalmente
    useEffect(() => {
        let socket = null;
        if (user && user.id) {
            socket = io(config.SOCKET_URL);

            // Unirse a sala privada de socket
            socket.emit('joinUserRoom', user.id);

            // Escuchar expulsión en tiempo real
            socket.on('force_logout', () => {
                removeStoredItem('userToken');
                removeStoredItem('userData');
                window.location.href = '/login'; 
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
            await authService.logout();
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