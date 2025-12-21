import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
            <div className="container">
                <Link className="navbar-brand" to="/">EasyTourney 🏆</Link>
                <div>
                    {user ? (
                        <button onClick={logout} className="btn btn-danger">Cerrar Sesión</button>
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
                        <Route path="/" element={<h2 className="text-center">¡Bienvenido a la plataforma!</h2>} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;