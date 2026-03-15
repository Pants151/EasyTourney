import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../../services/authService';
import PasswordInput from '../../components/PasswordInput';
import '../TournamentForm.css';

const AdminEditUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '', email: '', rol: '', pais: '', fechaNacimiento: '', idioma: []
    });
    const [passwordNuevo, setPasswordNuevo] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await authService.getUserByIdByAdmin(id);

                let formattedDate = '';
                if (data.fechaNacimiento) {
                    formattedDate = new Date(data.fechaNacimiento).toISOString().split('T')[0];
                }

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
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert("Error al cargar los datos del usuario");
                navigate('/admin-users');
            }
        };
        fetchUser();
    }, [id, navigate]);

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

        if (formData.username.trim().length < 3) {
            alert('El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Por favor, introduce un correo electrónico válido.');
            return;
        }

        if (formData.fechaNacimiento) {
            const birthDate = new Date(formData.fechaNacimiento);
            const today = new Date();
            if (birthDate > today) {
                alert('La fecha de nacimiento no puede ser en el futuro.');
                return;
            }
        }

        try {
            await authService.updateUserByAdmin(id, formData);
            alert('Usuario actualizado con éxito');
            navigate('/admin-users');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al actualizar usuario');
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();

        if (passwordNuevo.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            await authService.changeUserPasswordByAdmin(id, passwordNuevo);
            alert('Contraseña actualizada con éxito');
            setPasswordNuevo('');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al cambiar contraseña');
        }
    };

    if (loading) return <div className="container py-5 mt-navbar text-center text-white">Cargando datos...</div>;

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-uppercase fw-bolder m-0 text-white">Editar <span className="text-accent">Usuario</span></h2>
                            <button className="btn btn-view-all btn-sm" onClick={() => navigate('/admin-users')}>CANCELAR</button>
                        </div>

                        <form onSubmit={onUpdateProfile}>
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Información de {formData.username}</h5>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nombre de Usuario</label>
                                    <input type="text" className="form-control form-control-custom" value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })} required minLength="3" maxLength="20" />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Rol de Usuario</label>
                                    <select
                                        className="form-select form-select-custom"
                                        value={formData.rol}
                                        onChange={e => setFormData({ ...formData, rol: e.target.value })}
                                    >
                                        <option value="participante">Participante</option>
                                        <option value="organizador">Organizador</option>
                                        <option value="administrador">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12 mb-4">
                                    <label className="form-label-custom">Correo Electrónico</label>
                                    <input type="email" className="form-control form-control-custom" value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })} required maxLength="50" />
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
                                <label className="form-label-custom">Idiomas</label>
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

                            <div className="d-grid gap-2">
                                <button type="submit" className="btn-accent py-2 fw-bold text-uppercase">Guardar Datos Personales</button>
                            </div>
                        </form>

                        <hr className="my-5 border-secondary" />

                        {/* --- SECCIÓN SEGURIDAD (CONTRASEÑA) --- */}
                        <form onSubmit={onChangePassword} className="mb-4">
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Seguridad</h5>
                            <div className="row">
                                <div className="col-md-12 mb-4">
                                    <label className="form-label-custom">Nueva Contraseña para el Usuario</label>
                                    <PasswordInput name="passwordNuevo" className="form-control form-control-custom"
                                        value={passwordNuevo} onChange={e => setPasswordNuevo(e.target.value)} required minLength="6" maxLength="100" />
                                </div>
                            </div>
                            <div className="d-grid">
                                <button type="submit" className="btn btn-outline-warning fw-bold py-2 text-uppercase">Resetear Contraseña</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEditUser;
