import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../api/authuser";

export default function Navbar() {
  const { isAuthenticated, user, type, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <header className="bg-gray-900 border-b border-gray-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Main Nav Tabs */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-indigo-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                ⚡ FIASCOde
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition ${
                  isActive("/dashboard")
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                📊 Dashboard
              </Link>
              <Link
                to="/problems"
                className={`px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition ${
                  isActive("/problems")
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                📚 Problems
              </Link>
              <Link
                to="/contests"
                className={`px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition ${
                  isActive("/contests")
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                🏆 Contests
              </Link>
              <Link
                to="/interview-prep"
                className={`px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition ${
                  isActive("/interview-prep")
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                💼 Interview Prep
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition ${
                  isActive("/profile")
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                👤 Profile
              </Link>

              {type === "admin" && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg font-semibold text-xs lg:text-sm transition ${
                    isActive("/admin")
                      ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  🛠 Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-gray-200">
                    {user?.name || user?.email || "Coder"}
                  </span>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">
                    {type || "user"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-3.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs rounded-lg transition shadow cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow cursor-pointer"
                >
                  Login / Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
