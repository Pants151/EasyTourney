import React, { useState } from 'react';
import authService from '../../services/authService';
import ForgotPasswordView from './ForgotPasswordView';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            // Solicitar link de recuperación
            const res = await authService.forgotPassword(email);
            setMessage(res.msg || 'Correo de recuperación enviado exitosamente');
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al solicitar la recuperación de contraseña.');
        }
    };

        return (
        <ForgotPasswordView
            email={email}
            setEmail={setEmail}
            message={message}
            error={error}
            onSubmit={onSubmit}
        />
    );
};

export default ForgotPassword;
