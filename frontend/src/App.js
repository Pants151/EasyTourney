import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="container mt-5">
        <h1 className="text-center">Bienvenido a EasyTourney 🏆</h1>
        <Routes>
          <Route path="/" element={<h2>Página de Inicio</h2>} />
          {/* Aquí añadiremos más rutas pronto */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;