import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import Account from './pages/Account/Account';
import TournamentDetails from './pages/TournamentDetails/TournamentDetails';
import CreateTournament from './pages/CreateTournament/CreateTournament';
import AdminGames from './pages/AdminGames/AdminGames';
import TournamentsPage from './pages/TournamentsPage/TournamentsPage';
import ManageMyTournaments from './pages/ManageMyTournaments/ManageMyTournaments';
import EditTournament from './pages/EditTournament/EditTournament';
import AdminTournaments from './pages/AdminTournaments/AdminTournaments';
import GamesPage from './pages/GamesPage/GamesPage';
import AdminUsers from './pages/AdminUsers/AdminUsers';
import AboutUs from './pages/AboutUs/AboutUs';
import ContactUs from './pages/ContactUs/ContactUs';
import AdminEditUser from './pages/AdminEditUser/AdminEditUser';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Flexbox para empujar el footer abajo */}
        <div className="d-flex flex-column min-vh-100 bg-main">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              {/* Home sin contenedor (pantalla completa) */}
              <Route path="/" element={<Home />} />

              {/* Vistas estándar con margen superior */}
              <Route path="/login" element={<div className="container mt-navbar"><Login /></div>} />
              <Route path="/register" element={<div className="container mt-navbar"><Register /></div>} />
              <Route path="/forgot-password" element={<div className="container mt-navbar"><ForgotPassword /></div>} />
              <Route path="/reset-password/:token" element={<div className="container mt-navbar"><ResetPassword /></div>} />
              <Route path="/account" element={<Account />} />
              <Route path="/tournament/:id" element={<div className="container mt-navbar"><TournamentDetails /></div>} />
              <Route path="/create-tournament" element={<div className="container mt-navbar"><CreateTournament /></div>} />
              <Route path="/admin/games" element={<div className="container mt-navbar"><AdminGames /></div>} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/manage-my-tournaments" element={<ManageMyTournaments />} />
              <Route path="/edit-tournament/:id" element={<div className="container mt-navbar"><EditTournament /></div>} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/admin-users" element={<AdminUsers />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/admin/tournaments" element={<AdminTournaments />} />
              <Route path="/admin/edit-user/:id" element={<AdminEditUser />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;