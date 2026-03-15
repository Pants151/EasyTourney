import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tournamentService from '../../services/tournamentService';
import gameService from '../../services/gameService';
import EditTournamentView from './EditTournamentView';

const EditTournament = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [tournamentStatus, setTournamentStatus] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [errors, setErrors] = useState({});
    const [originalDate, setOriginalDate] = useState(''); // Guardamos la original
    const [formData, setFormData] = useState({
        nombre: '', juego: '', formato: '1v1', limiteParticipantes: 16,
        tamanoEquipoMax: 2, alMejorDe: 1, ubicacion: 'Online',
        fechaInicio: '', reglas: '', plataformas: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tData, gData] = await Promise.all([
                    tournamentService.getTournamentById(id),
                    gameService.getGames()
                ]);
                const dateObj = new Date(tData.fechaInicio);
                dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
                const formattedDate = dateObj.toISOString().slice(0, 16);
                setOriginalDate(formattedDate); // Guardar fecha inicial local
                setTournamentStatus(tData.estado);
                setFormData({
                    nombre: tData.nombre,
                    juego: tData.juego?._id || tData.juego,
                    formato: tData.formato,
                    limiteParticipantes: tData.limiteParticipantes,
                    tamanoEquipoMax: tData.tamanoEquipoMax || 2,
                    alMejorDe: tData.alMejorDe || 1,
                    ubicacion: tData.ubicacion,
                    fechaInicio: formattedDate,
                    reglas: tData.reglas || '',
                    plataformas: tData.plataformas || []
                });
                setGames(gData);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, [id]);

    const isLocked = tournamentStatus !== 'Borrador';

    const onUpdate = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setErrors({});

        let tempErrors = {};
        if (!formData.nombre.trim()) tempErrors.nombre = "El nombre es obligatorio";

        if (formData.fechaInicio !== originalDate && new Date(formData.fechaInicio) < new Date()) {
            tempErrors.fechaInicio = "La fecha no puede ser anterior a la actual";
        }

        if (Object.keys(tempErrors).length > 0) {
            setErrors(tempErrors);
            return;
        }

        try {
            await tournamentService.updateTournament(id, formData);
            alert("Torneo actualizado correctamente.");
            navigate('/manage-my-tournaments');
        } catch (err) {
            setSubmitError(err.response?.data?.msg || "Error al actualizar.");
        }
    };

        return (
        <EditTournamentView
            navigate={navigate}
            games={games}
            submitError={submitError}
            errors={errors}
            formData={formData}
            setFormData={setFormData}
            isLocked={isLocked}
            onUpdate={onUpdate}
        />
    );
};

export default EditTournament;
