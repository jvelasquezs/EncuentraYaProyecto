import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminDashboard from './AdminDashboard';

const API_URL = 'http://localhost:3000';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locationMsg, setLocationMsg] = useState('');
  const [products, setProducts] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen: ''
  });
  const [productMsg, setProductMsg] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProducts();
    initMap();
  }, [user]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${user.token}` }
  });

  const loadProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products/my/list`, getAuthHeaders());
      setProducts(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const initMap = () => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Dynamically load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet script if not loaded
    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      const L = window.L;
      const map = L.map(mapRef.current).setView([9.9110, -67.3550], 14);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© Encuentra Ya'
      }).addTo(map);

      const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setCoords({ lat: lat.toFixed(6), lng: lng.toFixed(6) });

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng, { icon: greenIcon }).addTo(map);
        }
        markerRef.current.bindPopup(`<b>${user.nombreTienda || 'Tu Comercio'}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`).openPopup();
      });

      // Fix map rendering issue in tabs
      setTimeout(() => map.invalidateSize(), 200);
    });
  };

  const saveLocation = async () => {
    if (!coords.lat || !coords.lng) {
      setLocationMsg('Haz clic en el mapa para seleccionar tu ubicación.');
      return;
    }
    try {
      await axios.put(`${API_URL}/api/comercios/ubicacion`, {
        latitud: coords.lat,
        longitud: coords.lng
      }, getAuthHeaders());
      setLocationMsg('¡Ubicación guardada exitosamente! Tu comercio ahora aparece en el mapa.');
    } catch (err) {
      setLocationMsg('Error al guardar la ubicación.');
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setProductMsg('');
    try {
      await axios.post(`${API_URL}/api/products`, newProduct, getAuthHeaders());
      setNewProduct({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen: '' });
      setShowAddProduct(false);
      setProductMsg('¡Producto añadido con éxito!');
      loadProducts();
    } catch (err) {
      setProductMsg(err.response?.data?.error || 'Error al crear el producto.');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, getAuthHeaders());
      loadProducts();
    } catch (err) {
      alert('Error al eliminar.');
    }
  };

  if (!user) return null;

  if (user.rol === 'Administrador') {
    return <AdminDashboard />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dash-title">
          <h2><i className="fa-solid fa-gauge-high"></i> Panel de Control</h2>
          <span className="dash-store-name">{user.nombreTienda || user.nombre}</span>
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

      {/* --- SECCIÓN MAPA --- */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h3><i className="fa-solid fa-location-dot"></i> Ubicación en el Mapa</h3>
          <p>Haz clic en el mapa para seleccionar la ubicación de tu comercio</p>
        </div>
        <div className="dash-map-container">
          <div ref={mapRef} style={{ width: '100%', height: '350px', borderRadius: '12px' }}></div>
          <div className="dash-map-controls">
            <div className="coord-display">
              <span><strong>Lat:</strong> {coords.lat || '—'}</span>
              <span><strong>Lng:</strong> {coords.lng || '—'}</span>
            </div>
            <button onClick={saveLocation} className="dash-btn dash-btn-primary">
              <i className="fa-solid fa-floppy-disk"></i> Guardar Ubicación
            </button>
          </div>
          {locationMsg && <div className="dash-msg">{locationMsg}</div>}
        </div>
      </div>

      {/* --- SECCIÓN PRODUCTOS --- */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h3><i className="fa-solid fa-box-open"></i> Mis Productos ({products.length})</h3>
          <button onClick={() => setShowAddProduct(!showAddProduct)} className="dash-btn dash-btn-primary">
            <i className={`fa-solid ${showAddProduct ? 'fa-xmark' : 'fa-plus'}`}></i>
            {showAddProduct ? 'Cancelar' : 'Nuevo Producto'}
          </button>
        </div>

        {productMsg && <div className="dash-msg">{productMsg}</div>}

        {showAddProduct && (
          <form onSubmit={addProduct} className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <input value={newProduct.categoria} onChange={e => setNewProduct({...newProduct, categoria: e.target.value})} placeholder="Ej: Tecnología" required />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción *</label>
              <input value={newProduct.descripcion} onChange={e => setNewProduct({...newProduct, descripcion: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Precio ($) *</label>
                <input type="number" step="0.01" value={newProduct.precio} onChange={e => setNewProduct({...newProduct, precio: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Stock *</label>
                <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>URL Imagen</label>
                <input value={newProduct.imagen} onChange={e => setNewProduct({...newProduct, imagen: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <button type="submit" className="dash-btn dash-btn-primary">
              <i className="fa-solid fa-check"></i> Guardar Producto
            </button>
          </form>
        )}

        <div className="products-grid">
          {products.length === 0 ? (
            <p className="empty-msg">No tienes productos publicados aún. ¡Agrega tu primer producto!</p>
          ) : (
            products.map(p => (
              <div key={p._id} className="dash-product-card">
                <img src={p.imagen || 'https://via.placeholder.com/300'} alt={p.nombre} onError={e => e.target.src='https://via.placeholder.com/300/1e293b/94a3b8?text=IMG'} />
                <div className="dash-product-info">
                  <h4>{p.nombre}</h4>
                  <span className="dash-product-cat">{p.categoria}</span>
                  <div className="dash-product-meta">
                    <span className="dash-product-price">${Number(p.precio).toLocaleString()}</span>
                    <span className="dash-product-stock">Stock: {p.stock}</span>
                  </div>
                  <button onClick={() => deleteProduct(p._id)} className="dash-btn-delete">
                    <i className="fa-solid fa-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
