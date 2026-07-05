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
    <div style={{display: 'flex', gap: '40px', background: 'white', padding: '40px', borderRadius: '4px'}}>
      <div style={{flex: 2, textAlign: 'center'}}>
        <img src={product.imagen} alt={product.nombre} style={{maxWidth: '100%', maxHeight: '500px'}} />
      </div>
      <div style={{flex: 1, border: '1px solid #e6e6e6', padding: '24px', borderRadius: '8px'}}>
        <p style={{color: '#666', fontSize: '14px', marginBottom: '10px'}}>Nuevo | +100 vendidos</p>
        <h1 style={{fontSize: '22px', marginBottom: '20px'}}>{product.nombre}</h1>
        <p style={{fontSize: '36px', fontWeight: '300', marginBottom: '20px'}}>${product.precio}</p>
        <p style={{fontSize: '16px', marginBottom: '20px'}}>Stock disponible: {product.stock}</p>
        <button className="btn-primary" style={{marginBottom: '10px'}}>Comprar ahora</button>
        <button className="btn-primary" style={{background: 'rgba(65,137,230,.15)', color: '#3483fa'}} onClick={() => {addToCart(product); alert('Agregado al carrito');}}>Agregar al carrito</button>
      </div>
    </div>
  );
};

export default ProductDetail;
