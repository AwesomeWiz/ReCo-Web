import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [manufacturer, setManufacturer] = useState(() => {
    try {
      const stored = localStorage.getItem("mfr_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (userData, token) => {
    localStorage.setItem("mfr_user", JSON.stringify(userData));
    localStorage.setItem("mfr_token", token);
    setManufacturer(userData);
  };

  const logout = () => {
    localStorage.removeItem("mfr_user");
    localStorage.removeItem("mfr_token");
    setManufacturer(null);
  };

  return (
    <AuthContext.Provider value={{ manufacturer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);