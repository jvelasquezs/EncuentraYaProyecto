import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PLATAFORMAS_OPTIONS = [
  'Binance Pay', 'Pago Móvil', 'Zelle', 'PayPal', 'Reserve',
  'Zinli', 'Efectivo', 'Transferencia Bancaria', 'Mercado Pago'
];

const MONEDAS_OPTIONS = [
  'USDT', 'BTC', 'ETH', 'BNB', 'USD', 'BS', 'EUR', 'SOL', 'USDC', 'TRX'
];

const TagSelector = ({ label, options, selected, onChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const available = options.filter(opt => !selected.includes(opt));

  const addItem = (item) => {
    onChange([...selected, item]);
    setShowDropdown(false);
    setShowCustomInput(false);
    setCustomValue('');
  };

  const removeItem = (item) => {
    onChange(selected.filter(s => s !== item));
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      addItem(trimmed);
    }
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    }
    if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="tag-selector">
        <div className="tag-list">
          {selected.map(item => (
            <span key={item} className="tag-chip">
              {item}
              <button type="button" onClick={() => removeItem(item)} className="tag-chip-remove">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </span>
          ))}
        </div>
        <div className="tag-add-wrapper">
          <button type="button" className="tag-add-btn" onClick={() => { setShowDropdown(!showDropdown); setShowCustomInput(false); }}>
            <i className="fa-solid fa-plus"></i> Añadir
          </button>
          {showDropdown && (
            <div className="tag-dropdown">
              {available.map(opt => (
                <button type="button" key={opt} className="tag-dropdown-item" onClick={() => addItem(opt)}>
                  {opt}
                </button>
              ))}
              <div className="tag-dropdown-divider"></div>
              {!showCustomInput ? (
                <button type="button" className="tag-dropdown-item tag-dropdown-otro" onClick={() => setShowCustomInput(true)}>
                  <i className="fa-solid fa-pen"></i> Otro...
                </button>
              ) : (
                <div className="tag-custom-input-row">
                  <input
                    type="text"
                    className="tag-custom-input"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="Escribe aquí..."
                    autoFocus
                  />
                  <button type="button" className="tag-custom-confirm" onClick={handleCustomSubmit} disabled={!customValue.trim()}>
                    <i className="fa-solid fa-check"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    telefono: '',
    correo: '',
    password: '',
    descripcion: '',
    contacto_whatsapp: '',
    contacto_instagram: '',
  });
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
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
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
      formDataToSend.append('telefono', registerData.telefono);
      formDataToSend.append('correo', registerData.correo);
      formDataToSend.append('password', registerData.password);
      formDataToSend.append('descripcion', registerData.descripcion || '');
      formDataToSend.append('contacto_whatsapp', registerData.contacto_whatsapp || '');
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
                <input name="rif" value={registerData.rif} onChange={handleRegisterChange} placeholder="Ej: J-12345678-9" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Responsable *</label>
                <input name="responsable" value={registerData.responsable} onChange={handleRegisterChange} placeholder="Nombre del responsable" required />
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
                <input name="contacto_whatsapp" value={registerData.contacto_whatsapp} onChange={handleRegisterChange} placeholder="Ej: +584125551234" />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input name="contacto_instagram" value={registerData.contacto_instagram} onChange={handleRegisterChange} placeholder="@micomercio" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono *</label>
                <input name="telefono" value={registerData.telefono} onChange={handleRegisterChange} placeholder="+58 412-5551234" required />
              </div>
              <div className="form-group">
                <label>Correo *</label>
                <input name="correo" type="email" value={registerData.correo} onChange={handleRegisterChange} placeholder="correo@comercio.com" required />
              </div>
            </div>
            <div className="form-group">
              <label>Contraseña *</label>
              <input name="password" type="password" value={registerData.password} onChange={handleRegisterChange} placeholder="Mínimo 8 caracteres" minLength="8" required />
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
