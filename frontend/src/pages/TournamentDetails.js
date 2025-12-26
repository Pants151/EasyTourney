import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import tournamentService from '../services/tournamentService';

const TournamentDetails = () => {
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);

    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const data = await tournamentService.getTournamentById(id);
                setTournament(data);
            } catch (err) {
                console.error("Error al cargar el torneo", err);
            }
        };
        fetchTournament();
    }, [id]);

    if (!tournament) return <div className="text-center mt-5">Cargando detalles del torneo...</div>;

    return (
        <div className="container">
            <div className="card shadow-sm p-4">
                <h1 className="display-4 text-primary">{tournament.nombre}</h1>
                <hr />
                <div className="row">
                    <div className="col-md-8">
                        <h4>Información General</h4>
                        <p><strong>Juego:</strong> {tournament.juego}</p>
                        <p><strong>Modalidad:</strong> {tournament.modalidad}</p>
                        <p><strong>Organizador:</strong> {tournament.organizador?.username}</p>
                        <p><strong>Fecha de Inicio:</strong> {new Date(tournament.fechaInicio).toLocaleString()}</p>
                        <p><strong>Reglas:</strong></p>
                        <div className="bg-light p-3 rounded">{tournament.reglas || "Sin reglas especificadas."}</div>
                    </div>
                    <div className="col-md-4">
                        <h4>Participantes ({tournament.participantes.length})</h4>
                        <ul className="list-group">
                            {tournament.participantes.map(p => (
                                <li key={p._id} className="list-group-item">{p.username}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            
            {/* Espacio para los Brackets - Lo haremos en el siguiente paso */}
            <div className="mt-5 text-center p-5 border border-dashed rounded text-muted">
                <h4>Área de Brackets</h4>
                <p>Aquí se generarán los enfrentamientos próximamente.</p>
            </div>
        </div>
    );
};

export default TournamentDetails;