import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { TagSelector } from '../components/TagSelector';
import { PLATAFORMAS_OPTIONS, MONEDAS_OPTIONS } from '../components/constants';

const API_URL = 'http://localhost:3000';

// Componente de gráfica de dona SVG puro
const DonutChart = ({ comercios, administradores }) => {
  const total = comercios + administradores;
  if (total === 0) return null;

  const comercioPct = (comercios / total) * 100;
  const adminPct = (administradores / total) * 100;

  // SVG donut usando stroke-dasharray
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const comercioDash = (comercioPct / 100) * circumference;
  const adminDash = (adminPct / 100) * circumference;

  return (
    <div className="donut-chart-container">
      <svg viewBox="0 0 200 200" className="donut-svg">
        {/* Comercios arc */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="#00ffa3"
          strokeWidth="28"
          strokeDasharray={`${comercioDash} ${circumference - comercioDash}`}
          strokeDashoffset={circumference * 0.25}
          className="donut-segment"
        />
        {/* Administradores arc */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="#00b8ff"
          strokeWidth="28"
          strokeDasharray={`${adminDash} ${circumference - adminDash}`}
          strokeDashoffset={circumference * 0.25 - comercioDash}
          className="donut-segment"
        />
        {/* Centro */}
        <text x="100" y="92" textAnchor="middle" className="donut-center-number">{total}</text>
        <text x="100" y="115" textAnchor="middle" className="donut-center-label">Total</text>
      </svg>
      <div className="donut-legend">
        <div className="donut-legend-item">
          <span className="donut-legend-dot" style={{ background: '#00ffa3' }}></span>
          <span>Comercios <strong>{comercios}</strong></span>
        </div>
        <div className="donut-legend-item">
          <span className="donut-legend-dot" style={{ background: '#00b8ff' }}></span>
          <span>Administradores <strong>{administradores}</strong></span>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [showAddStore, setShowAddStore] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [newStore, setNewStore] = useState({
    nombreTienda: '', responsable: '', rif: '', telefono: '',
    correo: '', password: '', descripcion: '',
    contacto_whatsapp: '', contacto_instagram: '',
    rol: 'Comercio'
  });
  const [selectedPlataformas, setSelectedPlataformas] = useState([]);
  const [selectedMonedas, setSelectedMonedas] = useState([]);
  const [logoFile, setLogoFile] = useState(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${user.token}` }
  });

  const getAuthMultipartHeaders = () => ({
    headers: { 
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  const loadStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStats(data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, [user.token]);

  const loadStores = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/stores`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStores(data);
    } catch (err) {
      console.error('Error cargando comercios:', err);
    }
  }, [user.token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
    loadStores();
  }, [loadStats, loadStores]);

  const handleNewStoreChange = (e) => {
    setNewStore({ ...newStore, [e.target.name]: e.target.value });
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (newStore.password.length < 8) {
      setMsg({ text: 'La contraseña debe tener al menos 8 caracteres.', type: 'error' });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombreTienda', newStore.nombreTienda);
      formDataToSend.append('responsable', newStore.responsable);
      formDataToSend.append('rif', newStore.rif);
      formDataToSend.append('telefono', newStore.telefono);
      formDataToSend.append('correo', newStore.correo);
      formDataToSend.append('password', newStore.password);
      formDataToSend.append('descripcion', newStore.descripcion || '');
      formDataToSend.append('contacto_whatsapp', newStore.contacto_whatsapp || '');
      formDataToSend.append('contacto_instagram', newStore.contacto_instagram || '');
      formDataToSend.append('plataformas', JSON.stringify(selectedPlataformas));
      formDataToSend.append('monedas', JSON.stringify(selectedMonedas));
      formDataToSend.append('rol', newStore.rol || 'Comercio');
      
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      await axios.post(`${API_URL}/api/admin/stores`, formDataToSend, getAuthMultipartHeaders());
      setMsg({ text: '¡Comercio creado exitosamente!', type: 'success' });
      
      setNewStore({
        nombreTienda: '', responsable: '', rif: '', telefono: '',
        correo: '', password: '', descripcion: '',
        contacto_whatsapp: '', contacto_instagram: '', rol: 'Comercio'
      });
      setSelectedPlataformas([]);
      setSelectedMonedas([]);
      setLogoFile(null);
      
      setShowAddStore(false);
      loadStats();
      loadStores();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Error al crear el comercio.', type: 'error' });
    }
  };

  const handleStatusChange = async (id, newStatus, nombre) => {
    setMsg({ text: '', type: '' });
    try {
      await axios.put(`${API_URL}/api/admin/stores/${id}/status`, { estado: newStatus }, getAuthHeaders());
      setMsg({ text: `Estado del comercio "${nombre}" actualizado a ${newStatus}.`, type: 'success' });
      loadStats();
      loadStores();
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Error al actualizar el estado.', type: 'error' });
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-info">
          <h2><i className="fa-solid fa-shield-halved"></i> Panel de Administración</h2>
          <span className="admin-badge">Administrador</span>
        </div>
        <div className="dash-actions">
          <a href="http://localhost:3000" className="dash-btn dash-btn-outline" target="_blank" rel="noreferrer">
            <i className="fa-solid fa-map-location-dot"></i> Ver Mapa
          </a>
          <button onClick={logout} className="dash-btn dash-btn-danger">
            <i className="fa-solid fa-right-from-bracket"></i> Salir
          </button>
        </div>
      </div>

      {/* Messages */}
      {msg.text && (
        <div className={`admin-msg ${msg.type === 'error' ? 'admin-msg-error' : 'admin-msg-success'}`}>
          <i className={`fa-solid ${msg.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
          {msg.text}
        </div>
      )}

      {/* Stats Section */}
      <div className="admin-stats-section">
        <div className="admin-stats-cards">
          <div className="admin-stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(0, 255, 163, 0.1)', color: '#00ffa3' }}>
              <i className="fa-solid fa-store"></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-number">{stats?.totalStores || 0}</span>
              <span className="stat-card-label">Comercios Registrados</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(0, 184, 255, 0.1)', color: '#00b8ff' }}>
              <i className="fa-solid fa-box-open"></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-number">{stats?.totalProducts || 0}</span>
              <span className="stat-card-label">Productos Publicados</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div className="stat-card-info">
              <span className="stat-card-number">{stats?.roles?.administradores || 0}</span>
              <span className="stat-card-label">Administradores</span>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        {stats && (
          <div className="admin-chart-card">
            <h3><i className="fa-solid fa-chart-pie"></i> Distribución por Rol</h3>
            <DonutChart
              comercios={stats.roles.vendedores}
              administradores={stats.roles.administradores}
            />
          </div>
        )}
      </div>

      {/* Store Management Section */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h3><i className="fa-solid fa-building"></i> Gestión de Comercios</h3>
            <p className="admin-section-subtitle">{stores.length} comercios registrados en el sistema</p>
          </div>
          <button onClick={() => setShowAddStore(!showAddStore)} className="dash-btn dash-btn-primary">
            <i className={`fa-solid ${showAddStore ? 'fa-xmark' : 'fa-plus'}`}></i>
            {showAddStore ? 'Cancelar' : 'Nuevo Comercio'}
          </button>
        </div>

        {/* Add Store Form */}
        {showAddStore && (
          <form onSubmit={handleCreateStore} className="admin-add-form">
            <div className="admin-form-title">
              <i className="fa-solid fa-store"></i> Registrar Nuevo Comercio
            </div>

            <div className="form-section-title">
              <i className="fa-solid fa-building"></i> Datos del Comercio
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Comercio *</label>
                <input name="nombreTienda" value={newStore.nombreTienda} onChange={handleNewStoreChange} placeholder="Ej: Tech Hub Venezuela" required />
              </div>
              <div className="form-group">
                <label>RIF *</label>
                <input name="rif" value={newStore.rif} onChange={handleNewStoreChange} placeholder="Ej: J-12345678-9" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Responsable *</label>
                <input name="responsable" value={newStore.responsable} onChange={handleNewStoreChange} placeholder="Nombre del responsable" required />
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
              <textarea name="descripcion" value={newStore.descripcion} onChange={handleNewStoreChange} placeholder="¿Qué ofrece tu comercio?" rows="2" />
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
                <input name="contacto_whatsapp" value={newStore.contacto_whatsapp} onChange={handleNewStoreChange} placeholder="Ej: +584125551234" />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input name="contacto_instagram" value={newStore.contacto_instagram} onChange={handleNewStoreChange} placeholder="@micomercio" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono *</label>
                <input name="telefono" value={newStore.telefono} onChange={handleNewStoreChange} placeholder="+58 412-5551234" required />
              </div>
              <div className="form-group">
                <label>Correo *</label>
                <input name="correo" type="email" value={newStore.correo} onChange={handleNewStoreChange} placeholder="correo@comercio.com" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contraseña *</label>
                <input name="password" type="password" value={newStore.password} onChange={handleNewStoreChange} placeholder="Mínimo 8 caracteres" minLength="8" required />
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select name="rol" value={newStore.rol} onChange={handleNewStoreChange} className="admin-select">
                  <option value="Comercio">Comercio</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
            </div>

            <button type="submit" className="dash-btn dash-btn-primary" style={{ marginTop: '12px' }}>
              <i className="fa-solid fa-check"></i> Crear Comercio
            </button>
          </form>
        )}

        {/* Stores Table */}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Comercio</th>
                <th>RIF</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Productos</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => (
                <tr key={store._id}>
                  <td data-label="Comercio" className="admin-store-td">
                    <div className="admin-store-cell">
                      <img src={store.logo} alt={store.nombreTienda} className="admin-store-logo"
                        onError={e => e.target.src = 'https://via.placeholder.com/36/1e293b/00ffa3?text=?'} />
                      <div>
                        <strong>{store.nombreTienda}</strong>
                        <span className="admin-store-owner">{store.responsable}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="RIF"><code>{store.rif}</code></td>
                  <td data-label="Correo">{store.correo}</td>
                  <td data-label="Rol">
                    <span className={`admin-role-badge ${store.rol === 'Administrador' ? 'role-admin' : 'role-comercio'}`}>
                      <i className={`fa-solid ${store.rol === 'Administrador' ? 'fa-shield-halved' : 'fa-store'}`}></i>
                      {store.rol}
                    </span>
                  </td>
                  <td data-label="Productos"><span className="admin-product-count">{store.productCount}</span></td>
                  <td data-label="Ubicación">
                    {store.latitud && store.longitud ? (
                      <a 
                        href={`http://localhost:3000/?lat=${store.latitud}&lng=${store.longitud}&storeId=${store._id}`}
                        className="admin-location-set-link"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="fa-solid fa-location-dot"></i> Configurada
                      </a>
                    ) : (
                      <span className="admin-location-unset"><i className="fa-solid fa-location-crosshairs"></i> Pendiente</span>
                    )}
                  </td>
                  <td data-label="Estado">
                    {store._id === user._id ? (
                      <span className="admin-status-badge status-active">
                        <i className="fa-solid fa-circle-check"></i> Activo
                      </span>
                    ) : (
                      <select
                        value={store.estado}
                        onChange={(e) => handleStatusChange(store._id, e.target.value, store.nombreTienda)}
                        className="admin-status-select"
                        style={{
                          borderColor: store.estado === 'Inhabilitado' ? 'rgba(255, 74, 107, 0.4)' : 'rgba(0, 255, 163, 0.4)',
                          color: store.estado === 'Inhabilitado' ? 'var(--crypt-danger)' : 'var(--crypt-green)'
                        }}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inhabilitado">Inhabilitado</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stores.length === 0 && (
            <p className="empty-msg">No hay comercios registrados en el sistema.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
