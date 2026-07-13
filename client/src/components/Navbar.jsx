import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import { API_URL } from './constants';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <i className="fa-solid fa-layer-group"></i>
          Encuentra<span> Ya</span>
        </Link>

        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          <i className={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
        </button>

        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <a href={API_URL} className="nav-link" onClick={closeMenu}>
            <i className="fa-solid fa-map-location-dot"></i> Mapa
          </a>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link nav-link-highlight" onClick={closeMenu}>
                <i className="fa-solid fa-gauge-high"></i> Panel
              </Link>
              <span className="nav-user">
                <i className="fa-solid fa-store"></i> {user.nombreTienda || user.nombre}
              </span>
              <button onClick={handleLogout} className="nav-btn-logout" aria-label="Cerrar sesión">
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={closeMenu}>Ingresar</Link>
              <Link to="/register" className="nav-link nav-link-cta" onClick={closeMenu}>Registra tu Comercio</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
