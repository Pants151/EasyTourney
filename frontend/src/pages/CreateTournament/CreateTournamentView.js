import React from 'react';
import '../TournamentForm.css';

const CreateTournamentView = ({
    games,
    formData,
    setFormData,
    errors,
    serverError,
    navigate,
    onSubmit
}) => {

    return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <h2 className="text-uppercase fw-bolder mb-4">Crear <span className="text-accent">Torneo</span></h2>
                        {serverError && <div className="form-alert form-alert-danger">{serverError}</div>}
                        <form onSubmit={onSubmit}>
                            {/* ... (campos del formulario se mantienen igual) */}
                            <div className="mb-4">
                                <label className="form-label-custom">Nombre del Evento</label>
                                <input type="text" name="nombre" className={`form-control-custom form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                    placeholder="Ej: Copa de Invierno 2024" onChange={e => setFormData({ ...formData, nombre: e.target.value })} required minLength="3" maxLength="50" />
                                {errors.nombre && <span className="error-feedback">{errors.nombre}</span>}
                            </div>
                            <div className="mb-4">
                                <label className="form-label-custom">Juego Oficial</label>
                                <select name="juego" className="form-select form-select-custom" onChange={e => setFormData({ ...formData, juego: e.target.value })} required>
                                    <option value="">Selecciona un juego...</option>
                                    {games.map(g => <option key={g._id} value={g._id}>{g.nombre}</option>)}
                                </select>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Formato de Juego</label>
                                    <select name="formato" className="form-select form-select-custom"
                                        value={formData.formato}
                                        onChange={e => setFormData({ ...formData, formato: e.target.value })}>
                                        <option value="1v1">1v1 (Individual)</option>
                                        <option value="Equipos">Por Equipos</option>
                                        <option value="Battle Royale">Battle Royale</option>
                                        <option value="Battle Royale - Por equipos">Battle Royale - Por equipos</option>
                                    </select>
                                </div>

                                {['Equipos', 'Battle Royale - Por equipos'].includes(formData.formato) && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Integrantes por Equipo (2-6)</label>
                                        <input type="number" className="form-control form-control-custom"
                                            min="2" max="6" value={formData.tamanoEquipoMax}
                                            onChange={e => setFormData({ ...formData, tamanoEquipoMax: e.target.value })} />
                                    </div>
                                )}

                                {['Battle Royale', 'Battle Royale - Por equipos'].includes(formData.formato) && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Al mejor de (Victorias para ganar)</label>
                                        <input type="number" className="form-control form-control-custom"
                                            min="1" value={formData.alMejorDe}
                                            onChange={e => setFormData({ ...formData, alMejorDe: e.target.value })} />
                                    </div>
                                )}

                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">
                                        {['Equipos', 'Battle Royale - Por equipos'].includes(formData.formato) ? 'Límite de Equipos' : 'Límite de Participantes'}
                                    </label>
                                    <select
                                        name="limiteParticipantes"
                                        className="form-select form-select-custom"
                                        value={formData.limiteParticipantes}
                                        onChange={e => setFormData({ ...formData, limiteParticipantes: e.target.value })}
                                    >
                                        {[2, 4, 8, 16, 32, 64].map(num => (
                                            <option key={num} value={num}>
                                                {num} {['Equipos', 'Battle Royale - Por equipos'].includes(formData.formato) ? 'Equipos' : 'Participantes'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Fecha de Inicio</label>
                                    <input type="datetime-local" name="fechaInicio" className={`form-control-custom form-control ${errors.fechaInicio ? 'is-invalid' : ''}`}
                                        value={formData.fechaInicio}
                                        onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} required />
                                    {errors.fechaInicio && <span className="error-feedback">{errors.fechaInicio}</span>}
                                </div>
                            </div>
                            <div className="mb-5">
                                <label className="form-label-custom">Reglamento y Detalles</label>
                                <textarea name="reglas" className="form-control-custom form-control" rows="5"
                                    placeholder="Describe las reglas..." onChange={e => setFormData({ ...formData, reglas: e.target.value })} maxLength="1000"></textarea>
                                <div className="text-end mt-1">
                                    <small className={formData.reglas?.length >= 900 ? 'text-danger fw-bold' : 'text-white-50'}>
                                        {formData.reglas?.length || 0}/1000 caracteres
                                    </small>
                                </div>
                            </div>

                            {/* ACCIONES DEL FORMULARIO: BOTÓN CANCELAR Y PUBLICAR */}
                            <div className="d-flex gap-3 mt-4">
                                <button
                                    type="button"
                                    className="btn btn-outline-light flex-grow-1 fw-bold text-uppercase"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-accent flex-grow-1">
                                    PUBLICAR TORNEO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default CreateTournamentView;
