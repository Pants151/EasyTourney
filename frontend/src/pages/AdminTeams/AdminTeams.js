import React, { useEffect, useState, useContext, useRef } from 'react';
import teamService from '../../services/teamService';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import AdminTeamsView from './AdminTeamsView';

const AdminTeams = () => {
    const { user, loading } = useContext(AuthContext);
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [adminSearchTerm, setAdminSearchTerm] = useState("");

    // Paginación y selección
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewingItem, setViewingItem] = useState(null);
    const [modalPage, setModalPage] = useState(1);
    const MODAL_ITEMS_PER_PAGE = 5;
    const modalBodyRef = useRef(null);

    useEffect(() => {
        if (!loading && user?.rol !== 'administrador') {
            navigate('/');
        }
        fetchTeams();
    }, [user, loading, navigate]);

    useEffect(() => {
        if (viewingItem) setModalPage(1);
    }, [viewingItem]);

    useEffect(() => {
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTo(0, 0);
        }
    }, [modalPage]);

    const fetchTeams = async () => {
        try {
            const data = await teamService.getTeams();
            setTeams(data);
        } catch (err) { console.error(err); }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredTeams.map(t => t._id));
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
        if (window.confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} equipos seleccionados?`)) {
            try {
                await teamService.deleteTeamsBulk(selectedIds);
                setSelectedIds([]);
                fetchTeams();
                alert('Equipos eliminados');
            } catch (err) { alert('Error al eliminar en bloque'); }
        }
    };

    const handleDeleteAll = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (window.confirm('¡ATENCIÓN! Vas a borrar TODOS los equipos. ¿Estás seguro?')) {
            try {
                const allIds = teams.map(t => t._id);
                await teamService.deleteTeamsBulk(allIds);
                fetchTeams();
                alert('Todos los equipos han sido eliminados.');
            } catch (err) { alert('Error al borrar todo'); }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
            try {
                await teamService.deleteTeam(id);
                fetchTeams();
            } catch (err) { alert('Error al eliminar'); }
        }
    };

    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTeams, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "equipos_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const filteredTeams = teams.filter(t =>
        t.nombre?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        t.capitan?.username?.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTeams.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedIds([]);
    };

    return (
        <AdminTeamsView
            loading={loading}
            isOnline={isOnline}
            adminSearchTerm={adminSearchTerm}
            setAdminSearchTerm={setAdminSearchTerm}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            teams={teams}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            viewingItem={viewingItem}
            setViewingItem={setViewingItem}
            modalPage={modalPage}
            setModalPage={setModalPage}
            MODAL_ITEMS_PER_PAGE={MODAL_ITEMS_PER_PAGE}
            modalBodyRef={modalBodyRef}
            filteredTeams={filteredTeams}
            currentItems={currentItems}
            totalPages={totalPages}
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            handleDeleteSelected={handleDeleteSelected}
            handleDeleteAll={handleDeleteAll}
            handleDelete={handleDelete}
            exportToJSON={exportToJSON}
            paginate={paginate}
        />
    );
};

export default AdminTeams;
