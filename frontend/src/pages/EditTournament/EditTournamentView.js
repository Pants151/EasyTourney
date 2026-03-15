import React from 'react';
import '../TournamentForm.css';

const EditTournamentView = ({
    navigate,
    games,
    submitError,
    errors,
    formData,
    setFormData,
    isLocked,
    onUpdate
}) => {
return (
        <div className="container py-5 mt-navbar">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="form-container-custom p-4 p-md-5">
                        <h2 className="text-uppercase fw-bolder mb-4">Editar <span className="text-accent">Torneo</span></h2>
                        {submitError && <div className="form-alert form-alert-danger">{submitError}</div>}
                        {isLocked && <div className="alert alert-info py-2 small">Los ajustes competitivos están bloqueados porque el torneo ya ha sido publicado.</div>}

                        <form onSubmit={onUpdate}>
                            <div className="mb-4">
                                <label className="form-label-custom">Nombre del Torneo</label>
                                <input type="text" className={`form-control-custom form-control ${errors.nombre ? 'is-invalid' : ''}`} value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} required minLength="3" maxLength="50" />
                                {errors.nombre && <span className="error-feedback">{errors.nombre}</span>}
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Juego</label>
                                    <select className="form-select form-select-custom" value={formData.juego}
                                        disabled={isLocked} onChange={e => setFormData({ ...formData, juego: e.target.value })} required>
                                        {games.map(g => <option key={g._id} value={g._id}>{g.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">Formato</label>
                                    <select className="form-select form-select-custom" value={formData.formato}
                                        disabled={isLocked} onChange={e => setFormData({ ...formData, formato: e.target.value })}>
                                        <option value="1v1">1 vs 1</option>
                                        <option value="Equipos">Por Equipos</option>
                                        <option value="Battle Royale">Battle Royale</option>
                                        <option value="Battle Royale - Por equipos">Battle Royale - Por equipos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <label className="form-label-custom">{['Equipos', 'Battle Royale - Por equipos'].includes(formData.formato) ? 'Límite de Equipos' : 'Límite de Participantes'}</label>
                                    <select className="form-select form-select-custom" value={formData.limiteParticipantes}
                                        disabled={isLocked} onChange={e => setFormData({ ...formData, limiteParticipantes: e.target.value })}>
                                        {[2, 4, 8, 16, 32, 64].map(num => <option key={num} value={num}>{num}</option>)}
                                    </select>
                                </div>
                                {['Equipos', 'Battle Royale - Por equipos'].includes(formData.formato) && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Jugadores por Equipo (2-6)</label>
                                        <input type="number" className="form-control-custom form-control" value={formData.tamanoEquipoMax}
                                            disabled={isLocked} onChange={e => setFormData({ ...formData, tamanoEquipoMax: e.target.value })} min="2" max="6" />
                                    </div>
                                )}
                                {['Battle Royale', 'Battle Royale - Por equipos'].includes(formData.formato) && (
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label-custom">Al mejor de (Victorias)</label>
                                        <input type="number" className="form-control-custom form-control" value={formData.alMejorDe}
                                            disabled={isLocked} onChange={e => setFormData({ ...formData, alMejorDe: e.target.value })} min="1" />
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="form-label-custom">Fecha de Inicio</label>
                                <input type="datetime-local" className={`form-control-custom form-control ${errors.fechaInicio ? 'is-invalid' : ''}`}
                                    value={formData.fechaInicio}
                                    onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} required />
                                {errors.fechaInicio && <span className="error-feedback">{errors.fechaInicio}</span>}
                            </div>

                            <div className="mb-4">
                                <label className="form-label-custom">Reglas</label>
                                <textarea className="form-control-custom form-control" rows="4" value={formData.reglas}
                                    onChange={e => setFormData({ ...formData, reglas: e.target.value })} maxLength="1000"></textarea>
                                <div className="text-end mt-1">
                                    <small className={formData.reglas?.length >= 900 ? 'text-danger fw-bold' : 'text-white-50'}>
                                        {formData.reglas?.length || 0}/1000 caracteres
                                    </small>
                                </div>
                            </div>

                            <div className="d-flex gap-3">
                                <button type="submit" className="btn-accent flex-grow-1">GUARDAR CAMBIOS</button>
                                <button type="button" className="btn btn-view-all" onClick={() => navigate(-1)}>CANCELAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTournamentView;
