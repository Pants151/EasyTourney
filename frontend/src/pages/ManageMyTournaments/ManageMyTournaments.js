/* frontend/src/pages/ManageMyTournaments.js */
import React, { useEffect, useState } from 'react';
import tournamentService from '../../services/tournamentService';
import { useNavigate } from 'react-router-dom';
import ManageMyTournamentsView from './ManageMyTournamentsView';

const ManageMyTournaments = () => {
    const [myTournaments, setMyTournaments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Carga inicial de mis torneos
        const fetchMyTournaments = async () => {
            try {
                const data = await tournamentService.getMyTournaments();
                setMyTournaments(data);
            } catch (err) {
                console.error("Error cargando tus torneos", err);
            }
        };
        fetchMyTournaments();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.')) {
            try {
                await tournamentService.deleteTournament(id);
                alert('Torneo eliminado');
                setMyTournaments(myTournaments.filter(t => t._id !== id));
            } catch (err) {
                alert('Error al eliminar');
            }
        }
    };

        return (
        <ManageMyTournamentsView
            myTournaments={myTournaments}
            navigate={navigate}
            handleDelete={handleDelete}
        />
    );
};

export default ManageMyTournaments;
