import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import SeedAdminFirestore from './SeedAdminFirestore';

import Navbar from './Navbar';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import MisDatos from './MisDatos';
import Rutinas from './Rutinas';
import Ejercicios from './Ejercicios'; 

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/misdatos" element={<PrivateRoute><MisDatos /></PrivateRoute>} />
        <Route path="/rutina" element={<PrivateRoute><Rutinas /></PrivateRoute>} />
        <Route path="/ejercicios" element={<PrivateRoute><Ejercicios /></PrivateRoute>} />
        <Route path="/seed-admin-fs" element={<SeedAdminFirestore />} /> {/* 👈 Ruta para admin */}
        <Route path="/seed-admin-fs" element={<PrivateRoute><SeedAdminFirestore/></PrivateRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
