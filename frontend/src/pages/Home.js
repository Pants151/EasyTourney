import React, { useEffect, useState } from 'react';
import tournamentService from '../services/tournamentService';
import { useNavigate } from 'react-router-dom'; // 1. Importar el hook

const Home = () => {
    const [tournaments, setTournaments] = useState([]);
    const navigate = useNavigate(); // 2. Definir navigate DENTRO del componente

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const data = await tournamentService.getTournaments();
                setTournaments(data);
            } catch (err) {
                console.error("Error al cargar torneos", err);
            }
        };
        fetchTournaments();
    }, []);

    const handleJoin = async (id) => {
        try {
            await tournamentService.joinTournament(id);
            alert('¡Te has inscrito correctamente!');
            const data = await tournamentService.getTournaments();
            setTournaments(data);
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al inscribirse. Asegúrate de estar logueado.');
        }
    };

    return (
        <div>
            <h2 className="mb-4 text-center">Torneos Disponibles</h2>
            <div className="row">
                {tournaments.length > 0 ? (
                    tournaments.map(t => (
                        <div className="col-md-4 mb-4" key={t._id}>
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title text-primary">{t.nombre}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">{t.juego}</h6>
                                    <p className="card-text">
                                        <strong>Participantes:</strong> {t.participantes.length}<br/>
                                        <strong>Modalidad:</strong> {t.modalidad}<br/>
                                        <strong>Fecha:</strong> {new Date(t.fechaInicio).toLocaleDateString()}
                                    </p>
                                    <div className="d-flex justify-content-between mt-3">
                                        {/* 3. Usar navigate para ir a los detalles */}
                                        <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => navigate(`/tournament/${t._id}`)}
                                        >
                                            Ver Detalles
                                        </button>
                                        
                                        <button 
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleJoin(t._id)}
                                        >
                                            Inscribirse
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center">No hay torneos disponibles en este momento.</p>
                )}
            </div>
        </div>
    );
};

export default Home;