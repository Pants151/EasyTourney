import React, { useEffect, useState, useContext, useRef } from 'react';
import matchService from '../../services/matchService';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import AdminMatchesView from './AdminMatchesView';

const AdminMatches = () => {
    const { user, loading } = useContext(AuthContext);
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
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
        fetchMatches();
    }, [user, loading, navigate]);

    useEffect(() => {
        if (viewingItem) setModalPage(1);
    }, [viewingItem]);

    useEffect(() => {
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTo(0, 0);
        }
    }, [modalPage]);

    const fetchMatches = async () => {
        try {
            const data = await matchService.getMatches();
            setMatches(data);
        } catch (err) { console.error(err); }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredMatches.map(m => m._id));
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
        if (window.confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} matches seleccionados?`)) {
            try {
                await matchService.deleteMatchesBulk(selectedIds);
                setSelectedIds([]);
                fetchMatches();
                alert('Matches eliminados');
            } catch (err) { alert('Error al eliminar en bloque'); }
        }
    };

    const handleDeleteAll = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (window.confirm('¡ATENCIÓN! Vas a borrar TODOS los matches. ¿Estás seguro?')) {
            try {
                const allIds = matches.map(m => m._id);
                await matchService.deleteMatchesBulk(allIds);
                fetchMatches();
                alert('Todos los matches han sido eliminados.');
            } catch (err) { alert('Error al borrar todo'); }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este match?')) {
            try {
                await matchService.deleteMatch(id);
                fetchMatches();
            } catch (err) { alert('Error al eliminar'); }
        }
    };

    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredMatches, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "matches_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const filteredMatches = matches.filter(m =>
        m.torneo?.nombre?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        m.jugador1?.username?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
        m.jugador2?.username?.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMatches.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedIds([]);
    };

    return (
        <AdminMatchesView
            loading={loading}
            isOnline={isOnline}
            adminSearchTerm={adminSearchTerm}
            setAdminSearchTerm={setAdminSearchTerm}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            matches={matches}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            viewingItem={viewingItem}
            setViewingItem={setViewingItem}
            modalPage={modalPage}
            setModalPage={setModalPage}
            MODAL_ITEMS_PER_PAGE={MODAL_ITEMS_PER_PAGE}
            modalBodyRef={modalBodyRef}
            filteredMatches={filteredMatches}
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

export default AdminMatches;
