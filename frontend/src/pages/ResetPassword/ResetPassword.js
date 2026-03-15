import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import ResetPasswordView from './ResetPasswordView';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            return setError('Las contraseñas no coinciden.');
        }

        if (password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres.');
        }

        try {
            // Validar token y cambiar password
            const res = await authService.resetPassword(token, password);
            setMessage(res.msg || 'La contraseña se ha restablecido correctamente.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
        }
    };

        return (
        <ResetPasswordView
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            message={message}
            error={error}
            onSubmit={onSubmit}
        />
    );
};

export default ResetPassword;
