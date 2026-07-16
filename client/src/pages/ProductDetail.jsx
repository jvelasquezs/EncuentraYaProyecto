import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        // Fallback for demo
        setProduct({ 
          _id: id, 
          nombre: 'Producto de demostración', 
          precio: 999, 
          descripcion: 'Descripción detallada...', 
          stock: 10, 
          imagen: 'https://via.placeholder.com/400',
          tienda: { contacto_whatsapp: '04125551234' }
        });
      });
  }, [id]);

  const handleContactClick = () => {
    if (!product || !product.tienda || !product.tienda.contacto_whatsapp) {
      alert('Este comercio no tiene registrado un número de WhatsApp.');
      return;
    }
    
    let waNum = product.tienda.contacto_whatsapp.replace(/[^0-9]/g, '');
    if (waNum.startsWith('0')) {
      waNum = '58' + waNum.substring(1);
    } else if (!waNum.startsWith('58') && waNum.length === 10) {
      waNum = '58' + waNum;
    }
    
    const waText = encodeURIComponent(`Hola, me interesa tu producto "${product.nombre}" de Encuentra Ya.`);
    window.open(`https://wa.me/${waNum}?text=${waText}`, '_blank');
  };

  if (!product) return <div>Cargando...</div>;

  return (
    <div className="product-detail-container">
      <div className="product-detail-media">
        <img src={product.imagen} alt={product.nombre} className="product-detail-img" />
      </div>
      <div className="product-detail-actions">
        <p className="product-detail-subtitle">Nuevo | +100 vendidos</p>
        <h1 className="product-detail-title">{product.nombre}</h1>
        <p className="product-detail-price">${product.precio}</p>
        <p className="product-detail-stock">Stock disponible: {product.stock}</p>
        <button className="btn-primary" onClick={handleContactClick} style={{ marginBottom: '10px' }}>
          Contactar ahora
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
