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
  const [productError, setProductError] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [productImageFile, setProductImageFile] = useState(null);

  // Estados para la edición de producto
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProductForm, setEditProductForm] = useState({
    id: '', nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen: ''
  });
  const [editProductImageFile, setEditProductImageFile] = useState(null);
  const [editProductPreview, setEditProductPreview] = useState('');
  const [editProductError, setEditProductError] = useState('');
  const [editProductSuccess, setEditProductSuccess] = useState('');
  const [showProductImageLightbox, setShowProductImageLightbox] = useState(false);

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
    setProductError('');
    setProductSuccess('');
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', newProduct.nombre);
      formDataToSend.append('descripcion', newProduct.descripcion);
      formDataToSend.append('precio', newProduct.precio);
      formDataToSend.append('stock', newProduct.stock);
      formDataToSend.append('categoria', newProduct.categoria);

      if (productImageFile) {
        formDataToSend.append('imagen', productImageFile);
      }

      await axios.post(`${API_URL}/api/products`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${user.token}`
        }
      });

      setNewProduct({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen: '' });
      setProductImageFile(null);
      setShowAddProduct(false);
      setProductSuccess('¡Producto añadido con éxito!');
      loadProducts();
    } catch (err) {
      setProductError(err.response?.data?.error || 'Error al crear el producto.');
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

  const handleEditProductClick = (product) => {
    setEditProductForm({
      id: product._id,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      categoria: product.categoria,
      imagen: product.imagen
    });
    setEditProductPreview(product.imagen || 'https://via.placeholder.com/120/1e293b/94a3b8?text=IMG');
    setEditProductImageFile(null);
    setEditProductError('');
    setEditProductSuccess('');
    setShowEditProductModal(true);
  };

  const handleEditProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditProductImageFile(file);
      setEditProductPreview(URL.createObjectURL(file));
    }
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    setEditProductError('');
    setEditProductSuccess('');
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', editProductForm.nombre);
      formDataToSend.append('descripcion', editProductForm.descripcion);
      formDataToSend.append('precio', editProductForm.precio);
      formDataToSend.append('stock', editProductForm.stock);
      formDataToSend.append('categoria', editProductForm.categoria);

      if (editProductImageFile) {
        formDataToSend.append('imagen', editProductImageFile);
      }

      await axios.put(`${API_URL}/api/products/${editProductForm.id}`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${user.token}`
        }
      });

      setEditProductSuccess('¡Producto actualizado con éxito!');
      loadProducts();
      setTimeout(() => {
        setShowEditProductModal(false);
      }, 1000);
    } catch (err) {
      setEditProductError(err.response?.data?.error || 'Error al actualizar el producto.');
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

        {productSuccess && <div className="dash-msg">{productSuccess}</div>}
        {productError && <div className="dash-msg dash-msg-error">{productError}</div>}

        {showAddProduct && (
          <form onSubmit={addProduct} className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input 
                  value={newProduct.nombre} 
                  onChange={e => setNewProduct({...newProduct, nombre: e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, '')})} 
                  pattern="[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+" 
                  title="El nombre del producto solo debe contener letras, números y espacios" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <input 
                  value={newProduct.categoria} 
                  onChange={e => setNewProduct({...newProduct, categoria: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')})} 
                  placeholder="Ej: Tecnología" 
                  pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+" 
                  title="La categoría solo debe contener letras y espacios" 
                  required 
                />
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
                <label>Imagen del Producto (Opcional)</label>
                <input 
                  type="file" 
                  onChange={e => setProductImageFile(e.target.files[0])} 
                  accept="image/*" 
                  style={{ padding: '8px 12px' }}
                />
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
              <div 
                key={p._id} 
                className="dash-product-card" 
                onClick={() => handleEditProductClick(p)} 
                style={{ cursor: 'pointer' }}
                title="Hacer clic para ver / editar"
              >
                <img src={p.imagen || 'https://via.placeholder.com/300'} alt={p.nombre} onError={e => e.target.src='https://via.placeholder.com/300/1e293b/94a3b8?text=IMG'} />
                <div className="dash-product-info">
                  <h4>{p.nombre}</h4>
                  <span className="dash-product-cat">{p.categoria}</span>
                  <div className="dash-product-meta">
                    <span className="dash-product-price">${Number(p.precio).toLocaleString()}</span>
                    <span className="dash-product-stock">Stock: {p.stock}</span>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      deleteProduct(p._id); 
                    }} 
                    className="dash-btn-delete"
                  >
                    <i className="fa-solid fa-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showEditProductModal && (
        <div className="profile-modal-overlay" onClick={() => setShowEditProductModal(false)}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3><i className="fa-solid fa-pen-to-square"></i> Editar Producto</h3>
              <button className="profile-modal-close-btn" onClick={() => setShowEditProductModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleEditProductSubmit}>
              <div className="profile-modal-body">
                {editProductError && <div className="dash-msg dash-msg-error" style={{ marginBottom: '16px' }}>{editProductError}</div>}
                {editProductSuccess && <div className="dash-msg" style={{ marginBottom: '16px' }}>{editProductSuccess}</div>}

                {/* IMAGEN DEL PRODUCTO */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
                  <img 
                    src={editProductPreview} 
                    alt="Vista previa del producto" 
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }} 
                    title="Ver imagen completa"
                    onClick={() => setShowProductImageLightbox(true)}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/120/1e293b/94a3b8?text=IMG'}
                  />
                  <label className="profile-logo-upload-btn" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    Cambiar Imagen
                    <input type="file" onChange={handleEditProductImageChange} accept="image/*" style={{ display: 'none' }} />
                  </label>
                </div>

                {/* NOMBRE Y CATEGORÍA */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre del Producto *</label>
                    <input 
                      type="text" 
                      value={editProductForm.nombre} 
                      onChange={e => setEditProductForm({...editProductForm, nombre: e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/g, '')})} 
                      pattern="[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]+" 
                      title="El nombre solo debe contener letras, números y espacios" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría *</label>
                    <input 
                      type="text" 
                      value={editProductForm.categoria} 
                      onChange={e => setEditProductForm({...editProductForm, categoria: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')})} 
                      pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+" 
                      title="La categoría solo debe contener letras y espacios" 
                      required 
                    />
                  </div>
                </div>

                {/* DESCRIPCIÓN */}
                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea 
                    value={editProductForm.descripcion} 
                    onChange={e => setEditProductForm({...editProductForm, descripcion: e.target.value})} 
                    rows="3" 
                    required 
                  />
                </div>

                {/* PRECIO Y STOCK */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Precio ($) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editProductForm.precio} 
                      onChange={e => setEditProductForm({...editProductForm, precio: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input 
                      type="number" 
                      value={editProductForm.stock} 
                      onChange={e => setEditProductForm({...editProductForm, stock: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

              </div>
              <div className="profile-modal-footer">
                <button type="button" className="dash-btn dash-btn-danger" onClick={() => setShowEditProductModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="dash-btn dash-btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductImageLightbox && (
        <div className="lightbox-overlay" onClick={() => setShowProductImageLightbox(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setShowProductImageLightbox(false)}>&times;</button>
            <img src={editProductPreview} alt="Producto completo" className="lightbox-image" onError={(e) => e.target.src = 'https://via.placeholder.com/300/1e293b/94a3b8?text=IMG'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
