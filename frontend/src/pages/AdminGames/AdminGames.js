import React, { useEffect, useState, useContext, useRef } from 'react';
import gameService from '../../services/gameService';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import AdminGamesView from './AdminGamesView';

const AdminGames = () => {
    const { user, loading } = useContext(AuthContext);
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [adminSearchTerm, setAdminSearchTerm] = useState("");

    const availablePlatforms = ['PC', 'PS5', 'PS4', 'PS3', 'PS2', 'PS1', 'Xbox Series X/S', 'Xbox One', 'Xbox 360', 'Xbox', 'Nintendo Switch', 'Nintendo Switch 2', 'Nintendo 3DS', 'Nintendo DS', 'Wii', 'Wii U', 'Gamecube', 'Mobile'];

    const [formData, setFormData] = useState({
        nombre: '',
        plataformas: [],
        caratula: '',
        logo: '',
        header: ''
    });

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
        fetchGames();
    }, [user, loading, navigate]);

    useEffect(() => {
        if (viewingItem) setModalPage(1);
    }, [viewingItem]);

    useEffect(() => {
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTo(0, 0);
        }
    }, [modalPage]);

    const fetchGames = async () => {
        try {
            const data = await gameService.getGames();
            setGames(data);
        } catch (err) { console.error(err); }
    };

    // Selección
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredGames.map(g => g._id));
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

    // Borrado masivo
    const handleDeleteSelected = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} juegos seleccionados?`)) {
            try {
                await gameService.deleteGamesBulk(selectedIds);
                setSelectedIds([]);
                fetchGames();
                alert('Juegos eliminados');
            } catch (err) { alert('Error al eliminar en bloque'); }
        }
    };

    const handleDeleteAll = async () => {
        if (!isOnline) return alert('No puedes realizar esta acción sin conexión');
        if (window.confirm('¡ATENCIÓN! Vas a borrar TODOS los juegos de la base de datos. ¿Estás absolutamente seguro?')) {
            if (window.confirm('Esta es la última advertencia. Se borrarán todos los registros de juegos. ¿Proceder?')) {
                try {
                    const allIds = games.map(g => g._id);
                    await gameService.deleteGamesBulk(allIds);
                    fetchGames();
                    alert('Todos los juegos han sido eliminados.');
                } catch (err) { alert('Error al borrar todo'); }
            }
        }
    };

    // Exportación
    const exportToJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredGames, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "juegos_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const exportToXML = () => {
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<juegos>\n';
        filteredGames.forEach(g => {
            xmlContent += `  <juego>\n    <id>${g._id}</id>\n    <nombre>${g.nombre}</nombre>\n    <plataformas>${g.plataformas.join(', ')}</plataformas>\n  </juego>\n`;
        });
        xmlContent += '</juegos>';

        const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "juegos_export.xml");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };


    const handlePlatformSelect = (e) => {
        const value = e.target.value;
        if (value && !formData.plataformas.includes(value)) {
            setFormData({
                ...formData,
                plataformas: [...formData.plataformas, value]
            });
        }
        e.target.value = "";
    };

    const removePlatform = (plat) => {
        setFormData({
            ...formData,
            plataformas: formData.plataformas.filter(p => p !== plat)
        });
    };

    const handleEdit = (game) => {
        setEditingId(game._id);
        setFormData({
            nombre: game.nombre,
            plataformas: game.plataformas,
            caratula: game.caratula,
            logo: game.logo,
            header: game.header
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este juego?')) {
            try {
                await gameService.deleteGame(id);
                fetchGames();
            } catch (err) {
                alert('Error al eliminar');
            }
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (formData.plataformas.length === 0) return alert("Selecciona al menos una plataforma.");

        try {
            if (editingId) {
                await gameService.updateGame(editingId, formData);
                setEditingId(null);
            } else {
                await gameService.createGame(formData);
            }
            setFormData({ nombre: '', plataformas: [], caratula: '', logo: '', header: '' });
            fetchGames();
            alert('¡Operación exitosa!');
        } catch (err) {
            alert('Error en la operación');
        }
    };

    const filteredGames = games.filter(g =>
        g.nombre.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredGames.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGames.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        setSelectedIds([]);
    };

    return (
        <AdminGamesView
            loading={loading}
            isOnline={isOnline}
            adminSearchTerm={adminSearchTerm}
            setAdminSearchTerm={setAdminSearchTerm}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            games={games}
            formData={formData}
            setFormData={setFormData}
            availablePlatforms={availablePlatforms}
            editingId={editingId}
            setEditingId={setEditingId}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            viewingItem={viewingItem}
            setViewingItem={setViewingItem}
            modalPage={modalPage}
            setModalPage={setModalPage}
            MODAL_ITEMS_PER_PAGE={MODAL_ITEMS_PER_PAGE}
            modalBodyRef={modalBodyRef}
            onSubmit={onSubmit}
            handlePlatformSelect={handlePlatformSelect}
            removePlatform={removePlatform}
            filteredGames={filteredGames}
            currentItems={currentItems}
            totalPages={totalPages}
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            handleDeleteSelected={handleDeleteSelected}
            handleDeleteAll={handleDeleteAll}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            exportToJSON={exportToJSON}
            exportToXML={exportToXML}
            paginate={paginate}
        />
    );
};

export default AdminGames;
