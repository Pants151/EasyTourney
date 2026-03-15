import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import { AuthContext } from '../../context/AuthContext';
import TournamentDetailsView from './TournamentDetailsView';
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

    const handleAddBot = async () => {
        try {
            await tournamentService.addBot(id);
            await fetchAll();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al añadir bot');
        }
    };

    const handleClearBots = async () => {
        if (window.confirm('¿Eliminar todos los bots de este torneo?')) {
            try {
                await tournamentService.clearBots(id);
                await fetchAll();
            } catch (err) {
                alert(err.response?.data?.msg || 'Error al limpiar bots');
            }
        }
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
        <TournamentDetailsView
            navigate={navigate}
            tournament={tournament}
            matches={matches}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showTeamModal={showTeamModal}
            setShowTeamModal={setShowTeamModal}
            newTeamName={newTeamName}
            setNewTeamName={setNewTeamName}
            streamData={streamData}
            setStreamData={setStreamData}
            isGenerating={isGenerating}
            selectedParticipant={selectedParticipant}
            setSelectedParticipant={setSelectedParticipant}
            scoreModal={scoreModal}
            setScoreModal={setScoreModal}
            user={user}
            isOrganizer={isOrganizer}
            isAdmin={isAdmin}
            canRenameBots={canRenameBots}
            currentCount={currentCount}
            hasValidPowerOfTwo={hasValidPowerOfTwo}
            isBR={isBR}
            canStartTournament={canStartTournament}
            rounds={rounds}
            isJoined={isJoined}
            showJoinButton={showJoinButton}
            handleSetWinnerClick={handleSetWinnerClick}
            handleScoreSubmit={handleScoreSubmit}
            handleSetWinnerBR={handleSetWinnerBR}
            handlePublish={handlePublish}
            handleGenerateBrackets={handleGenerateBrackets}
            handleAdvanceRound={handleAdvanceRound}
            handleJoin={handleJoin}
            handleDisqualify={handleDisqualify}
            handleCancelTournament={handleCancelTournament}
            handleInscribirse={handleInscribirse}
            handleCreateTeam={handleCreateTeam}
            handleJoinTeam={handleJoinTeam}
            handleExpulsar={handleExpulsar}
            handleLeave={handleLeave}
            handleRespondMember={handleRespondMember}
            handleAddStream={handleAddStream}
            handleDeleteStream={handleDeleteStream}
            getEmbedURL={getEmbedURL}
            handleRenameBot={handleRenameBot}
            exportToPDF={exportToPDF}
            handleAddBot={handleAddBot}
            handleClearBots={handleClearBots}
        />
    );
};

export default TournamentDetails;