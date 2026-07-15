import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import { TagSelector } from '../components/TagSelector';
import { PLATAFORMAS_OPTIONS, MONEDAS_OPTIONS } from '../components/constants';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useContext(AuthContext);

  const isLogin = location.pathname === '/login';

  // State for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State for registration
  const [registerData, setRegisterData] = useState({
    nombreTienda: '',
    responsable: '',
    rif: '',
    correo: '',
    password: '',
    descripcion: '',
    contacto_instagram: '',
  });
  const [wsPrefix, setWsPrefix] = useState('0412');
  const [wsNumber, setWsNumber] = useState('');
  const [selectedPlataformas, setSelectedPlataformas] = useState([]);
  const [selectedMonedas, setSelectedMonedas] = useState([]);
  const [logoFile, setLogoFile] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInhabilitado, setIsInhabilitado] = useState(false);

  // Clear errors when changing tab
  useEffect(() => {
    setError('');
    setSuccess('');
    setIsInhabilitado(false);
  }, [isLogin]);

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rif') {
      const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
      setRegisterData({ ...registerData, [name]: cleanedValue });
    } else if (name === 'responsable') {
      const cleanedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      setRegisterData({ ...registerData, [name]: cleanedValue });
    } else {
      setRegisterData({ ...registerData, [name]: value });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.error === 'inhabilitado') {
        setIsInhabilitado(true);
      } else {
        setError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (registerData.rif.length !== 10) {
      setError('El RIF debe tener exactamente 10 dígitos.');
      return;
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(registerData.responsable)) {
      setError('El nombre del responsable solo debe contener letras y espacios.');
      return;
    }

    if (wsNumber && wsNumber.length !== 7) {
      setError('El número de WhatsApp debe tener exactamente 7 dígitos.');
      return;
    }

    if (registerData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombreTienda', registerData.nombreTienda);
      formDataToSend.append('responsable', registerData.responsable);
      formDataToSend.append('rif', registerData.rif);
      formDataToSend.append('correo', registerData.correo);
      formDataToSend.append('password', registerData.password);
      formDataToSend.append('descripcion', registerData.descripcion || '');
      formDataToSend.append('contacto_whatsapp', wsNumber ? `+58${wsPrefix.substring(1)}${wsNumber}` : '');
      formDataToSend.append('contacto_instagram', registerData.contacto_instagram || '');
      formDataToSend.append('plataformas', JSON.stringify(selectedPlataformas));
      formDataToSend.append('monedas', JSON.stringify(selectedMonedas));
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      await register(formDataToSend);
      setSuccess('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el comercio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card ${!isLogin && !isInhabilitado ? 'auth-card-wide' : ''}`}>
        
        {/* TAB NAVIGATION */}
        {!isInhabilitado && (
          <div className="auth-tabs">
            <button 
              type="button" 
              className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => navigate('/login')}
            >
              <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
            </button>
            <button 
              type="button" 
              className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => navigate('/register')}
            >
              <i className="fa-solid fa-store"></i> Registrar Comercio
            </button>
          </div>
        )}

        {!isInhabilitado && (
          <div className="auth-header" style={{ marginTop: '20px' }}>
            <div className="auth-icon">
              <i className={isLogin ? "fa-solid fa-lock" : "fa-solid fa-rocket"}></i>
            </div>
            <h2>{isLogin ? 'Acceso Comercio' : 'Registra tu Comercio'}</h2>
            <p>
              {isLogin 
                ? 'Ingresa al panel para actualizar tus productos y ubicación' 
                : 'Completa los datos de tu negocio para aparecer en Encuentra Ya'}
            </p>
          </div>
        )}

        {error && <div className="auth-error"><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}
        {success && <div className="auth-success" style={{
          background: 'rgba(0, 255, 163, 0.1)',
          color: 'var(--crypt-green)',
          border: '1px solid rgba(0, 255, 163, 0.2)',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}><i className="fa-solid fa-circle-check"></i> {success}</div>}

        {isInhabilitado ? (
          <div className="auth-inhabilitado-view">
            <div className="inhabilitado-icon">
              <i className="fa-solid fa-user-slash"></i>
            </div>
            <h3>Cuenta Inhabilitada</h3>
            <p>
              Lo sentimos, pero tu cuenta de comercio ha sido temporalmente inhabilitada por el administrador.
            </p>
            <p className="inhabilitado-subtext">
              Si crees que esto es un error o deseas reactivar tu cuenta, ponte en contacto directo con soporte técnico.
            </p>
            <button 
              type="button" 
              className="dash-btn dash-btn-primary" 
              style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
              onClick={() => setIsInhabilitado(false)}
            >
              Volver a Intentar
            </button>
          </div>
        ) : isLogin ? (
          /* --- LOGIN FORM --- */
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <div className="input-icon-wrapper">
                <i className="fa-solid fa-envelope"></i>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="comercio@correo.com"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-icon-wrapper">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar al Panel'}
            </button>
          </form>
        ) : (
          /* --- REGISTER FORM --- */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-section-title">
              <i className="fa-solid fa-building"></i> Datos del Comercio
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Comercio *</label>
                <input name="nombreTienda" value={registerData.nombreTienda} onChange={handleRegisterChange} placeholder="Ej: Tech Hub Venezuela" required />
              </div>
              <div className="form-group">
                <label>RIF *</label>
                <input 
                  type="text"
                  name="rif" 
                  value={registerData.rif} 
                  onChange={handleRegisterChange} 
                  placeholder="Ej: 1234567890" 
                  maxLength={10} 
                  minLength={10} 
                  pattern="[0-9]{10}" 
                  title="El RIF debe tener exactamente 10 dígitos numéricos" 
                  required 
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Responsable *</label>
                <input 
                  type="text"
                  name="responsable" 
                  value={registerData.responsable} 
                  onChange={handleRegisterChange} 
                  placeholder="Nombre del responsable" 
                  pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+" 
                  title="El nombre del responsable solo debe contener letras y espacios" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Logo del Comercio (Opcional)</label>
                <input 
                  type="file" 
                  name="logo" 
                  onChange={(e) => setLogoFile(e.target.files[0])} 
                  accept="image/*" 
                  style={{ padding: '8px 12px' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción del Comercio</label>
              <textarea name="descripcion" value={registerData.descripcion} onChange={handleRegisterChange} placeholder="¿Qué ofrece tu comercio?" rows="2" />
            </div>

            <div className="form-section-title">
              <i className="fa-solid fa-wallet"></i> Métodos de Pago
            </div>
            <div className="form-row">
              <div className="form-group">
                <TagSelector label="Pasarelas / Canales Aceptados" options={PLATAFORMAS_OPTIONS} selected={selectedPlataformas} onChange={setSelectedPlataformas} />
              </div>
              <div className="form-group">
                <TagSelector label="Monedas / Divisas Aceptadas" options={MONEDAS_OPTIONS} selected={selectedMonedas} onChange={setSelectedMonedas} />
              </div>
            </div>

            <div className="form-section-title">
              <i className="fa-solid fa-address-book"></i> Datos de Contacto
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>WhatsApp</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={wsPrefix} 
                    onChange={(e) => setWsPrefix(e.target.value)}
                    style={{ width: '110px', flexShrink: 0 }}
                  >
                    <option value="0412">0412</option>
                    <option value="0414">0414</option>
                    <option value="0416">0416</option>
                    <option value="0422">0422</option>
                    <option value="0424">0424</option>
                    <option value="0426">0426</option>
                  </select>
                  <input 
                    type="text" 
                    value={wsNumber} 
                    onChange={(e) => setWsNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    placeholder="5551234" 
                    maxLength={7}
                    pattern="[0-9]{7}"
                    title="El número de WhatsApp debe tener 7 dígitos"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input name="contacto_instagram" value={registerData.contacto_instagram} onChange={handleRegisterChange} placeholder="@micomercio" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Correo *</label>
                <input name="correo" type="email" value={registerData.correo} onChange={handleRegisterChange} placeholder="correo@comercio.com" required />
              </div>
              <div className="form-group">
                <label>Contraseña *</label>
                <input name="password" type="password" value={registerData.password} onChange={handleRegisterChange} placeholder="Mínimo 8 caracteres" minLength="8" required />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar Comercio'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <a href="http://localhost:3000" className="map-link">
            <i className="fa-solid fa-map-location-dot"></i> Volver a Encuentra Ya
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
