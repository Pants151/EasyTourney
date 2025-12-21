import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Al cargar la app, miramos si hay un token guardado
        const token = localStorage.getItem('userToken');
        if (token) {
            // Aquí podrías añadir una llamada al backend para validar el token
            // Por ahora, asumimos que existe
            setUser({ token }); 
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem('userToken', token);
        setUser({ token });
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('userToken');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};