import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import './TournamentForm.css';

const Account = () => {
    const { user, logout } = useContext(AuthContext); // Extraemos user del context
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', email: '', rol: '', pais: '', fechaNacimiento: '', idioma: []
    });
    // Estado separado para el cambio de contraseña
    const [passwords, setPasswords] = useState({ passwordActual: '', passwordNuevo: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();

                // Formatear la fechaNacimiento de ISO (2000-01-01T00:00:00.000Z) a AAAA-MM-DD para el input type="date"
                let formattedDate = '';
                if (data.fechaNacimiento) {
                    formattedDate = new Date(data.fechaNacimiento).toISOString().split('T')[0];
                }

                // Asegurar que el idioma sea siempre un array (ya que en la BD es a veces String)
                let userIdiomas = [];
                if (data.idioma) {
                    userIdiomas = Array.isArray(data.idioma) ? data.idioma : data.idioma.split(',');
                }

                setFormData({
                    username: data.username,
                    email: data.email,
                    rol: data.rol,
                    pais: data.pais || 'España',
                    fechaNacimiento: formattedDate,
                    idioma: userIdiomas
                });
            } catch (err) { console.error(err); }
        };
        fetchProfile();
    }, []);

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

    const onUpdateProfile = async (e) => {
        e.preventDefault();

        // VALIDACIONES LOCALES
        if (formData.username.trim().length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Por favor, introduce un correo electrónico válido.');
            return;
        }

        // AVISO CONFIRMACIÓN BAJADA DE ROL
        if (user?.rol === 'organizador' && formData.rol === 'participante') {
            if (!window.confirm("ATENCIÓN: Estás a punto de cambiar tu rol a Participante. Esto borrará permanentemente TODOS los torneos que has organizado. ¿Estás absolutamente seguro/a?")) {
                return; // Cancelar guardado
            }
        }

        try {
            await authService.updateProfile(formData);
            alert('Perfil actualizado con éxito');
            // Como el rol puede haber cambiado, forzamos recarga para que AuthContext actualice los layouts (navbar, accesos, etc)
            window.location.reload();
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Error al actualizar perfil';
            alert(errorMsg);
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();

        // VALIDACIÓN LOCAL
        if (passwords.passwordNuevo.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            await authService.changePassword(passwords);
            alert('Contraseña cambiada con éxito');
            setPasswords({ passwordActual: '', passwordNuevo: '' });
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al cambiar contraseña');
        }
    };

    const onDelete = async () => {
        if (window.confirm("¿ESTÁS SEGURO? Esta acción es irreversible.")) {
            try {
                await authService.deleteAccount();
                logout();
            } catch (err) { alert('Error al eliminar cuenta'); }
        }
    };

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-uppercase fw-bolder m-0 text-white">Mi <span className="text-accent">Cuenta</span></h2>
                            <button className="btn btn-view-all btn-sm" onClick={() => navigate(-1)}>VOLVER ATRÁS</button>
                        </div>

                        {/* --- SECCIÓN DATOS PERSONALES --- */}
                        <form onSubmit={onUpdateProfile} className="mb-5 pb-5 border-bottom border-secondary">
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Datos Personales</h5>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nombre de Usuario</label>
                                    <input type="text" className="form-control form-control-custom" value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })} required minLength="3" maxLength="20" />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Rol de Usuario</label>
                                    {user?.rol === 'administrador' ? (
                                        <input type="text" className="form-control form-control-custom opacity-50" value={formData.rol} readOnly title="Los administradores no pueden cambiar su rol desde aquí" />
                                    ) : (
                                        <select
                                            className="form-select form-select-custom"
                                            value={formData.rol}
                                            onChange={e => setFormData({ ...formData, rol: e.target.value })}
                                        >
                                            <option value="participante">Participante</option>
                                            <option value="organizador">Organizador</option>
                                        </select>
                                    )}
                                </div>
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

                            <div className="mb-4">
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

                            <button type="submit" className="btn-accent px-5">GUARDAR DATOS</button>
                        </form>

                        {/* --- SECCIÓN SEGURIDAD (CONTRASEÑA) --- */}
                        <form onSubmit={onChangePassword} className="mb-5">
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Seguridad</h5>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Contraseña Actual</label>
                                    <PasswordInput name="passwordActual" className="form-control form-control-custom"
                                        value={passwords.passwordActual} onChange={e => setPasswords({ ...passwords, passwordActual: e.target.value })} required minLength="6" maxLength="100" />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nueva Contraseña</label>
                                    <PasswordInput name="passwordNuevo" className="form-control form-control-custom"
                                        value={passwords.passwordNuevo} onChange={e => setPasswords({ ...passwords, passwordNuevo: e.target.value })} required minLength="6" maxLength="100" />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-outline-warning fw-bold px-5">ACTUALIZAR CONTRASEÑA</button>
                        </form>

                        <div className="text-end border-top border-secondary pt-4">
                            <button type="button" className="btn btn-delete-custom px-4" onClick={onDelete}>ELIMINAR MI CUENTA</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;