import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { TagSelector } from './TagSelector';
import { PLATAFORMAS_OPTIONS, MONEDAS_OPTIONS } from './constants';

const Navbar = () => {
  const { user, logout, setUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoLightbox, setShowLogoLightbox] = useState(false);

  // Profile edit states
  const [nombreTienda, setNombreTienda] = useState('');
  const [responsable, setResponsable] = useState('');
  const [rif, setRif] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contactoWhatsappNumber, setContactoWhatsappNumber] = useState('');
  const [contactoWhatsappPrefix, setContactoWhatsappPrefix] = useState('0412');
  const [contactoInstagram, setContactoInstagram] = useState('');
  const [correo, setCorreo] = useState('');
  
  // Tag selectors
  const [selectedPlataformas, setSelectedPlataformas] = useState([]);
  const [selectedMonedas, setSelectedMonedas] = useState([]);

  // Logo file and preview
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error/Success messages inside modal
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  const openProfileModal = async () => {
    if (!user) return;
    setModalError('');
    setModalSuccess('');
    
    try {
      const API_URL = 'http://localhost:3000';
      const { data } = await axios.get(`${API_URL}/api/comercios/perfil`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setNombreTienda(data.nombreTienda || '');
      setResponsable(data.responsable || '');
      setRif(data.rif || '');
      setDescripcion(data.descripcion || '');
      
      if (data.contacto_whatsapp && data.contacto_whatsapp.startsWith('+58')) {
        const numberWithoutCountry = data.contacto_whatsapp.substring(3);
        const prefix = '0' + numberWithoutCountry.substring(0, 3);
        const number = numberWithoutCountry.substring(3);
        setContactoWhatsappPrefix(prefix);
        setContactoWhatsappNumber(number);
      } else {
        setContactoWhatsappPrefix('0412');
        setContactoWhatsappNumber('');
      }

      setContactoInstagram(data.contacto_instagram || '');
      setCorreo(data.correo || '');
      setSelectedPlataformas(data.plataformas || []);
      setSelectedMonedas(data.monedas || []);
      setLogoPreview(data.logo || '');
      setLogoFile(null);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setShowProfileModal(true);
    } catch (err) {
      alert('Error al cargar el perfil del comercio.');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!nombreTienda || !responsable || !rif || !correo) {
      setModalError('Nombre, Responsable, RIF y Correo son obligatorios.');
      return;
    }

    if (rif.length !== 10) {
      setModalError('El RIF debe tener exactamente 10 dígitos.');
      return;
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(responsable)) {
      setModalError('El nombre del responsable solo debe contener letras y espacios.');
      return;
    }

    if (contactoWhatsappNumber && contactoWhatsappNumber.length !== 7) {
      setModalError('El número de WhatsApp debe tener exactamente 7 dígitos.');
      return;
    }

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setModalError('Para cambiar la contraseña, debes ingresar la contraseña actual, la nueva y confirmarla.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setModalError('La nueva contraseña y su confirmación no coinciden.');
        return;
      }
      if (newPassword.length < 8) {
        setModalError('La nueva contraseña debe tener al menos 8 caracteres.');
        return;
      }
    }

    setModalLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombreTienda', nombreTienda);
      formDataToSend.append('responsable', responsable);
      formDataToSend.append('rif', rif);
      formDataToSend.append('correo', correo);
      formDataToSend.append('descripcion', descripcion || '');
      formDataToSend.append('contacto_instagram', contactoInstagram || '');
      formDataToSend.append('contacto_whatsapp', contactoWhatsappNumber ? `+58${contactoWhatsappPrefix.substring(1)}${contactoWhatsappNumber}` : '');
      formDataToSend.append('plataformas', JSON.stringify(selectedPlataformas));
      formDataToSend.append('monedas', JSON.stringify(selectedMonedas));

      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      if (currentPassword) {
        formDataToSend.append('currentPassword', currentPassword);
        formDataToSend.append('newPassword', newPassword);
        formDataToSend.append('confirmPassword', confirmPassword);
      }

      const API_URL = 'http://localhost:3000';
      const { data } = await axios.put(`${API_URL}/api/comercios/perfil`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${user.token}`
        }
      });

      localStorage.setItem('loggedUser', JSON.stringify(data.user));
      setUser(data.user);

      setModalSuccess('¡Perfil actualizado con éxito!');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLogoFile(null);

      setTimeout(() => {
        setShowProfileModal(false);
      }, 1500);

    } catch (err) {
      setModalError(err.response?.data?.error || 'Error al actualizar el perfil.');
    } finally {
      setModalLoading(false);
    }
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
          <a href="http://localhost:3000/mapa" className="nav-link" onClick={closeMenu}>
            <i className="fa-solid fa-map-location-dot"></i> Mapa
          </a>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link nav-link-highlight" onClick={closeMenu}>
                <i className="fa-solid fa-gauge-high"></i> Panel
              </Link>
              <span className="nav-user" onClick={openProfileModal} style={{ cursor: 'pointer' }} title="Editar Perfil">
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

      {showProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3><i className="fa-solid fa-user-gear"></i> Editar Perfil de Comercio</h3>
              <button className="profile-modal-close-btn" onClick={() => setShowProfileModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleProfileSubmit}>
              <div className="profile-modal-body">
                {modalError && <div className="dash-msg status-active" style={{ background: 'rgba(255, 74, 107, 0.1)', color: 'var(--crypt-danger)', borderColor: 'rgba(255, 74, 107, 0.2)', padding: '10px', borderRadius: '6px', marginBottom: '16px', border: '1px solid' }}>{modalError}</div>}
                {modalSuccess && <div className="dash-msg" style={{ background: 'rgba(0, 255, 163, 0.1)', color: 'var(--crypt-green)', borderColor: 'rgba(0, 255, 163, 0.2)', padding: '10px', borderRadius: '6px', marginBottom: '16px', border: '1px solid' }}>{modalSuccess}</div>}

                {/* LOGO SECTION */}
                <div className="profile-logo-section">
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="profile-logo-preview" 
                    style={{ cursor: 'pointer' }} 
                    title="Ver imagen completa" 
                    onClick={() => setShowLogoLightbox(true)} 
                    onError={(e) => e.target.src = 'https://via.placeholder.com/80/1e293b/00ffa3?text=LOGO'} 
                  />
                  <div className="profile-logo-info">
                    <label className="profile-logo-upload-btn">
                      Cambiar Logo
                      <input type="file" onChange={handleLogoChange} accept="image/*" style={{ display: 'none' }} />
                    </label>
                    <span>Formatos permitidos: JPG, PNG, WEBP. Máx: 5MB</span>
                  </div>
                </div>

                {/* BASIC DATA */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre del Comercio *</label>
                    <input type="text" value={nombreTienda} onChange={(e) => setNombreTienda(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>RIF *</label>
                    <input 
                      type="text" 
                      value={rif} 
                      onChange={(e) => setRif(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      maxLength={10} 
                      minLength={10} 
                      pattern="[0-9]{10}"
                      title="El RIF debe tener exactamente 10 dígitos numéricos" 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Responsable *</label>
                    <input 
                      type="text" 
                      value={responsable} 
                      onChange={(e) => setResponsable(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, ''))} 
                      pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+" 
                      title="El nombre del responsable solo debe contener letras y espacios" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Correo *</label>
                    <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select 
                        value={contactoWhatsappPrefix} 
                        onChange={(e) => setContactoWhatsappPrefix(e.target.value)}
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
                        value={contactoWhatsappNumber} 
                        onChange={(e) => setContactoWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 7))}
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
                    <input type="text" value={contactoInstagram} onChange={(e) => setContactoInstagram(e.target.value)} placeholder="@micomercio" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción del Comercio</label>
                  <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿Qué ofrece tu comercio?" rows="2" />
                </div>

                {/* METODOS DE PAGO */}
                <div className="form-section-title" style={{ marginTop: '20px' }}>
                  <i className="fa-solid fa-wallet"></i> Métodos de Pago
                </div>
                <div className="form-row">
                  <TagSelector label="Pasarelas / Canales Aceptados" options={PLATAFORMAS_OPTIONS} selected={selectedPlataformas} onChange={setSelectedPlataformas} />
                  <TagSelector label="Monedas / Divisas Aceptadas" options={MONEDAS_OPTIONS} selected={selectedMonedas} onChange={setSelectedMonedas} />
                </div>

                {/* PASSWORD CHANGE */}
                <div className="password-change-box">
                  <div className="password-change-title">
                    <i className="fa-solid fa-key"></i> Cambiar Contraseña (Opcional)
                  </div>
                  <div className="form-group">
                    <label>Contraseña Actual</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Ingresa tu contraseña actual" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nueva Contraseña</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength="8" />
                    </div>
                    <div className="form-group">
                      <label>Confirmar Nueva Contraseña</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirma tu nueva contraseña" minLength="8" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="profile-modal-footer">
                <button type="button" className="dash-btn dash-btn-danger" onClick={() => setShowProfileModal(false)} disabled={modalLoading}>
                  Cancelar
                </button>
                <button type="submit" className="dash-btn dash-btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogoLightbox && (
        <div className="lightbox-overlay" onClick={() => setShowLogoLightbox(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setShowLogoLightbox(false)}>&times;</button>
            <img src={logoPreview} alt="Logo completo" className="lightbox-image" onError={(e) => e.target.src = 'https://via.placeholder.com/300/1e293b/00ffa3?text=LOGO'} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
