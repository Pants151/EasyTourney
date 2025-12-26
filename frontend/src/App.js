import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import CreateTournament from './pages/CreateTournament';
import TournamentDetails from './pages/TournamentDetails';

// Componente Navbar interno para detectar el estado del usuario
const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div className="container">
                <Link className="navbar-brand" to="/">EasyTourney 🏆</Link>
                <div className="d-flex align-items-center">
                    {user ? (
                        <>
                            <Link className="btn btn-link text-light me-3" to="/create-tournament">Crear Torneo</Link>
                            <button onClick={logout} className="btn btn-danger btn-sm">Cerrar Sesión</button>
                        </>
                    ) : (
                        <>
                            <Link className="btn btn-outline-light me-2" to="/login">Login</Link>
                            <Link className="btn btn-primary" to="/register">Registro</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Navbar />
                <div className="container">
                    <Routes>
                        {/* Aquí es donde cargamos el componente Home en lugar de un h2 simple */}
                        <Route path="/" element={<Home />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/create-tournament" element={<CreateTournament />} />
                        <Route path="/tournament/:id" element={<TournamentDetails />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;