import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = 'http://localhost:3000';

const checkTokenExpiry = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return now >= payload.exp;
  } catch (e) {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedUserJSON = localStorage.getItem('loggedUser');
    if (loggedUserJSON) {
      const parsedUser = JSON.parse(loggedUserJSON);
      if (checkTokenExpiry(parsedUser.token)) {
        localStorage.removeItem('loggedUser');
        setUser(null);
      } else {
        setUser(parsedUser);
      }
    }
  }, []);

  const login = async (correo, password) => {
    const { data } = await axios.post(`${API_URL}/api/auth/login`, { correo, password });
    localStorage.setItem('loggedUser', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await axios.post(`${API_URL}/api/auth/register`, formData);
    localStorage.setItem('loggedUser', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('loggedUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser, checkTokenExpiry }}>
      {children}
    </AuthContext.Provider>
  );
};
