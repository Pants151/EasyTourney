import React, { useState, useEffect } from 'react';
import tournamentService from '../../services/tournamentService';
import gameService from '../../services/gameService';
import { useNavigate } from 'react-router-dom';
import CreateTournamentView from './CreateTournamentView';

const CreateTournament = () => {
    const [games, setGames] = useState([]);
    // Función para obtener la fecha y hora actual en formato YYYY-MM-DDTHH:mm
    const getCurrentDateTimeLocal = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        nombre: '',
        juego: '',
        formato: '1v1',
        tamanoEquipoMax: 2,
        limiteParticipantes: 16,
        fechaInicio: getCurrentDateTimeLocal(), // Pre-rellenado con la fecha actual
        reglas: '',
        alMejorDe: 1
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGames = async () => {
            const data = await gameService.getGames();
            setGames(data);
        };
        fetchGames();
    }, []);

    const validate = () => {
        let tempErrors = {};
        if (!formData.nombre.trim()) tempErrors.nombre = "El nombre es obligatorio";
        if (!formData.fechaInicio) tempErrors.fechaInicio = "La fecha es obligatoria";
        else if (new Date(formData.fechaInicio) < new Date()) {
            tempErrors.fechaInicio = "La fecha no puede ser anterior a la actual";
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const onSubmit = async e => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;

        try {
            await tournamentService.createTournament(formData);
            navigate('/manage-my-tournaments');
        } catch (err) {
            setServerError(err.response?.data?.msg || 'Error al crear el torneo');
        }
    };

    return (
        <CreateTournamentView
            games={games}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            serverError={serverError}
            navigate={navigate}
            onSubmit={onSubmit}
        />
    );
};

export default CreateTournament;
