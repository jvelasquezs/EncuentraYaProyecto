import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { API_URL } from '../components/constants';

const Cart = () => {
  const { cartItems, getCartTotal, clearCart, removeFromCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [metodo, setMetodo] = useState('Tarjeta');
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) return alert('Debes iniciar sesión para comprar');
    
    const ordenData = {
      items: cartItems.map(item => ({ producto: item._id, cantidad: item.qty, precio: item.precio })),
      total: getCartTotal(),
      metodoPago: metodo,
      referencia: `REF-${Math.floor(Math.random() * 1000000)}`
    };

    try {
      await axios.post(`${API_URL}/api/orders`, ordenData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(`Compra exitosa con ${metodo}. Ref: ${ordenData.referencia}`);
      clearCart();
      navigate('/');
    } catch (error) {
      alert('Simulación de pago: Compra exitosa. (Modo Demo)');
      clearCart();
      navigate('/');
    }
  };

  if (cartItems.length === 0) return <div style={{textAlign: 'center', marginTop: '50px'}}><h2>Tu carrito está vacío</h2></div>;

  return (
    <div className="cart-container">
      <div className="cart-items">
        <h2>Productos en tu carrito</h2>
        {cartItems.map(item => (
          <div className="cart-item" key={item._id}>
            <img src={item.imagen} alt={item.nombre} />
            <div style={{flex: 1}}>
              <h3 style={{fontSize: '18px', fontWeight: '400', marginBottom: '10px'}}>{item.nombre}</h3>
              <p style={{color: 'var(--crypt-danger)', cursor: 'pointer', fontWeight: '600'}} onClick={() => removeFromCart(item._id)}>
                <i className="fa-solid fa-trash-can"></i> Eliminar
              </p>
            </div>
            <div>
              <p style={{fontSize: '20px'}}>${item.precio}</p>
              <p>Cant: {item.qty}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h2>Resumen de compra</h2>
        <div style={{display: 'flex', justifyContent: 'space-between', margin: '20px 0'}}>
          <span>Total</span>
          <span style={{fontSize: '24px'}}>${getCartTotal().toLocaleString()}</span>
        </div>
        
        <div className="form-group">
          <label>Pasarela Simulada - Método de pago</label>
          <select value={metodo} onChange={e => setMetodo(e.target.value)}>
            <option value="Tarjeta">Tarjeta de Crédito</option>
            <option value="Transferencia">Transferencia Bancaria</option>
            <option value="Binance">Binance Pay</option>
          </select>
        </div>

        <button className="btn-primary" onClick={handleCheckout}>Continuar compra</button>
      </div>
    </div>
  );
};

export default Cart;
