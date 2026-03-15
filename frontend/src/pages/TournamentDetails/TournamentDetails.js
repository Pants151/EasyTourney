import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import { AuthContext } from '../../context/AuthContext';
import './TournamentDetails.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import io from 'socket.io-client';
import config from '../../config';

const socket = io(config.SOCKET_URL);

// Añadir esta utilidad arriba
const isPowerOfTwo = (n) => n > 1 && (n & (n - 1)) === 0;

const TournamentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [activeTab, setActiveTab] = useState('fases'); // Estado para el mini-nav
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [streamData, setStreamData] = useState({ plataforma: 'Twitch', url: '' });
    const [isGenerating, setIsGenerating] = useState(false); // Estado para evitar doble clic
    const [selectedParticipant, setSelectedParticipant] = useState(null); // Para el modal de detalles

    // Nuevo estado para el modal de puntuación
    const [scoreModal, setScoreModal] = useState({
        isOpen: false,
        matchId: null,
        winnerId: null,
        player1Name: '',
        player2Name: '',
        score1: '',
        score2: ''
    });

    // Fix scroll al montar el componente
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchAll = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        fetchAll();

        // Socket.io logic
        socket.emit('joinTournament', id);

        const handleBracketUpdate = () => {
            console.log("Actualización de brackets recibida");
            fetchAll();
        };

        const handleParticipantUpdate = () => {
            console.log("Nuevo participante detectado");
            fetchAll();
        };

        const handleTournamentFinished = (data) => {
            console.log("¡Torneo finalizado!");
            fetchAll();
        };

        socket.on('bracketUpdated', handleBracketUpdate);
        socket.on('participantUpdated', handleParticipantUpdate);
        socket.on('tournamentFinished', handleTournamentFinished);

        return () => {
            socket.off('bracketUpdated', handleBracketUpdate);
            socket.off('participantUpdated', handleParticipantUpdate);
            socket.off('tournamentFinished', handleTournamentFinished);
        };
    }, [id, fetchAll]);

    if (!tournament) return <div className="text-center py-5 text-white">Cargando...</div>;

    const isOrganizer = user && tournament.organizador && (user.id === tournament.organizador._id || user.id === tournament.organizador);

    // Check all possible admin configurations including typos
    const isAdmin = user && (
        user.rol === 'administrador' ||
        user.rol === 'admin' ||
        user.role === 'admin' ||
        user.role === 'administrador' ||
        user.rol?.toLowerCase() === 'administrador' ||
        user.rol?.toLowerCase() === 'admin'
    );

    const canRenameBots = (isOrganizer || isAdmin) && tournament.estado === 'Abierto';

    // Determinamos el conteo según el formato
    const currentCount = ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato)
        ? tournament.equipos?.length || 0
        : tournament.participantes?.length || 0;

    const hasValidPowerOfTwo = isPowerOfTwo(currentCount);

    // 1. Determinamos si es Battle Royale
    const isBR = ['Battle Royale', 'Battle Royale - Por equipos'].includes(tournament.formato);

    // 2. Ajustamos la validación del conteo
    const canStartTournament = isBR ? currentCount >= 2 : hasValidPowerOfTwo;

    // Ejemplo de reporte visual de ganador
    const handleSetWinnerClick = (match, p1, p2, winnerId) => {
        if (!isOrganizer) return;
        const isTeams = ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato);
        const p1Name = isTeams ? p1?.nombre : p1?.username;
        const p2Name = isTeams ? p2?.nombre : p2?.username;

        setScoreModal({
            isOpen: true,
            matchId: match._id,
            winnerId: winnerId,
            player1Name: p1Name || 'Jugador 1',
            player2Name: p2Name || 'Jugador 2',
            score1: '',
            score2: ''
        });
    };

    const handleScoreSubmit = async (withScore) => {
        if (!isOrganizer) return;

        let resultadoString = "Pendiente";

        if (withScore) {
            const s1 = parseInt(scoreModal.score1 !== '' ? scoreModal.score1 : '0', 10);
            const s2 = parseInt(scoreModal.score2 !== '' ? scoreModal.score2 : '0', 10);

            if (isNaN(s1) || isNaN(s2)) {
                alert("Por favor, introduce puntuaciones válidas.");
                return;
            }

            // Validar que el ganador tenga más puntos
            // scoreModal.winnerId corresponde a p1 o p2?
            // Necesitamos saber si el ganador es el player 1 o el player 2 en el modal
            // Para simplificar, buscamos el match original
            const match = matches.find(m => m._id === scoreModal.matchId);
            const isWinnerP1 = ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato)
                ? match.equipo1?._id === scoreModal.winnerId || match.equipo1 === scoreModal.winnerId
                : match.jugador1?._id === scoreModal.winnerId || match.jugador1 === scoreModal.winnerId;

            if (isWinnerP1 && s1 <= s2) {
                alert(`La puntuación de ${scoreModal.player1Name} debe ser mayor que la de ${scoreModal.player2Name} porque es el ganador.`);
                return;
            } else if (!isWinnerP1 && s2 <= s1) {
                alert(`La puntuación de ${scoreModal.player2Name} debe ser mayor que la de ${scoreModal.player1Name} porque es el ganador.`);
                return;
            }

            resultadoString = `${s1} - ${s2}`;
        }

        try {
            await tournamentService.updateMatchResult(scoreModal.matchId, {
                ganadorId: scoreModal.winnerId,
                resultado: resultadoString !== "Pendiente" ? resultadoString : undefined
            });
            setScoreModal({ ...scoreModal, isOpen: false });
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert("Error al reportar ganador");
        }
    };

    const handleSetWinnerBR = async (winnerId) => {
        if (!isOrganizer) return;

        const isDisqualified = tournament.descalificados?.includes(winnerId);
        if (isDisqualified) {
            alert("No se puede seleccionar a un descalificado como ganador.");
            return;
        }

        let winnerName = "este participante";
        if (tournament.formato === 'Battle Royale - Por equipos') {
            const team = tournament.equipos.find(t => (t._id || t) === winnerId);
            winnerName = team?.nombre || "este equipo";
        } else {
            const participant = tournament.participantes.find(p => (p._id || p) === winnerId);
            winnerName = participant?.username || "este jugador";
        }

        const confirmMsg = `¿Confirmar a "${winnerName}" como ganador de la ronda?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await tournamentService.reportBRRoundWinner(id, { winnerId });
            await fetchAll();
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
            setIsGenerating(true);
            await tournamentService.generateBrackets(id);
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al generar brackets');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAdvanceRound = async () => {
        try {
            const res = await tournamentService.advanceTournament(id);
            alert(res.data.msg);
            await fetchAll();
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

    const handleDisqualify = async (targetId, type, name) => {
        if (!isOrganizer) return;
        if (!window.confirm(`¿Estás seguro de que deseas descalificar a "${name}"? Esta acción es irreversible y perderá sus encuentros pendientes.`)) return;

        try {
            await tournamentService.disqualifyParticipant(id, type, targetId);
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al descalificar');
        }
    };

    const handleCancelTournament = async () => {
        if (!isOrganizer) return;
        if (!window.confirm('¿Estás seguro de que deseas CANCELAR el torneo? Esta acción notificará a todos los participantes y detendrá el evento definitivamente.')) return;

        try {
            await tournamentService.cancelTournament(id);
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al cancelar el torneo');
        }
    };

    const handleInscribirse = () => {
        if (['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato)) {
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
        } catch (err) { alert(err.response?.data?.msg || "Error al crear equipo"); }
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

    const handleAddStream = async () => {
        try {
            const updatedStreams = [...(tournament.streams || []), streamData];
            await tournamentService.updateTournament(id, { streams: updatedStreams });
            alert("Stream añadido correctamente");
            window.location.reload();
        } catch (err) { alert("Error al subir stream"); }
    };

    const handleDeleteStream = async (index) => {
        if (!window.confirm("¿Estás seguro de eliminar este contenido?")) return;
        try {
            const updatedStreams = tournament.streams.filter((_, i) => i !== index);
            await tournamentService.updateTournament(id, { streams: updatedStreams });
            alert("Contenido eliminado");
            window.location.reload();
        } catch (err) { alert("Error al eliminar stream"); }
    };

    // Función auxiliar para obtener el ID de video/canal
    const getEmbedURL = (s) => {
        if (s.plataforma === 'Twitch') {
            const urlParts = s.url.split('/');
            // Si el enlace contiene 'videos', es un VOD (directo finalizado)
            if (s.url.includes('/videos/')) {
                const videoId = urlParts[urlParts.indexOf('videos') + 1].split('?')[0];
                return `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}&autoplay=false`;
            } else {
                // Es un canal en directo
                const channel = urlParts.filter(part => part !== "").pop();
                return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=false`;
            }
        } else {
            // Lógica de YouTube
            const videoId = s.url.split('v=').pop()?.split('&')[0] || s.url.split('/').pop();
            return `https://www.youtube.com/embed/${videoId}`;
        }
    };

    const handleRenameBot = async (entityId, type, currentName) => {
        const newName = window.prompt(`Nuevo nombre para ${type === 'team' ? 'el equipo' : 'el bot'}:`, currentName);
        if (!newName || newName.trim() === '' || newName === currentName) return;

        try {
            await tournamentService.renameBot(id, entityId, { newName: newName.trim(), type });
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al renombrar');
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(22);
        doc.setTextColor(255, 115, 0);
        doc.text(tournament.nombre.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

        const characteristicsBody = [
            ['Organizador', tournament.organizador?.username || 'Desconocido'],
            ['Juego', tournament.juego?.nombre],
            ['Formato', tournament.formato],
            ['Participantes', ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? tournament.equipos?.length : tournament.participantes?.length],
            ['Estado', tournament.estado.toUpperCase()],
            ['CAMPEÓN', ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? tournament.ganador?.nombre : tournament.ganador?.username]
        ];

        if (tournament.formato === 'Equipos' && tournament.estado === 'Finalizado' && tournament.ganador) {
            const winningTeamId = tournament.ganador._id || tournament.ganador;
            const team = tournament.equipos?.find(t => (t._id === winningTeamId || t === winningTeamId));
            if (team) {
                const membersStr = team.miembros
                    .filter(m => m.estado === 'Aceptado')
                    .map(m => m.usuario?.username || 'Desconocido')
                    .join(', ');
                characteristicsBody.push(['Plantilla Campeona', membersStr]);
            }
        }

        // Tabla de Características
        autoTable(doc, {
            startY: 40,
            head: [['Característica', 'Detalle']],
            body: characteristicsBody,
            theme: 'striped',
            headStyles: { fillColor: [255, 115, 0] }
        });

        // LÓGICA PARA BATTLE ROYALE EN EL PDF
        if ((tournament.formato === 'Battle Royale' || tournament.formato === 'Battle Royale - Por equipos') && tournament.ganadoresRondaBR?.length > 0) {
            const brBody = tournament.ganadoresRondaBR.map((g, index) => [
                `Ronda ${index + 1}`,
                g.nombre || g.username || "Equipo"
            ]);

            doc.text("Historial de Rondas (Battle Royale)", 14, doc.lastAutoTable.finalY + 15);
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Ronda', 'Ganador de Ronda']],
                body: brBody
            });
        }
        // Lógica para 1v1 y Equipos (Brackets)
        else if (matches.length > 0) {
            const matchesBody = matches.map(m => {
                const p1 = tournament.formato === 'Equipos' ? m.equipo1?.nombre : m.jugador1?.username;
                const p2 = tournament.formato === 'Equipos' ? m.equipo2?.nombre : m.jugador2?.username;
                const win = tournament.formato === 'Equipos' ? m.ganador?.nombre : m.ganador?.username;
                let resultadoStr = win || 'Pendiente';
                if (m.resultado && m.resultado !== 'Pendiente' && m.resultado !== 'BYE') {
                    resultadoStr += ` (${m.resultado})`;
                }
                return [`Ronda ${m.ronda}`, `${p1 || 'TBD'} vs ${p2 || 'BYE'}`, resultadoStr];
            });

            doc.text("Resumen de Enfrentamientos", 14, doc.lastAutoTable.finalY + 15);
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20, head: [['Ronda', 'Duelo', 'Resultado']], body: matchesBody
            });
        }

        // Listado de Participantes con estado
        const participantsBody = ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato)
            ? tournament.equipos?.map(t => [t.nombre, tournament.descalificados?.includes(t._id) ? 'DESCALIFICADO' : 'ACTIVO'])
            : tournament.participantes?.map(p => [p.username, tournament.descalificados?.includes(p._id) ? 'DESCALIFICADO' : 'ACTIVO']);

        if (participantsBody && participantsBody.length > 0) {
            doc.text("Estado de Participantes", 14, doc.lastAutoTable.finalY + 15);
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Nombre', 'Estado']],
                body: participantsBody,
                theme: 'grid',
                headStyles: { fillColor: [100, 100, 100] }
            });
        }

        // Agregar sección de Reglamento al final si existe
        if (tournament.reglas && tournament.reglas.trim() !== '') {
            let startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 50;

            // Verificar si hay espacio suficiente en la página, en caso contrario añadir nueva
            if (startY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                startY = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(255, 115, 0);
            doc.text("Reglamento y Detalles", 14, startY);

            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);

            // Dividir el texto largo en múltiples líneas para que no se corte
            const rulesText = String(tournament.reglas);
            const splitReglas = doc.splitTextToSize(rulesText, pageWidth - 28);

            // Comprobar desbordamiento de texto en Y
            let textY = startY + 8;
            for (let i = 0; i < splitReglas.length; i++) {
                if (textY > doc.internal.pageSize.getHeight() - 15) {
                    doc.addPage();
                    textY = 20;
                }
                doc.text(splitReglas[i], 14, textY);
                textY += 5; // Aumentar línea
            }
        }

        const safeName = tournament.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`Reporte_${safeName}.pdf`);
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
                    {/* BOTÓN DE VOLVER */}
                    <div className="mb-3">
                        <button className="btn btn-outline-light btn-sm" onClick={() => navigate(-1)}>
                            <i className="bi bi-arrow-left me-2"></i> VOLVER
                        </button>
                    </div>

                    <div className="d-flex align-items-center mb-3">
                        <img src={tournament.juego?.logo} alt="Logo" className="game-logo-details me-4" />
                        <div>
                            <span className={`badge mb-2 ${tournament.estado === 'Finalizado' ? 'bg-success' : tournament.estado === 'Cancelado' ? 'bg-danger' : 'bg-accent'}`}>
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
                                    {/* El aviso de "número par exacto" SOLO sale si NO es Battle Royale */}
                                    {!isBR && !hasValidPowerOfTwo && currentCount > 0 && (
                                        <div className="text-warning small fw-bold mb-1">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            Se requiere un número par exacto (2, 4, 8, 16...) para iniciar.
                                        </div>
                                    )}

                                    {isBR && currentCount < 2 && (
                                        <div className="text-warning small fw-bold mb-1">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            Se requieren al menos 2 {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? 'equipos' : 'participantes'} para iniciar.
                                        </div>
                                    )}

                                    <button className="btn btn-accent px-4 fw-bold"
                                        onClick={handleGenerateBrackets}
                                        disabled={!canStartTournament || isGenerating}>
                                        {isGenerating ? (
                                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>GENERANDO...</>
                                        ) : (
                                            isBR ? 'INICIAR TORNEO' : 'INICIAR Y GENERAR BRACKETS'
                                        )}
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
                                <li className="mb-2"><i className="bi bi-person-badge text-accent me-2"></i> Organizador: {tournament.organizador?.username || 'Desconocido'}</li>
                                <li className="mb-2"><i className="bi bi-controller text-accent me-2"></i> {tournament.juego?.nombre}</li>
                                <li className="mb-2"><i className="bi bi-calendar-event text-accent me-2"></i> {new Date(tournament.fechaInicio).toLocaleDateString()}</li>
                                <li className="mb-2">
                                    <i className="bi bi-people text-accent me-2"></i>
                                    {currentCount} / {tournament.limiteParticipantes} {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? 'Equipos' : 'Inscritos'}
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-pc-display text-accent me-2"></i>
                                    {tournament.plataformas?.length > 0
                                        ? tournament.plataformas.join(', ')
                                        : (tournament.juego?.plataformas?.join(', ') || 'Multiplataforma')}
                                </li>
                                <li className="mb-2"><i className="bi bi-shield-check text-accent me-2"></i> {tournament.formato || tournament.modalidad}</li>
                            </ul>

                            {/* BOTÓN DE CANCELACIÓN (Solo Organizador) */}
                            {isOrganizer && tournament.estado === 'En curso' && (
                                <button className="btn btn-outline-danger w-100 mt-3 fw-bold btn-sm" onClick={handleCancelTournament}>
                                    <i className="bi bi-x-circle me-2"></i>CANCELAR TORNEO
                                </button>
                            )}

                            {/* AVISO DE TORNEO CANCELADO */}
                            {tournament.estado === 'Cancelado' && (
                                <div className="alert alert-danger mt-3 py-2 text-center small fw-bold">
                                    <i className="bi bi-exclamation-octagon me-2"></i>TORNEO CANCELADO
                                </div>
                            )}

                            {/* AVISO DEL GANADOR */}
                            {tournament.estado === 'Finalizado' && tournament.ganador && (
                                <div className="winner-announcement mt-4 p-3 text-center rounded">
                                    <div className="fs-1 mb-1">🏆</div>
                                    <h6 className="text-accent fw-bold text-uppercase mb-1" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Campeón</h6>
                                    <h5 className="text-white fw-bolder mb-0">
                                        {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato)
                                            ? (tournament.ganador.nombre || "Equipo Desconocido")
                                            : (tournament.ganador.username || "Usuario Desconocido")}
                                    </h5>
                                    {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) && tournament.equipos && (
                                        <div className="mt-2" style={{ fontSize: '0.8rem', color: '#aab0c4' }}>
                                            {(() => {
                                                const winningTeamId = tournament.ganador._id || tournament.ganador;
                                                const team = tournament.equipos.find(t => (t._id === winningTeamId || t === winningTeamId));
                                                if (team && team.miembros) {
                                                    return team.miembros
                                                        .filter(m => m.estado === 'Aceptado')
                                                        .map(m => m.usuario?.username || 'Desconocido')
                                                        .join(', ');
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}
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
                            {user?.rol === 'administrador' && (
                                <button
                                    className={`nav-tab-btn ms-auto text-warning fw-bold ${activeTab === 'admin' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('admin')}
                                >
                                    ⚙ ADMIN
                                </button>
                            )}
                        </div>

                        <div className="tab-content-wrapper">
                            {/* VISTA FASES (Brackets) */}
                            {activeTab === 'fases' && (
                                <div className="fases-content">
                                    {(tournament.formato === 'Battle Royale' || tournament.formato === 'Battle Royale - Por equipos') ? (
                                        <div className="br-phases-container text-white">
                                            {/* HISTORIAL DE RONDAS */}
                                            <div className="rounds-history mb-4 p-4 bg-dark-secondary rounded shadow-sm">
                                                <h5 className="text-accent text-uppercase fw-bold mb-3">Historial de Rondas</h5>
                                                <div className="d-flex flex-column gap-2">
                                                    {tournament.ganadoresRondaBR?.length > 0 ? tournament.ganadoresRondaBR.map((g, index) => {
                                                        let winnerName = "Cargando...";
                                                        if (tournament.formato === 'Battle Royale - Por equipos') {
                                                            winnerName = g.nombre || g.username || "Equipo";
                                                        } else {
                                                            winnerName = g.username || "Usuario";
                                                        }
                                                        return (
                                                            <div key={index} className="d-flex justify-content-between border-bottom border-secondary pb-2">
                                                                <span className="text-dim">Ronda {index + 1}</span>
                                                                <span className="fw-bold text-white">🏆 {winnerName}</span>
                                                            </div>
                                                        );
                                                    }) : <p className="text-dim small">No se han jugado rondas aún.</p>}
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
                                                        {tournament.formato === 'Battle Royale - Por equipos' ? (
                                                            tournament.equipos?.map(team => {
                                                                const wins = tournament.ganadoresRondaBR?.filter(id => (id._id || id) === team._id).length || 0;
                                                                const isDisqualified = tournament.descalificados?.includes(team._id);
                                                                const isDisabled = isDisqualified;
                                                                return (
                                                                    <button key={team._id}
                                                                        className={`btn btn-outline-light d-flex flex-column align-items-center p-3 ${isDisabled ? 'opacity-50' : ''}`}
                                                                        onClick={() => handleSetWinnerBR(team._id)}
                                                                        style={{ minWidth: '120px' }}
                                                                        disabled={isDisabled}>
                                                                        <span className={`fw-bold ${isDisabled ? 'text-decoration-line-through text-danger' : ''}`}>
                                                                            {team.nombre} {isDisqualified ? '(DSQ)' : ''}
                                                                        </span>
                                                                        <span className="badge bg-accent mt-2">{wins} / {tournament.alMejorDe}</span>
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            tournament.participantes.map(p => {
                                                                const wins = tournament.ganadoresRondaBR?.filter(id => (id._id || id) === p._id).length || 0;
                                                                const isDisqualified = tournament.descalificados?.includes(p._id);
                                                                const isDisabled = p.isDeleted || isDisqualified;
                                                                return (
                                                                    <button key={p._id}
                                                                        className={`btn btn-outline-light d-flex flex-column align-items-center p-3 ${isDisabled ? 'opacity-50' : ''}`}
                                                                        onClick={() => handleSetWinnerBR(p._id)}
                                                                        style={{ minWidth: '120px' }}
                                                                        disabled={isDisabled}>
                                                                        <span className={`fw-bold ${isDisabled ? 'text-decoration-line-through text-danger' : ''}`}>
                                                                            {p.username} {isDisqualified ? '(DSQ)' : ''}
                                                                        </span>
                                                                        <span className="badge bg-accent mt-2">{wins} / {tournament.alMejorDe}</span>
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* VISTA PARA PARTICIPANTES (Contador de victorias) */}
                                            {(!isOrganizer || tournament.estado === 'Finalizado') && (
                                                <div className="participant-view p-4 bg-dark-secondary rounded shadow-sm">
                                                    <h5 className="text-white text-uppercase fw-bold mb-3">Marcador Actual</h5>
                                                    <div className="row">
                                                        {tournament.formato === 'Battle Royale - Por equipos' ? (
                                                            tournament.equipos?.map(team => {
                                                                const wins = tournament.ganadoresRondaBR?.filter(id => (id._id || id) === team._id).length || 0;
                                                                const isDisqualified = tournament.descalificados?.includes(team._id);
                                                                const isDisabled = isDisqualified;
                                                                return (
                                                                    <div key={team._id} className="col-md-4 mb-2">
                                                                        <div className={`p-2 border border-secondary rounded text-center ${isDisabled ? 'opacity-50 border-danger' : ''}`}>
                                                                            <div className={`fw-bold ${isDisabled ? 'text-danger' : ''}`}>
                                                                                {team.nombre} {isDisqualified ? '(DSQ)' : ''}
                                                                            </div>
                                                                            <div className="text-accent">{wins} victorias</div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            tournament.participantes.map(p => {
                                                                const wins = tournament.ganadoresRondaBR?.filter(id => (id._id || id) === p._id).length || 0;
                                                                const isDisqualified = tournament.descalificados?.includes(p._id);
                                                                const isDisabled = p.isDeleted || isDisqualified;
                                                                return (
                                                                    <div key={p._id} className="col-md-4 mb-2">
                                                                        <div className={`p-2 border border-secondary rounded text-center ${isDisabled ? 'opacity-50 border-danger' : ''}`}>
                                                                            <div className={`fw-bold ${isDisabled ? 'text-danger' : ''}`}>
                                                                                {p.username} {isDisqualified ? '(DSQ)' : ''}
                                                                            </div>
                                                                            <div className="text-accent">{wins} victorias</div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
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
                                                                const isTeams = ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato);
                                                                const p1 = isTeams ? m.equipo1 : m.jugador1;
                                                                const p2 = isTeams ? m.equipo2 : m.jugador2;
                                                                const p1Name = isTeams ? p1?.nombre : p1?.username;
                                                                const p2Name = isTeams ? p2?.nombre : p2?.username;
                                                                const canSetWinner = isOrganizer && tournament.estado === 'En curso' && !m.ganador;

                                                                return (
                                                                    <div key={m._id} className="match-wrapper">
                                                                        <div className="match-item shadow-sm">
                                                                            <div
                                                                                className={`player-slot rounded-top ${m.ganador?._id === p1?._id ? 'is-winner' : 'bg-dark'} ${canSetWinner && p1 && !p1.isDeleted ? 'cursor-pointer' : 'no-interaction'} ${p1?.isDeleted ? 'opacity-50 fst-italic' : ''}`}
                                                                                onClick={() => canSetWinner && p1 && !p1.isDeleted && handleSetWinnerClick(m, p1, p2, p1._id)}
                                                                            >
                                                                                <span className={`player-name-text ${p1?.isDeleted ? 'text-danger' : ''}`}>
                                                                                    {p1Name || 'TBD'}
                                                                                </span>
                                                                            </div>

                                                                            {/* DIV DEL VS ENTRE LOS DOS NOMBRES */}
                                                                            <div className="bracket-vs">
                                                                                {m.resultado && m.resultado !== 'Pendiente' && m.resultado !== 'BYE' ? m.resultado : 'VS'}
                                                                            </div>

                                                                            <div
                                                                                className={`player-slot rounded-bottom ${m.ganador?._id === p2?._id ? 'is-winner' : 'bg-dark'} ${canSetWinner && p2 && !p2.isDeleted ? 'cursor-pointer' : 'no-interaction'} ${p2?.isDeleted ? 'opacity-50 fst-italic' : ''}`}
                                                                                onClick={() => canSetWinner && p2 && !p2.isDeleted && handleSetWinnerClick(m, p1, p2, p2._id)}
                                                                            >
                                                                                <span className={`player-name-text ${p2?.isDeleted ? 'text-danger' : ''}`}>
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
                                    {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? (
                                        tournament.equipos?.map(team => {
                                            const pendientes = team.miembros.filter(m => m.estado === 'Pendiente');
                                            const isMyTeam = user && team.capitan === user.id;

                                            return (
                                                <div key={team._id} className="col-12 mb-5">
                                                    {/* Alertas de pendientes si es mi equipo */}
                                                    {isMyTeam && pendientes.length > 0 && (
                                                        <div className="alert alert-warning border-warning bg-dark-secondary mb-3">
                                                            <h6 className="fw-bold text-warning text-uppercase small">
                                                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                                Solicitudes pendientes: {team.nombre}
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
                                                    )}

                                                    {/* Cabecera del Equipo */}
                                                    <div className="team-header-divider d-flex align-items-center mb-3">
                                                        <h5 className="text-accent fw-bold text-uppercase m-0 me-3">
                                                            {team.nombre} {tournament.descalificados?.includes(team._id) ? '(DESCALIFICADO)' : ''}
                                                        </h5>
                                                        {canRenameBots && (team.nombre.startsWith('BotEquipo') || team.miembros.some(m => m.usuario?.isBot)) && (
                                                            <button className="btn btn-sm btn-outline-warning ms-2 fw-bold" onClick={(e) => { e.stopPropagation(); handleRenameBot(team._id, 'team', team.nombre); }} title="Renombrar Equipo">
                                                                ✎ RENOMBRAR EQUIPO
                                                            </button>
                                                        )}
                                                        {isOrganizer && tournament.estado === 'En curso' && !tournament.descalificados?.includes(team._id) && (
                                                            <button className="btn btn-sm btn-outline-danger ms-2 fw-bold" onClick={(e) => { e.stopPropagation(); handleDisqualify(team._id, 'team', team.nombre); }}>
                                                                <i className="bi bi-person-x me-1"></i>DESCALIFICAR EQUIPO
                                                            </button>
                                                        )}
                                                        {tournament.descalificados?.includes(team._id) && (
                                                            <span className="badge bg-danger ms-2 fw-bold">EQUIPO DESCALIFICADO</span>
                                                        )}
                                                        <div className="flex-grow-1 border-bottom border-secondary"></div>
                                                    </div>

                                                    {/* Miembros del equipo */}
                                                    <div className="row">
                                                        {team.miembros.filter(m => m.estado === 'Aceptado').map(m => {
                                                            const isUserDisqualified = tournament.descalificados?.includes(m.usuario._id);
                                                            const isDisabled = m.usuario.isDeleted || isUserDisqualified;
                                                            return (
                                                                <div key={m.usuario._id} className="col-md-4 mb-3">
                                                                    <div
                                                                        className={`participant-card p-3 bg-dark-secondary rounded text-center cursor-pointer hover-accent-border ${isDisabled ? 'opacity-50 border-danger' : ''}`}
                                                                        onClick={() => setSelectedParticipant(m.usuario)}
                                                                    >
                                                                        <h6 className={`fw-bold mb-1 ${isDisabled ? 'text-danger fst-italic' : 'text-white'}`}>
                                                                            {m.usuario.username} {isUserDisqualified ? '(DSQ)' : ''}
                                                                        </h6>
                                                                        {team.capitan === m.usuario._id && <div className="text-warning small"><i className="bi bi-star-fill me-1"></i>Capitán</div>}

                                                                        <div className="d-flex justify-content-center gap-2 mt-2">
                                                                            {canRenameBots && (m.usuario.isBot || m.usuario.username?.includes('Bot')) && !m.usuario.isDeleted && (
                                                                                <button
                                                                                    className="btn btn-warning btn-sm fw-bold"
                                                                                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRenameBot(m.usuario._id, 'user', m.usuario.username); }}
                                                                                >
                                                                                    ✎ RENOMBRAR
                                                                                </button>
                                                                            )}
                                                                            {isOrganizer && tournament.estado === 'Abierto' && !m.usuario.isDeleted && (
                                                                                <button
                                                                                    className="btn btn-danger btn-sm fw-bold"
                                                                                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExpulsar(m.usuario._id); }}
                                                                                >
                                                                                    ✕ EXPULSAR
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        {(m.usuario.isDeleted || isUserDisqualified) && <div className="badge bg-danger mt-2">ELIMINADO / DSQ</div>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        tournament.participantes.map(p => {
                                            const isUserDisqualified = tournament.descalificados?.includes(p._id);
                                            const isDisabled = p.isDeleted || isUserDisqualified;
                                            return (
                                                <div key={p._id} className="col-md-3 mb-4">
                                                    <div
                                                        className={`participant-card p-4 bg-dark-secondary rounded text-center cursor-pointer hover-accent-border h-100 ${isDisabled ? 'opacity-50 border-danger' : ''}`}
                                                        onClick={() => setSelectedParticipant(p)}
                                                    >
                                                        <div className="display-4 text-accent mb-2"><i className="bi bi-person-circle"></i></div>
                                                        <h5 className={`fw-bold mb-1 ${isDisabled ? 'text-danger' : 'text-white'}`}>
                                                            {p.username} {isUserDisqualified ? '(DSQ)' : ''}
                                                        </h5>
                                                        {p.isBot && <div className="text-warning small mb-2"><i className="bi bi-robot me-1"></i>Bot de Prueba</div>}
                                                        {isDisabled && <div className="badge bg-danger mb-2">ELIMINADO / DSQ</div>}

                                                        <div className="d-flex flex-column gap-2 mt-auto">
                                                            {canRenameBots && (p.isBot || p.username?.includes('Bot')) && !isDisabled && (
                                                                <button className="btn btn-warning btn-sm fw-bold" onClick={(e) => { e.stopPropagation(); handleRenameBot(p._id, 'user', p.username); }}>
                                                                    ✎ RENOMBRAR BOT
                                                                </button>
                                                            )}
                                                            {isOrganizer && tournament.estado === 'Abierto' && !isDisabled && (
                                                                <button className="btn btn-danger btn-sm fw-bold" onClick={(e) => { e.stopPropagation(); handleExpulsar(p._id); }}>
                                                                    ✕ EXPULSAR
                                                                </button>
                                                            )}
                                                            {isOrganizer && tournament.estado === 'En curso' && !isDisabled && (
                                                                <button className="btn btn-danger btn-sm fw-bold" onClick={(e) => { e.stopPropagation(); handleDisqualify(p._id, 'user', p.username); }}>
                                                                    <i className="bi bi-person-x me-1"></i>DESCALIFICAR
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* VISTA STREAMS/VÍDEOS */}
                            {activeTab === 'streams' && (
                                <div className="streams-tab-content">
                                    {/* FORMULARIO SOLO ORGANIZADOR */}
                                    {isOrganizer && (
                                        <div className="bg-dark-secondary p-4 rounded mb-4 border border-accent">
                                            <h6 className="text-white text-uppercase fw-bold mb-3">Subir Stream / Vídeo</h6>
                                            <div className="row g-2">
                                                <div className="col-md-3">
                                                    <select className="form-select form-select-custom"
                                                        onChange={e => setStreamData({ ...streamData, plataforma: e.target.value })}>
                                                        <option value="Twitch">Twitch (Directo)</option>
                                                        <option value="YouTube">YouTube (Vídeo)</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-7">
                                                    <input type="text" className="form-control form-control-custom"
                                                        placeholder="URL del canal o vídeo..."
                                                        onChange={e => setStreamData({ ...streamData, url: e.target.value })} />
                                                </div>
                                                <div className="col-md-2">
                                                    <button className="btn btn-accent w-100" onClick={handleAddStream}>AÑADIR</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* LISTADO DE STREAMS */}
                                    <div className="row">
                                        {tournament.streams?.length > 0 ? tournament.streams.map((s, i) => (
                                            <div key={i} className="col-md-6 mb-4">
                                                {/* Contenedor padre con posición relativa */}
                                                <div className="position-relative">
                                                    {/* El botón ahora está FUERA del div 'ratio' para que Bootstrap no lo expanda */}
                                                    {isOrganizer && (
                                                        <button
                                                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                                            style={{ zIndex: 10, border: '1px solid rgba(255,255,255,0.2)' }}
                                                            onClick={() => handleDeleteStream(i)}
                                                            title="Eliminar contenido"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    )}

                                                    {/* Solo el iframe debe estar dentro del div 'ratio' */}
                                                    <div className="ratio ratio-16x9 bg-black rounded overflow-hidden shadow">
                                                        <iframe
                                                            src={getEmbedURL(s)}
                                                            allowFullScreen
                                                            title={`Stream ${i}`}
                                                            style={{ border: 'none' }}
                                                        ></iframe>
                                                    </div>
                                                </div>

                                                <div className="mt-2 small text-dim d-flex justify-content-between px-1">
                                                    <span className="fw-bold text-white d-flex align-items-center">
                                                        {s.plataforma === 'Twitch' ? (
                                                            <i className="bi bi-twitch me-2" style={{ color: '#9146FF', fontSize: '1.2rem' }}></i>
                                                        ) : (
                                                            <i className="bi bi-youtube me-2 text-danger" style={{ fontSize: '1.2rem' }}></i>
                                                        )}
                                                        {s.plataforma}
                                                    </span>
                                                    <a href={s.url} target="_blank" rel="noreferrer" className="text-white-50 text-decoration-none hover-accent">
                                                        Ver en {s.plataforma} <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.7rem' }}></i>
                                                    </a>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-5 bg-dark-secondary rounded">
                                                <i className="bi bi-broadcast fs-1 text-dim mb-3"></i>
                                                <p className="text-dim">No hay contenido multimedia disponible aún.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ADMIN TAB */}
                            {activeTab === 'admin' && user?.rol === 'administrador' && (
                                <div className="admin-bots-tab text-white">
                                    <div className="p-4 bg-dark-secondary rounded shadow-sm mb-4">
                                        <h5 className="text-warning fw-bold text-uppercase mb-3">
                                            <i className="bi bi-robot me-2"></i>Relleno de Bots para Testing
                                        </h5>

                                        {tournament.estado !== 'Abierto' ? (
                                            <div className="alert alert-secondary py-2 small">
                                                Esta función solo está disponible cuando el torneo está en estado <strong>Abierto</strong>.
                                            </div>
                                        ) : (
                                            <>
                                                {/* Contador de slots */}
                                                {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? (
                                                    <p className="text-dim mb-3">
                                                        Equipos inscritos: <strong className="text-white">{tournament.equipos?.length || 0}</strong> / {tournament.limiteParticipantes}
                                                    </p>
                                                ) : (
                                                    <p className="text-dim mb-3">
                                                        Participantes inscritos: <strong className="text-white">{tournament.participantes?.length || 0}</strong> / {tournament.limiteParticipantes}
                                                    </p>
                                                )}

                                                <div className="d-flex gap-2 flex-wrap">
                                                    <button
                                                        className="btn btn-warning fw-bold btn-sm"
                                                        disabled={
                                                            ['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato)
                                                                ? (tournament.equipos?.length || 0) >= tournament.limiteParticipantes
                                                                : (tournament.participantes?.length || 0) >= tournament.limiteParticipantes
                                                        }
                                                        onClick={async () => {
                                                            try {
                                                                await tournamentService.addBot(id);
                                                                await fetchAll();
                                                            } catch (err) {
                                                                alert(err.response?.data?.msg || 'Error al añadir bot');
                                                            }
                                                        }}
                                                    >
                                                        <i className="bi bi-plus-circle me-1"></i>
                                                        {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? 'Añadir Equipo Bot' : 'Añadir Bot'}
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-danger fw-bold btn-sm"
                                                        onClick={async () => {
                                                            if (window.confirm('¿Eliminar todos los bots de este torneo?')) {
                                                                try {
                                                                    await tournamentService.clearBots(id);
                                                                    await fetchAll();
                                                                } catch (err) {
                                                                    alert(err.response?.data?.msg || 'Error al limpiar bots');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <i className="bi bi-trash me-1"></i>Limpiar Bots
                                                    </button>
                                                </div>

                                                {/* Vista previa de participantes/equipos con badge BOT */}
                                                <div className="mt-4">
                                                    {['Equipos', 'Battle Royale - Por equipos'].includes(tournament.formato) ? (
                                                        <>
                                                            <p className="text-dim small text-uppercase fw-bold mb-2">Equipos registrados:</p>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {tournament.equipos?.map(t => (
                                                                    <span key={t._id} className={`badge ${t.nombre?.startsWith('BotEquipo') ? 'bg-warning text-dark' : 'bg-secondary'} py-2 px-3`}>
                                                                        {t.nombre?.startsWith('BotEquipo') && '🤖 '}{t.nombre} ({t.miembros?.length || 0} miembros)
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-dim small text-uppercase fw-bold mb-2">Participantes registrados:</p>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {tournament.participantes?.map(p => (
                                                                    <span key={p._id} className={`badge ${p.isBot ? 'bg-warning text-dark' : 'bg-secondary'} py-2 px-3`}>
                                                                        {p.isBot && '🤖 '}{p.username}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DETALLES DEL PARTICIPANTE */}
            {
                selectedParticipant && (
                    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content bg-dark-secondary border border-accent shadow-lg">
                                <div className="modal-header border-bottom border-secondary">
                                    <h5 className="modal-title text-accent fw-bold text-uppercase">
                                        <i className="bi bi-person-lines-fill me-2"></i>Detalles de Participante
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedParticipant(null)}></button>
                                </div>
                                <div className="modal-body text-white">
                                    <div className="text-center mb-4 mt-2">
                                        <div className="display-1 text-accent mb-2"><i className="bi bi-person-circle"></i></div>
                                        <h3 className="fw-bold m-0 text-uppercase">{selectedParticipant.username}</h3>
                                        {selectedParticipant.isBot && <span className="badge bg-warning text-dark mt-2">🤖 BOT DE PRUEBA</span>}
                                        {selectedParticipant.isDeleted && <span className="badge bg-danger mt-2">Usuario Eliminado</span>}
                                    </div>
                                    <ul className="list-group list-group-flush bg-transparent">
                                        <li className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center py-3">
                                            <span className="text-dim"><i className="bi bi-geo-alt me-2 text-accent"></i>País:</span>
                                            <span className="fw-bold">{selectedParticipant.pais || 'Desconocido'}</span>
                                        </li>
                                        <li className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center py-3">
                                            <span className="text-dim"><i className="bi bi-translate me-2 text-accent"></i>Idiomas:</span>
                                            <span className="fw-bold text-end">
                                                {selectedParticipant.idioma && selectedParticipant.idioma.length > 0
                                                    ? selectedParticipant.idioma.map(lang => lang.toUpperCase()).join(', ')
                                                    : 'No especificado'}
                                            </span>
                                        </li>
                                        <li className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center py-3">
                                            <span className="text-dim"><i className="bi bi-calendar-check me-2 text-accent"></i>Edad:</span>
                                            <span className="fw-bold">
                                                {selectedParticipant.fechaNacimiento
                                                    ? `${new Date().getFullYear() - new Date(selectedParticipant.fechaNacimiento).getFullYear()} años`
                                                    : 'Ns / Nc'}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="modal-footer border-top border-secondary">
                                    <button type="button" className="btn btn-outline-light w-100 fw-bold" onClick={() => setSelectedParticipant(null)}>CERRAR</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL DE EQUIPOS */}
            {
                showTeamModal && (
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
                )
            }



            {/* MODAL PUNTUACION */}
            {
                scoreModal.isOpen && (
                    <div className="custom-modal-overlay" onClick={() => setScoreModal({ ...scoreModal, isOpen: false })}>
                        <div className="modal-content-team bg-dark-secondary rounded p-4 border border-accent" onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="text-white text-uppercase fw-bold m-0">Puntuación del Enfrentamiento</h4>
                                <button className="btn btn-outline-light btn-sm" onClick={() => setScoreModal({ ...scoreModal, isOpen: false })}>X</button>
                            </div>
                            <div className="text-white mb-4">
                                <div className="row g-3">
                                    <div className="col-5">
                                        <label className="form-label text-accent fw-bold small text-uppercase">{scoreModal.player1Name}</label>
                                        <input type="number" className="form-control form-control-custom text-center" placeholder="0" value={scoreModal.score1} onChange={e => setScoreModal({ ...scoreModal, score1: e.target.value })} />
                                    </div>
                                    <div className="col-2 d-flex align-items-center justify-content-center">
                                        <span className="fw-bold fs-5">-</span>
                                    </div>
                                    <div className="col-5">
                                        <label className="form-label text-accent fw-bold small text-uppercase">{scoreModal.player2Name}</label>
                                        <input type="number" className="form-control form-control-custom text-center" placeholder="0" value={scoreModal.score2} onChange={e => setScoreModal({ ...scoreModal, score2: e.target.value })} />
                                    </div>
                                </div>
                                <small className="text-dim d-block mt-3">* El ganador seleccionado debe tener una puntuación mayor.</small>
                            </div>
                            <div className="d-flex flex-column gap-2 mt-4">
                                <button className="btn btn-accent fw-bold" onClick={() => handleScoreSubmit(true)}>Aceptar Puntuación</button>
                                <button className="btn btn-outline-warning fw-bold" onClick={() => handleScoreSubmit(false)}>Continuar sin puntuar</button>
                                <button className="btn btn-outline-light fw-bold" onClick={() => setScoreModal({ ...scoreModal, isOpen: false })}>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TournamentDetails;