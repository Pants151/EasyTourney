import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import tournamentService from '../services/tournamentService';
import { AuthContext } from '../context/AuthContext';
import './TournamentDetails.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Añadir esta utilidad arriba
const isPowerOfTwo = (n) => n > 1 && (n & (n - 1)) === 0;

const TournamentDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [activeTab, setActiveTab] = useState('fases'); // Estado para el mini-nav
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [tData, mData] = await Promise.all([
                    tournamentService.getTournamentById(id),
                    tournamentService.getTournamentMatches(id)
                ]);

                // Enriquecer participantes con nombre de equipo si aplica
                if (tData.formato === 'Equipos' && tData.equipos) {
                    tData.participantes = tData.participantes.map(p => {
                        const team = tData.equipos.find(t => t.miembros.some(m => (m.usuario._id || m.usuario) === p._id));
                        return { ...p, equipoNombre: team ? team.nombre : null };
                    });
                }

                setTournament(tData);
                setMatches(mData);
            } catch (err) { console.error(err); }
        };
        fetchAll();
    }, [id]);

    if (!tournament) return <div className="text-center py-5 text-white">Cargando...</div>;

    const isOrganizer = user && tournament.organizador && (user.id === tournament.organizador._id || user.id === tournament.organizador);

    // Determinamos el conteo según el formato
    const currentCount = tournament.formato === 'Equipos' 
        ? tournament.equipos?.length || 0 
        : tournament.participantes?.length || 0;

    const hasValidPowerOfTwo = isPowerOfTwo(currentCount);

    // Ejemplo de reporte visual de ganador
    const handleSetWinner = async (matchId, winnerId) => {
    if (!isOrganizer) return;
    try {
        // Cambiamos 'reportWinner' por 'updateMatchResult'
        // Cambiamos el campo 'ganador' por 'ganadorId'
        await tournamentService.updateMatchResult(matchId, { ganadorId: winnerId }); 
        window.location.reload();
    } catch (err) { 
        console.error(err);
        alert("Error al reportar ganador"); 
    }
};

    const handleSetWinnerBR = async (winnerId) => {
        if (!isOrganizer) return;
        try {
            await tournamentService.reportBRRoundWinner(id, { winnerId });
            window.location.reload();
        } catch (err) { alert("Error al reportar ganador de ronda"); }
    };

    const handlePublish = async () => {
    try {
        await tournamentService.publishTournament(id);
        alert('Torneo publicado correctamente.');
        window.location.reload();
    } catch (err) { alert('Error al publicar el torneo'); }
};

const handleGenerateBrackets = async () => {
    try {
        await tournamentService.generateBrackets(id);
        alert('Torneo iniciado y brackets generados.');
        window.location.reload();
    } catch (err) { alert(err.response?.data?.msg || 'Error al generar brackets'); }
};

const handleAdvanceRound = async () => {
    try {
        const res = await tournamentService.advanceTournament(id);
        alert(res.data.msg);
        window.location.reload();
    } catch (err) { alert(err.response?.data?.msg || 'Error al avanzar de ronda'); }
};

    const handleJoin = async () => {
        try {
            await tournamentService.joinTournament(id); //
            alert('¡Inscripción realizada con éxito!');
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al inscribirse');
        }
    };

    const handleInscribirse = () => {
        if (tournament.formato === 'Equipos') {
            setShowTeamModal(true); // Abrir ventana de equipos
        } else {
            handleJoin(); // Inscripción directa 1v1 o BR
        }
    };

    const handleCreateTeam = async () => {
        try {
            // Llamada al servicio para crear equipo
            await tournamentService.createTeam(id, { nombre: newTeamName });
            alert("Equipo creado. Eres el capitán.");
            window.location.reload();
        } catch (err) { alert("Error al crear equipo"); }
    };

    const handleJoinTeam = async (teamId) => {
        try {
            await tournamentService.joinTeam(teamId);
            alert("Solicitud enviada al equipo.");
            window.location.reload();
        } catch (err) { alert(err.response?.data?.msg || "Error al unirse al equipo"); }
    };

    const handleExpulsar = async (userId) => {
    if (!window.confirm("¿Estás seguro de expulsar a este participante?")) return;
    try {
        // Cambiamos kickParticipant por expelParticipant
        await tournamentService.expelParticipant(id, userId); 
        alert("Participante expulsado.");
        window.location.reload();
    } catch (err) {
        alert(err.response?.data?.msg || "Error al expulsar");
    }
};

    const handleLeave = async () => {
        if (!window.confirm("¿Seguro que quieres abandonar el torneo? Si eres capitán, el equipo se disolverá.")) return;
        try {
            await tournamentService.leaveTournament(id);
            alert("Has abandonado el torneo.");
            window.location.reload();
        } catch (err) { alert(err.response?.data?.msg || "Error al abandonar"); }
    };

    const handleRespondMember = async (teamId, userId, action) => {
        try {
            await tournamentService.respondToTeamRequest(teamId, { userId, action });
            alert(`Usuario ${action === 'accept' ? 'aceptado' : 'rechazado'}`);
            window.location.reload();
        } catch (err) { alert("Error al procesar solicitud"); }
    };

    const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título
    doc.setFontSize(22);
    doc.setTextColor(255, 115, 0); 
    doc.text(tournament.nombre.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

    // Información General - USO DE autoTable(doc, ...)
    autoTable(doc, {
        startY: 40,
        head: [['Característica', 'Detalle']],
        body: [
            ['Juego', tournament.juego?.nombre],
            ['Organizador', tournament.organizador?.username || 'N/A'],
            ['Fecha de Inicio', new Date(tournament.fechaInicio).toLocaleDateString()],
            ['Formato', tournament.formato],
            ['Participantes', tournament.participantes?.length],
            ['Estado', tournament.estado.toUpperCase()],
            ['CAMPEÓN', tournament.formato === 'Equipos' ? tournament.ganador?.nombre : tournament.ganador?.username]
        ],
        theme: 'striped',
        headStyles: { fillColor: [255, 115, 0] }
    });

    // Resumen de Enfrentamientos
    if (tournament.formato !== 'Battle Royale' && matches.length > 0) {
        const matchesBody = matches.map(m => {
            const p1 = tournament.formato === 'Equipos' ? m.equipo1?.nombre : m.jugador1?.username;
            const p2 = tournament.formato === 'Equipos' ? m.equipo2?.nombre : m.jugador2?.username;
            const win = tournament.formato === 'Equipos' ? m.ganador?.nombre : m.ganador?.username;
            return [`Ronda ${m.ronda}`, `${p1 || 'TBD'} vs ${p2 || 'BYE'}`, win || 'Pendiente'];
        });

        doc.text("Resumen de Enfrentamientos", 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Ronda', 'Duelo', 'Resultado']],
            body: matchesBody
        });
    }

    doc.save(`Reporte_${tournament.nombre}.pdf`);
};

    // Lógica para verificar si el usuario ya está inscrito
    const isJoined = tournament.participantes.some(p => (p._id || p) === (user?.id || user?._id));
    // Solo mostramos el botón si es participante, el torneo está abierto y no está unido
    const showJoinButton = user?.rol === 'participante' && tournament.estado === 'Abierto' && !isJoined;

    // Agrupamos enfrentamientos por rondas para "FASES"
    const rounds = {};
    matches.forEach(m => {
        if (!rounds[m.ronda]) rounds[m.ronda] = [];
        rounds[m.ronda].push(m);
    });

    return (
        <div className="details-page-wrapper mt-navbar">
            <header className="tournament-hero" style={{ backgroundImage: `url(${tournament.juego?.header})` }}>
                <div className="hero-overlay-details"></div>
                <div className="container hero-info-content">
                    <div className="d-flex align-items-center mb-3">
                        <img src={tournament.juego?.logo} alt="Logo" className="game-logo-details me-4" />
                        <div>
                            <span className={`badge mb-2 ${tournament.estado === 'Finalizado' ? 'bg-success' : 'bg-accent'}`}>
                                {tournament.estado.toUpperCase()}
                            </span>
                            <h1 className="display-4 fw-bolder text-white text-uppercase">{tournament.nombre}</h1>
                        </div>
                    </div>

                    {/* BOTONES PARA EL ORGANIZADOR */}
                    {isOrganizer && (
                        <div className="d-flex flex-column gap-2 mt-3">
                            {tournament.estado === 'Borrador' && (
                                <button className="btn btn-accent px-4 fw-bold" onClick={handlePublish}>
                                    PUBLICAR TORNEO
                                </button>
                            )}
                            {tournament.estado === 'Abierto' && (
                                <>
                                    {!hasValidPowerOfTwo && currentCount > 0 && (
                                        <div className="text-warning small fw-bold mb-1">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            Se requiere un número par exacto (2, 4, 8, 16...) para iniciar.
                                        </div>
                                    )}
                                    <button className="btn btn-accent px-4 fw-bold" 
                                        onClick={handleGenerateBrackets}
                                        disabled={!hasValidPowerOfTwo}>
                                        INICIAR Y GENERAR BRACKETS
                                    </button>
                                </>
                            )}
                            {tournament.estado === 'En curso' && (
                                <button className="btn btn-outline-warning px-4 fw-bold" onClick={handleAdvanceRound}>
                                    AVANZAR RONDA / FINALIZAR
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <div className="container py-5">
                <div className="row">
                    {/* INFO LATERAL (Se queda fija aquí) */}
                    <div className="col-lg-3">
                        <div className="info-card-custom mb-4 shadow-sm">
                            <h5 className="text-accent fw-bold text-uppercase mb-3">Resumen</h5>
                            <ul className="list-unstyled text-white small">
                                <li className="mb-2"><i className="bi bi-controller text-accent me-2"></i> {tournament.juego?.nombre}</li>
                                <li className="mb-2"><i className="bi bi-calendar-event text-accent me-2"></i> {new Date(tournament.fechaInicio).toLocaleDateString()}</li>
                                <li className="mb-2"><i className="bi bi-people text-accent me-2"></i> {tournament.participantes?.length} Inscritos</li>
                                <li className="mb-2"><i className="bi bi-shield-check text-accent me-2"></i> {tournament.formato || tournament.modalidad}</li>
                            </ul>

                            {/* AVISO DEL GANADOR */}
                            {tournament.estado === 'Finalizado' && tournament.ganador && (
                                <div className="winner-announcement mt-4 p-3 text-center rounded">
                                    <div className="fs-1 mb-1">🏆</div>
                                    <h6 className="text-accent fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Campeón</h6>
                                    <h5 className="text-white fw-bolder mb-0">
                                        {tournament.formato === 'Equipos' 
                                            ? (tournament.ganador.nombre || "Equipo Desconocido") 
                                            : (tournament.ganador.username || "Usuario Desconocido")}
                                    </h5>
                                </div>
                            )}

                            {/* BOTÓN DE INSCRIPCIÓN */}
                            {showJoinButton && (
                                <button className="btn btn-accent w-100 mt-3 fw-bold" onClick={handleInscribirse}>
                                    INSCRIBIRSE AHORA
                                </button>
                            )}
                            {isJoined && user?.rol === 'participante' && (
                                <div className="alert alert-success mt-3 py-2 text-center small fw-bold">
                                    <i className="bi bi-check-circle me-2"></i>ESTÁS INSCRITO
                                </div>
                            )}
                            {isJoined && tournament.estado === 'Abierto' && user?.rol === 'participante' && (
                                <button className="btn btn-outline-danger w-100 mt-2 btn-sm fw-bold" onClick={handleLeave}>
                                    ABANDONAR TORNEO
                                </button>
                            )}
                            {tournament.estado === 'Finalizado' && user && (
                                <button className="btn btn-outline-light w-100 mt-3 btn-sm fw-bold" onClick={exportToPDF}>
                                    <i className="bi bi-file-earmark-pdf me-2"></i>EXPORTAR REPORTE (PDF)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* CONTENIDO DINÁMICO CON MINI-NAV */}
                    <div className="col-lg-9">
                        <div className="tournament-mini-nav d-flex gap-4 mb-4 border-bottom border-secondary pb-2">
                            {['fases', 'información', 'participantes', 'streams'].map(tab => (
                                <button 
                                    key={tab}
                                    className={`nav-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="tab-content-wrapper">
                            {/* VISTA FASES (Brackets) */}
                            {activeTab === 'fases' && (
                                <div className="fases-content">
                                    {tournament.formato === 'Battle Royale' ? (
                                        <div className="br-phases-container text-white">
                                            {/* HISTORIAL DE RONDAS */}
                                            <div className="rounds-history mb-4 p-4 bg-dark-secondary rounded shadow-sm">
                                                <h5 className="text-accent text-uppercase fw-bold mb-3">Historial de Rondas</h5>
                                                <div className="d-flex flex-column gap-2">
                                                    {tournament.ganadoresRondaBR?.length > 0 ? tournament.ganadoresRondaBR.map((g, index) => (
                                                        <div key={index} className="d-flex justify-content-between border-bottom border-secondary pb-2">
                                                            <span className="text-dim">Ronda {index + 1}</span>
                                                            <span className="fw-bold text-white">🏆 {g.username || "Usuario"}</span>
                                                        </div>
                                                    )) : <p className="text-dim small">No se han jugado rondas aún.</p>}
                                                </div>
                                                <div className="mt-3 text-end">
                                                    <small className="text-accent fw-bold">Objetivo: {tournament.alMejorDe} victorias</small>
                                                </div>
                                            </div>

                                            {/* PANEL DE CONTROL (Solo Organizador y torneo en curso) */}
                                            {isOrganizer && tournament.estado === 'En curso' && (
                                                <div className="organizer-controls p-4 bg-dark-secondary rounded border border-accent shadow-sm">
                                                    <h5 className="text-white text-uppercase fw-bold mb-3">Seleccionar Ganador de Ronda</h5>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {tournament.participantes.map(p => {
                                                            const wins = tournament.ganadoresRondaBR?.filter(id => (id._id || id) === p._id).length || 0;
                                                            return (
                                                                <button key={p._id} className="btn btn-outline-light d-flex flex-column align-items-center p-3" 
                                                                    onClick={() => handleSetWinnerBR(p._id)} style={{ minWidth: '120px' }}>
                                                                    <span className="fw-bold">{p.username}</span>
                                                                    <span className="badge bg-accent mt-2">{wins} / {tournament.alMejorDe}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* VISTA PARA PARTICIPANTES (Contador de victorias) */}
                                            {(!isOrganizer || tournament.estado === 'Finalizado') && (
                                                <div className="participant-view p-4 bg-dark-secondary rounded shadow-sm">
                                                    <h5 className="text-white text-uppercase fw-bold mb-3">Marcador Actual</h5>
                                                    <div className="row">
                                                        {tournament.participantes.map(p => {
                                                            const wins = tournament.ganadoresRondaBR?.filter(id => (id._id || id) === p._id).length || 0;
                                                            return (
                                                                <div key={p._id} className="col-md-4 mb-2">
                                                                    <div className="p-2 border border-secondary rounded text-center">
                                                                        <div className="fw-bold">{p.username}</div>
                                                                        <div className="text-accent">{wins} victorias</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : Object.keys(rounds).length > 0 ? (
                                        <div className="brackets-container-wrapper">
                                            <div className="brackets-tree">
                                                {Object.keys(rounds).sort((a, b) => a - b).map((rNum, colIndex) => (
                                                    <div key={rNum} className={`round-column col-ronda-${rNum}`}>
                                                        <h6 className="round-title text-accent">Ronda {rNum}</h6>
                                                        <div className="matches-list">
                                                            {rounds[rNum].map((m) => {
                                                                const isTeams = tournament.formato === 'Equipos';
                                                                const p1 = isTeams ? m.equipo1 : m.jugador1;
                                                                const p2 = isTeams ? m.equipo2 : m.jugador2;
                                                                const p1Name = isTeams ? p1?.nombre : p1?.username;
                                                                const p2Name = isTeams ? p2?.nombre : p2?.username;
                                                                const canSetWinner = isOrganizer && tournament.estado === 'En curso' && !m.ganador;

                                                                return (
                                                                    <div key={m._id} className="match-wrapper">
                                                                        <div className="match-item shadow-sm">
                                                                            <div 
                                                                                className={`player-slot rounded-top ${m.ganador?._id === p1?._id ? 'is-winner' : 'bg-dark'} ${canSetWinner && p1 ? 'cursor-pointer' : 'no-interaction'}`}
                                                                                onClick={() => canSetWinner && p1 && handleSetWinner(m._id, p1._id)}
                                                                            >
                                                                                <span className="player-name-text">{p1Name || 'TBD'}</span>
                                                                            </div>
                                                                            
                                                                            {/* DIV DEL VS ENTRE LOS DOS NOMBRES */}
                                                                            <div className="bracket-vs">VS</div>
                                                                            
                                                                            <div 
                                                                                className={`player-slot rounded-bottom ${m.ganador?._id === p2?._id ? 'is-winner' : 'bg-dark'} ${canSetWinner && p2 ? 'cursor-pointer' : 'no-interaction'}`}
                                                                                onClick={() => canSetWinner && p2 && handleSetWinner(m._id, p2._id)}
                                                                            >
                                                                                <span className="player-name-text">
                                                                                    {p2Name || (m.resultado === "BYE" ? "---" : (isTeams ? 'TBD' : 'BYE'))}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 bg-dark-secondary rounded">
                                            <p className="text-dim m-0">El cuadro se generará cuando inicie el torneo.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VISTA INFORMACIÓN (Reglamento) */}
                            {activeTab === 'información' && (
                                <div className="info-tab-content text-white p-4 bg-dark-secondary rounded shadow-sm">
                                    <h4 className="text-accent text-uppercase fw-bold mb-3">Reglamento y Detalles</h4>
                                    <p className="reglas-text" style={{ whiteSpace: 'pre-wrap' }}>
                                        {tournament.reglas || "El organizador no ha proporcionado reglas específicas aún."}
                                    </p>
                                </div>
                            )}

                            {/* VISTA PARTICIPANTES (Tarjetas) */}
                            {activeTab === 'participantes' && (
                                <div className="row">
                                    {tournament.formato === 'Equipos' && tournament.equipos?.map(team => {
                                        // Si el usuario actual es el capitán de este equipo
                                        if (user && team.capitan === user.id) {
                                            const pendientes = team.miembros.filter(m => m.estado === 'Pendiente');
                                            if (pendientes.length === 0) return null;

                                            return (
                                                <div key={team._id} className="col-12 mb-4">
                                                    <div className="alert alert-warning border-warning bg-dark-secondary">
                                                        <h6 className="fw-bold text-warning text-uppercase small">
                                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                            Solicitudes pendientes para tu equipo: {team.nombre}
                                                        </h6>
                                                        <hr />
                                                        {pendientes.map(m => (
                                                            <div key={m.usuario._id} className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="text-white">{m.usuario.username}</span>
                                                                <div className="d-flex gap-2">
                                                                    <button className="btn btn-success btn-sm" onClick={() => handleRespondMember(team._id, m.usuario._id, 'accept')}>ACEPTAR</button>
                                                                    <button className="btn btn-danger btn-sm" onClick={() => handleRespondMember(team._id, m.usuario._id, 'reject')}>RECHAZAR</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                    {tournament.participantes.map(p => (
                                        <div key={p._id} className="col-md-4 mb-3">
                                            <div className="participant-card p-3 bg-dark-secondary rounded text-center">
                                                <h6 className="text-white fw-bold mb-1">{p.username}</h6>
                                                {tournament.formato === 'Equipos' && (
                                                    <div className="text-accent small text-uppercase">
                                                        Equipo: {p.equipoNombre || 'Sin equipo'}
                                                    </div>
                                                )}
                                                {/* Botón de expulsar para el organizador si el torneo no ha empezado */}
                                                {isOrganizer && tournament.estado === 'Abierto' && (
                                                    <button className="btn btn-link text-danger btn-sm p-0 mt-2" 
                                                        onClick={() => handleExpulsar(p._id)}>EXPULSAR</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* VISTA STREAMS/VÍDEOS */}
                            {activeTab === 'streams' && (
                                <div className="streams-tab-content text-center py-5 bg-dark-secondary rounded">
                                    <i className="bi bi-broadcast fs-1 text-accent mb-3"></i>
                                    <h5 className="text-white">Sin transmisiones activas</h5>
                                    <p className="text-dim">Próximamente podrás ver aquí los directos de Twitch y vídeos de YouTube asociados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DE EQUIPOS */}
            {showTeamModal && (
                <div className="custom-modal-overlay">
                    <div className="form-container-custom p-4 shadow-lg modal-content-team">
                        <h3 className="text-accent text-uppercase fw-bold mb-4">Inscripción por Equipos</h3>
                        
                        {/* CREAR EQUIPO */}
                        <div className="mb-4 pb-4 border-bottom border-secondary">
                            <label className="form-label-custom">Crear Nuevo Equipo</label>
                            <div className="d-flex gap-2">
                                <input type="text" className="form-control form-control-custom" 
                                    placeholder="Nombre del equipo..." value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)} />
                                <button className="btn btn-accent px-4" onClick={handleCreateTeam}>CREAR</button>
                            </div>
                        </div>

                        {/* UNIRSE A EQUIPO EXISTENTE */}
                        <label className="form-label-custom">Equipos Disponibles ({tournament.tamanoEquipoMax} máx)</label>
                        <div className="teams-list-scroll mb-4">
                            {tournament.equipos?.map(team => (
                                <div key={team._id} className="bg-dark p-3 mb-3 rounded border border-secondary shadow-sm">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="text-white fw-bold m-0">{team.nombre}</h6>
                                        <button className="btn btn-accent btn-sm" onClick={() => handleJoinTeam(team._id)}>UNIRSE</button>
                                    </div>
                                    {/* Lista de miembros actuales */}
                                    <div className="d-flex flex-wrap gap-2">
                                        {team.miembros.map(m => (
                                            <span key={m.usuario._id} className={`badge ${m.estado === 'Aceptado' ? 'bg-secondary' : 'bg-dark border border-warning text-warning'}`}>
                                                {m.usuario.username} {m.estado === 'Pendiente' && '(?)'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-view-all w-100" onClick={() => setShowTeamModal(false)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentDetails;