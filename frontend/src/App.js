import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import CreateTournament from './pages/CreateTournament';
import TournamentDetails from './pages/TournamentDetails';
import AdminGames from './pages/AdminGames';
import Footer from './components/Footer';

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
                            {user && user.rol === 'administrador' && (
                                <Link className="btn btn-link text-warning me-2" to="/admin/games">Gestionar Juegos</Link>
                            )}
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

// App.js corregido
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          {/* Eliminamos el div container mt-4 de aquí para que el Home sea full-width */}
          <main className="flex-grow-1"> 
            <Routes>
              <Route path="/" element={<Home />} />
              {/* Las demás rutas que sí necesiten contenedor lo llevarán dentro de su propio componente */}
              <Route path="/login" element={<div className="container mt-5"><Login /></div>} />
              <Route path="/register" element={<div className="container mt-5"><Register /></div>} />
              <Route path="/tournament/:id" element={<div className="container mt-5"><TournamentDetails /></div>} />
              <Route path="/create-tournament" element={<div className="container mt-5"><CreateTournament /></div>} />
              <Route path="/admin/games" element={<div className="container mt-5"><AdminGames /></div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;