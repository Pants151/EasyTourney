import React, { useState } from 'react';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../../components/PasswordInput';
import '../TournamentForm.css';

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
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-md-7 col-lg-6">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-uppercase fw-bolder m-0 text-white">Crear <span className="text-accent">Cuenta</span></h2>
                            <button className="btn btn-view-all btn-sm" onClick={() => navigate(-1)}>VOLVER</button>
                        </div>

                        <form onSubmit={onSubmit}>
                            <div className="mb-3">
                                <label className="form-label-custom">Nombre de Usuario (Mín. 3 letras)</label>
                                <input
                                    type="text"
                                    name="username"
                                    className="form-control form-control-custom"
                                    onChange={onChange}
                                    required
                                    minLength="3"
                                    maxLength="20"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label-custom">Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control form-control-custom"
                                    onChange={onChange}
                                    required
                                    maxLength="50"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label-custom">Contraseña (Mín. 6 caracteres)</label>
                                <PasswordInput
                                    name="password"
                                    className="form-control form-control-custom"
                                    onChange={onChange}
                                    required
                                    minLength="6"
                                    maxLength="100"
                                />
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label-custom">País</label>
                                    <select name="pais" className="form-select form-select-custom" onChange={onChange} value={formData.pais}>
                                        <option value="España">España</option>
                                        <option value="México">México</option>
                                        <option value="Argentina">Argentina</option>
                                        <option value="Colombia">Colombia</option>
                                        <option value="Chile">Chile</option>
                                        <option value="Perú">Perú</option>
                                        <option value="Venezuela">Venezuela</option>
                                        <option value="Ecuador">Ecuador</option>
                                        <option value="Guatemala">Guatemala</option>
                                        <option value="Cuba">Cuba</option>
                                        <option value="Bolivia">Bolivia</option>
                                        <option value="República Dominicana">República Dominicana</option>
                                        <option value="Honduras">Honduras</option>
                                        <option value="El Salvador">El Salvador</option>
                                        <option value="Paraguay">Paraguay</option>
                                        <option value="Nicaragua">Nicaragua</option>
                                        <option value="Costa Rica">Costa Rica</option>
                                        <option value="Panamá">Panamá</option>
                                        <option value="Uruguay">Uruguay</option>
                                        <option value="Estados Unidos">Estados Unidos</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label-custom">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        name="fechaNacimiento"
                                        className="form-control form-control-custom"
                                        onChange={onChange}
                                        value={formData.fechaNacimiento}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label-custom">Idiomas que hablas</label>
                                <select className="form-select form-select-custom mb-2" onChange={handleLanguageSelect}>
                                    <option value="">-- Añadir idioma --</option>
                                    {availableLanguages.map(lang => (
                                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                                    ))}
                                </select>
                                <div className="d-flex flex-wrap gap-2">
                                    {formData.idioma.map(langCode => {
                                        const langName = availableLanguages.find(l => l.code === langCode)?.name || langCode;
                                        return (
                                            <span key={langCode} className="badge bg-accent d-flex align-items-center p-2 border border-secondary">
                                                {langName}
                                                <button type="button" className="btn-close btn-close-white ms-2"
                                                    style={{ fontSize: '0.6rem' }} onClick={() => removeLanguage(langCode)}></button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label-custom">¿Qué quieres ser?</label>
                                <select name="rol" className="form-select form-select-custom" onChange={onChange}>
                                    <option value="participante">Participante (Jugador)</option>
                                    <option value="organizador">Organizador de Eventos</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-accent w-100">REGISTRARSE</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;