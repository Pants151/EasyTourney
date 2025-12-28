import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TournamentDetails from './pages/TournamentDetails';
import CreateTournament from './pages/CreateTournament';
import AdminGames from './pages/AdminGames';
import TournamentsPage from './pages/TournamentsPage';
import ManageMyTournaments from './pages/ManageMyTournaments';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Usamos un div con flexbox para que el footer siempre esté abajo */}
        <div className="d-flex flex-column min-vh-100 bg-main">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              {/* Solo el Home NO lleva contenedor de Bootstrap para ser pantalla completa */}
              <Route path="/" element={<Home />} />
              
              {/* Las demás páginas SÍ llevan su propio contenedor para no verse raras */}
              <Route path="/login" element={<div className="container mt-navbar"><Login /></div>} />
              <Route path="/register" element={<div className="container mt-navbar"><Register /></div>} />
              <Route path="/tournament/:id" element={<div className="container mt-navbar"><TournamentDetails /></div>} />
              <Route path="/create-tournament" element={<div className="container mt-navbar"><CreateTournament /></div>} />
              <Route path="/admin/games" element={<div className="container mt-navbar"><AdminGames /></div>} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/manage-my-tournaments" element={<ManageMyTournaments />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;