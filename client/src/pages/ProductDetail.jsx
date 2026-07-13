import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import axios from 'axios';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        // Fallback for demo
        setProduct({ _id: id, nombre: 'Producto de demostración', precio: 999, descripcion: 'Descripción detallada...', stock: 10, imagen: 'https://via.placeholder.com/400' });
      });
  }, [id]);

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
        <button className="btn-primary" style={{ marginBottom: '10px' }}>Comprar ahora</button>
        <button className="btn-primary btn-secondary-blue" onClick={() => { addToCart(product); alert('Agregado al carrito'); }}>Agregar al carrito</button>
      </div>
    </div>
  );
};

export default ProductDetail;
