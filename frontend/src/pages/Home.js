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

    const handleJoin = async (id) => {
        try {
            await tournamentService.joinTournament(id);
            alert('¡Te has inscrito correctamente!');
            // Recargamos la lista para actualizar el contador de participantes
            const data = await tournamentService.getTournaments();
            setTournaments(data);
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al inscribirse. Asegúrate de estar logueado.');
        }
    };

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
                                    <p><strong>Participantes:</strong> {t.participantes.length}</p>
                                    <button className="btn btn-outline-primary btn-sm me-2">Ver Detalles</button>
                                    {/* Botón de Inscripción */}
                                    <button 
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleJoin(t._id)}
                                    >
                                        Inscribirse
                                    </button>
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