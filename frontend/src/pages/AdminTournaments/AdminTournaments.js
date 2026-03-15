import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import AdminTournamentsView from './AdminTournamentsView';

const AdminTournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();

    // Filtros
    const [filterName, setFilterName] = useState('');
    const [filterGame, setFilterGame] = useState('');
    const [filterFormat, setFilterFormat] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Paginación y selección
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingItem, setViewingItem] = useState(null);
    const [modalPage, setModalPage] = useState(1);
    const MODAL_ITEMS_PER_PAGE = 5;
    const modalBodyRef = useRef(null);

    const fetchTournaments = async () => {
        try {
            const data = await tournamentService.getTournaments();
            setTournaments(data);
        } catch (err) { console.error("Error obteniendo torneos", err); }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (viewingItem) setModalPage(1);
    }, [viewingItem]);

    useEffect(() => {
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTo(0, 0);
        }
    }, [modalPage]);

    const handleDelete = async (id, name) => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (window.confirm(`¿Seguro que quieres borrar el torneo "${name}" y todos sus datos de forma permanente? Esta acción no se puede deshacer.`)) {
            try {
                await tournamentService.deleteTournament(id);
                fetchTournaments();
                setSelectedIds(selectedIds.filter(i => i !== id));
            } catch (err) { alert(err.response?.data?.msg || "Error al borrar el torneo"); }
        }
    };

    // Selección
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredTournaments.map(t => t._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDeleteSelected = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} torneos seleccionados?`)) {
            try {
                await tournamentService.deleteTournamentsBulk(selectedIds);
                setSelectedIds([]);
                fetchTournaments();
                alert('Torneos eliminados');
            } catch (err) { alert('Error al eliminar en bloque'); }
        }
    };

    const handleDeleteAll = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (window.confirm('¡ATENCIÓN! Vas a borrar TODOS los torneos de la plataforma. ¿Estás absolutamente seguro?')) {
            if (window.confirm('Esta es la última advertencia. Se borrarán todos los registros asociados. ¿Proceder?')) {
                try {
                    const allIds = tournaments.map(t => t._id);
                    await tournamentService.deleteTournamentsBulk(allIds);
                    fetchTournaments();
                    alert('Todos los torneos han sido eliminados.');
                } catch (err) { alert('Error al borrar todo'); }
            }
        }
    };

    // Exportación
    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTournaments, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "torneos_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const exportToXML = () => {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<torneos>\n';
        filteredTournaments.forEach(t => {
            xmlContent += `  <torneo>\n    <id>${t._id}</id>\n    <nombre>${t.nombre}</nombre>\n    <juego>${t.juego?.nombre || 'N/A'}</juego>\n    <estado>${t.estado}</estado>\n  </torneo>\n`;
        });
        xmlContent += '</torneos>';

        const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "torneos_export.xml");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Filtrado
    const filteredTournaments = tournaments.filter(t => {
        const matchName = t.nombre.toLowerCase().includes(filterName.toLowerCase());
        const matchGame = t.juego?.nombre?.toLowerCase().includes(filterGame.toLowerCase()) ?? true;
        const matchFormat = filterFormat === '' ? true : t.formato === filterFormat;
        const matchStatus = filterStatus === '' ? true : t.estado === filterStatus;

        let matchDate = true;
        if (filterDate) {
            const tDate = new Date(t.fechaInicio).toISOString().split('T')[0];
            matchDate = tDate === filterDate;
        }

        return matchName && matchGame && matchFormat && matchStatus && matchDate;
    });

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTournaments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTournaments.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedIds([]);
    };

        return (
        <AdminTournamentsView
            navigate={navigate}
            isOnline={isOnline}
            filterName={filterName}
            setFilterName={setFilterName}
            filterGame={filterGame}
            setFilterGame={setFilterGame}
            filterFormat={filterFormat}
            setFilterFormat={setFilterFormat}
            filterDate={filterDate}
            setFilterDate={setFilterDate}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            selectedIds={selectedIds}
            viewingItem={viewingItem}
            setViewingItem={setViewingItem}
            modalPage={modalPage}
            setModalPage={setModalPage}
            MODAL_ITEMS_PER_PAGE={MODAL_ITEMS_PER_PAGE}
            modalBodyRef={modalBodyRef}
            filteredTournaments={filteredTournaments}
            currentItems={currentItems}
            totalPages={totalPages}
            handleDelete={handleDelete}
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            handleDeleteSelected={handleDeleteSelected}
            handleDeleteAll={handleDeleteAll}
            exportToJSON={exportToJSON}
            exportToXML={exportToXML}
            paginate={paginate}
        />
    );
};

export default AdminTournaments;
