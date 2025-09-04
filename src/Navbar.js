import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <span style={{ color: '#28a745', fontWeight: 'bold' }}>Fit</span><span style={{ color: '#dc3545' }}>Life</span>
      </div>
      <ul style={styles.navLinks}>
        <li><Link to="/" style={styles.link}>Inicio</Link></li>
        {user && (
          <>
            <li><Link to="/misdatos" style={styles.link}>Mis Datos</Link></li>
            <li><Link to="/rutina" style={styles.link}>Rutina</Link></li>
            <li><Link to="/ejercicios" style={styles.link}>Ejercicios</Link></li>
            <li><Link to="/dashboard" style={styles.link}>Dashboard</Link></li>
          </>
        )}
        {!user ? (
          <>
            <li><Link to="/login" style={styles.link}>Iniciar sesión</Link></li>
            <li><Link to="/register" style={styles.link}>Registrarse</Link></li>
          </>
        ) : (
          <li><button onClick={handleLogout} style={styles.logoutBtn}>Cerrar sesión</button></li>
        )}
      </ul>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#111',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  logo: {
    fontSize: '1.5rem'
  },
  navLinks: {
    display: 'flex',
    listStyle: 'none',
    gap: '1rem',
    margin: 0,
    padding: 0,
    alignItems: 'center'
  },
  link: {
    textDecoration: 'none',
    color: '#f8f9fa',
    fontWeight: 'bold',
    transition: 'color 0.3s',
  },
  logoutBtn: {
    backgroundColor: '#dc3545',
    border: 'none',
    color: '#fff',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default Navbar;
