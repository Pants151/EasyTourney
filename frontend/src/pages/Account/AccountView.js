import React from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../../components/common/PasswordInput';
import '../TournamentForm.css';

const AccountView = ({
    user,
    formData,
    setFormData,
    passwords,
    setPasswords,
    availableLanguages,
    onUpdateProfile,
    onChangePassword,
    onDelete
}) => {
    const navigate = useNavigate();

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-uppercase fw-bolder m-0 text-white">Mi <span className="text-accent">Cuenta</span></h2>
                            <button className="btn btn-view-all btn-sm" onClick={() => navigate(-1)}>VOLVER ATRÁS</button>
                        </div>

                        <form onSubmit={onUpdateProfile} className="mb-5 pb-5 border-bottom border-secondary">
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Datos Personales</h5>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nombre de Usuario</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-custom"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        minLength="3"
                                        maxLength="20"
                                    />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Rol de Usuario</label>
                                    {user?.rol === 'administrador' ? (
                                        <input
                                            type="text"
                                            className="form-control form-control-custom opacity-50"
                                            value={formData.rol}
                                            readOnly
                                            title="Los administradores no pueden cambiar su rol desde aquí"
                                        />
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
                                <div className="col-md-12 mb-4">
                                    <label className="form-label-custom">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        className="form-control form-control-custom"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        maxLength="50"
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label-custom">País</label>
                                    <select
                                        name="pais"
                                        className="form-select form-select-custom"
                                        onChange={e => setFormData({ ...formData, pais: e.target.value })}
                                        value={formData.pais}
                                    >
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
                                        onChange={e => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                        value={formData.fechaNacimiento}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label-custom">Idiomas que hablas</label>
                                <select
                                    className="form-select form-select-custom mb-2"
                                    onChange={e => {
                                        const value = e.target.value;
                                        if (value && !formData.idioma.includes(value)) {
                                            setFormData({
                                                ...formData,
                                                idioma: [...formData.idioma, value]
                                            });
                                        }
                                        e.target.value = "";
                                    }}
                                >
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
                                                <button
                                                    type="button"
                                                    className="btn-close btn-close-white ms-2"
                                                    style={{ fontSize: '0.6rem' }}
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        idioma: formData.idioma.filter(lang => lang !== langCode)
                                                    })}
                                                ></button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <button type="submit" className="btn-accent px-5">GUARDAR DATOS</button>
                        </form>

                        <form onSubmit={onChangePassword} className="mb-5">
                            <h5 className="text-white mb-4 text-uppercase fw-bold">Seguridad</h5>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Contraseña Actual</label>
                                    <PasswordInput
                                        name="passwordActual"
                                        className="form-control form-control-custom"
                                        value={passwords.passwordActual}
                                        onChange={e => setPasswords({ ...passwords, passwordActual: e.target.value })}
                                        required
                                        minLength="6"
                                        maxLength="100"
                                    />
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Nueva Contraseña</label>
                                    <PasswordInput
                                        name="passwordNuevo"
                                        className="form-control form-control-custom"
                                        value={passwords.passwordNuevo}
                                        onChange={e => setPasswords({ ...passwords, passwordNuevo: e.target.value })}
                                        required
                                        minLength="6"
                                        maxLength="100"
                                    />
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

export default AccountView;

