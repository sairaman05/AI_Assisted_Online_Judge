import React, { useContext } from "react";
import { AuthContext } from "../api/authuser";
import { Navigate } from "react-router-dom";

export function RequireAuth({ children, allowedTypes }) {
  const { isAuthenticated, isLoading, type } = useContext(AuthContext);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedTypes.length > 0 && !allowedTypes.includes(type))
    return <Navigate to="/" replace />;
  return children;
}