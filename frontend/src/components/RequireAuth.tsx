import React, { useContext } from "react";
import { AuthContext } from "../api/authuser";
import { Navigate } from "react-router-dom";

export function RequireAuth({ children, allowedTypes }: { children: any; allowedTypes?: string[] }) {
  const { isAuthenticated, isLoading, type, login } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 text-sm">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-md shadow-2xl space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400">Authentication Required 🔒</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Please sign in or create an account to access the practice compiler and AI workspace.
          </p>
          <button
            onClick={() => login()}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition shadow cursor-pointer"
          >
            🔑 Sign In / Create Account
          </button>
        </div>
      </div>
    );
  }

  const userType = type || "user";
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(userType)) {
    return <Navigate to="/problems" replace />;
  }

  return children;
}