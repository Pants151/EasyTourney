import React, { useEffect, useState } from 'react';
import tournamentService from '../services/tournamentService';

const Home = () => {
    const [tournaments, setTournaments] = useState([]);

    useEffect(() => {
        const fetchTournaments = async () => {
            const data = await tournamentService.getTournaments();
            setTournaments(data);
        };
        fetchTournaments();
    }, []);

    return (
        <div>
            <h2 className="mb-4">Torneos Disponibles</h2>
            <div className="row">
                {tournaments.length > 0 ? (
                    tournaments.map(t => (
                        <div className="col-md-4 mb-4" key={t._id}>
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title">{t.nombre}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">{t.juego}</h6>
                                    <p className="card-text">
                                        <strong>Modalidad:</strong> {t.modalidad}<br/>
                                        <strong>Fecha:</strong> {new Date(t.fechaInicio).toLocaleDateString()}
                                    </p>
                                    <button className="btn btn-outline-primary btn-sm">Ver Detalles</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No hay torneos disponibles en este momento.</p>
                )}
            </div>
        </div>
    );
};

export default Home;