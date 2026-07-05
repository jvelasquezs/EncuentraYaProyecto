import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <i className="fa-solid fa-layer-group"></i>
          Encuentra<span> Ya</span>
        </Link>

        <div className="nav-links">
          <a href="http://localhost:3000" className="nav-link">
            <i className="fa-solid fa-map-location-dot"></i> Mapa
          </a>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link nav-link-highlight">
                <i className="fa-solid fa-gauge-high"></i> Panel
              </Link>
              <span className="nav-user">
                <i className="fa-solid fa-store"></i> {user.nombreTienda || user.nombre}
              </span>
              <button onClick={logout} className="nav-btn-logout">
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Ingresar</Link>
              <Link to="/register" className="nav-link nav-link-cta">Registra tu Comercio</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
