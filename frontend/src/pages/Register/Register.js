import React, { useState } from 'react';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import RegisterView from './RegisterView';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', rol: 'participante', pais: 'España', fechaNacimiento: '', idioma: ['es'] });
    const navigate = useNavigate();

    const availableLanguages = [
        { code: 'es', name: 'Español' },
        { code: 'en', name: 'Inglés' },
        { code: 'pt', name: 'Portugués' },
        { code: 'fr', name: 'Francés' },
        { code: 'de', name: 'Alemán' },
        { code: 'it', name: 'Italiano' }
    ];

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleLanguageSelect = (e) => {
        const value = e.target.value;
        if (value && !formData.idioma.includes(value)) {
            setFormData({
                ...formData,
                idioma: [...formData.idioma, value]
            });
        }
        e.target.value = "";
    };

    const removeLanguage = (langCode) => {
        setFormData({
            ...formData,
            idioma: formData.idioma.filter(lang => lang !== langCode)
        });
    };

    const validateForm = () => {
        const { username, email, password, fechaNacimiento } = formData;

        // Validación Nombre de Usuario: Mínimo 3 caracteres
        if (username.trim().length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return false;
        }

        // Validación Básica de Email (regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Por favor, introduce un correo electrónico válido.');
            return false;
        }

        // Validación Básica de Contraseña: Mínimo 6 caracteres
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return false;
        }

        // Validación de fecha de nacimiento (opcional pero si existe, menor a hoy)
        if (fechaNacimiento) {
            const birthDate = new Date(fechaNacimiento);
            const today = new Date();
            if (birthDate > today) {
                alert('La fecha de nacimiento no puede ser en el futuro.');
                return false;
            }
        }

        return true;
    };

    const onSubmit = async e => {
        e.preventDefault();

        // Ejecutar validaciones locales antes de llamar al servidor
        if (!validateForm()) return;

        try {
            await authService.register(formData); //
            alert('Usuario registrado con éxito');
            navigate('/login'); //
        } catch (err) {
            // Si el backend devuelve un error (como "usuario ya existe"), lo mostramos aquí
            const errorMsg = err.response?.data?.msg || 'Error al registrar usuario.';
            alert(errorMsg);
        }
    };

        return (
        <RegisterView
            formData={formData}
            onChange={onChange}
            handleLanguageSelect={handleLanguageSelect}
            removeLanguage={removeLanguage}
            availableLanguages={availableLanguages}
            onSubmit={onSubmit}
            navigate={navigate}
        />
    );
};

export default Register;
