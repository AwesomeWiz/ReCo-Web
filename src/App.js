import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage      from "./pages/LoginPage";
import SignupPage     from "./pages/SignupPage";
import DashboardPage  from "./pages/DashboardPage";
import ProductsPage   from "./pages/ProductsPage";
import AnalyticsPage  from "./pages/AnalyticsPage";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<LoginPage/>}/>
          <Route path="/signup"    element={<SignupPage/>}/>
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
          <Route path="/products"  element={<ProtectedRoute><ProductsPage/></ProtectedRoute>}/>
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage/></ProtectedRoute>}/>
          <Route path="*"          element={<Navigate to="/login" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}