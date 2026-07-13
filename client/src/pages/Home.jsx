import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { API_URL } from '../components/constants';

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Para demo, si no hay backend, mostramos productos dummy
    axios.get(`${API_URL}/api/products`)
      .then(res => setProducts(res.data))
      .catch(err => {
        console.error(err);
        setProducts([
          { _id: '1', nombre: 'Laptop Gamer Pro', precio: 1200, imagen: 'https://via.placeholder.com/300', tienda: { nombreTienda: 'Tech Store' } },
          { _id: '2', nombre: 'Smartphone 5G', precio: 800, imagen: 'https://via.placeholder.com/300', tienda: { nombreTienda: 'Móviles Ya' } }
        ]);
      });
  }, []);

  return (
    <div>
      <h2 style={{marginBottom: '20px', fontWeight: '300'}}>Basado en tu última visita</h2>
      <div className="product-grid">
        {products.map(product => (
          <Link to={`/product/${product._id}`} key={product._id}>
            <div className="product-card">
              <img src={product.imagen || 'https://via.placeholder.com/300'} alt={product.nombre} />
              <div className="product-info">
                <div className="product-price">${product.precio.toLocaleString()}</div>
                <div className="product-title">{product.nombre}</div>
                {product.tienda && <div className="product-store">Vendido por {product.tienda.nombreTienda}</div>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
