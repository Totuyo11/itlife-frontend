import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

import Navbar from './Navbar';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import MisDatos from './MisDatos';
import Rutinas from './Rutinas';
import Ejercicios from './Ejercicios';
import Dashboard from './Dashboard'; // ✅ nuevo
import SeedAdminFirestore from './SeedAdminFirestore'; // opcional

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

        {/* 🔐 Privadas */}
        <Route path="/misdatos" element={<PrivateRoute><MisDatos /></PrivateRoute>} />
        <Route path="/rutina" element={<PrivateRoute><Rutinas /></PrivateRoute>} />
        <Route path="/ejercicios" element={<PrivateRoute><Ejercicios /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/seed-admin-fs" element={<PrivateRoute><SeedAdminFirestore /></PrivateRoute>} />
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
