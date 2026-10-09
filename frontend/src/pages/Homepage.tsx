import React, { useContext } from "react";
import { AuthContext } from "../api/authuser";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function HomePage() {
  const {
    isAuthenticated,
    user,
    error,
    login,
    signup,
    logout,
    isLoading,
    type,
  } = useContext(AuthContext);

  const navigate = useNavigate();

  if (isLoading) {
    return <div className="text-white p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Global Navbar */}
      <Navbar />

      {error && <p className="text-red-500 text-center py-2 bg-red-900/20">Error: {typeof error === 'string' ? error : error.message}</p>}

      {/* Hero Section */}
      <main className="mb-4 relative flex-grow flex flex-col justify-center items-center text-center px-6 py-24 bg-gradient-to-b from-indigo-900/60 via-purple-900/40 to-gray-950 border-b border-gray-800">
        <div className="absolute inset-0 opacity-20 -z-10 bg-gradient-to-br from-indigo-500 via-indigo-700 to-purple-800"></div>

        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
          Code. Compete. Conquer.
        </h2>
        <p className="mb-8 text-indigo-100 leading-relaxed max-w-xl text-lg">
          Welcome to <span className="font-bold text-yellow-300">FIASCOde</span> — your LeetCode-style AI-Assisted platform for algorithmic practice, real-time code judging, 2-minute proactive monitoring, and instant solution feedback.
        </p>

        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-900/80 p-4 rounded-2xl border border-indigo-400/30 shadow-xl">
            <span className="text-yellow-300 font-bold text-lg">
              Welcome back, {user?.name || user?.email || "Coder"}!
            </span>
            <button
              onClick={() => navigate(type === "admin" ? "/admin" : "/problems")}
              className="px-6 py-2.5 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 transition cursor-pointer shadow-md"
            >
              {type === "admin" ? "Open Admin Panel" : "📚 Practice Problems"}
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition cursor-pointer shadow-md"
            >
              👤 My Profile
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <button
              onClick={signup}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition duration-300 shadow-xl cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={login}
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-indigo-700 transition duration-300 cursor-pointer"
            >
              Login
            </button>
          </div>
        )}
      </main>

      {/* Instructions Section */}
      <section
        id="instructions"
        className="bg-gray-900 text-gray-200 py-16 px-6 relative z-10 border-b border-gray-800"
      >
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-extrabold mb-6 text-center text-white">
            How FIASCOde Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
              <h4 className="text-lg font-bold text-indigo-400 mb-2">📚 LeetCode Practice</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Select from Easy, Medium, and Hard problem sets. Track your solved questions with green checkmarks and profile stats.
              </p>
            </div>
            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
              <h4 className="text-lg font-bold text-yellow-400 mb-2">🤖 2-Min Proactive AI</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                As you type, an automated AI agent monitors your code every 2 minutes to provide non-spoiler tips, boundary warnings, and guidance.
              </p>
            </div>
            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
              <h4 className="text-lg font-bold text-emerald-400 mb-2">🌟 Solution Insights</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Failed submissions get root-cause diagnostic hints. Accepted submissions unlock optimal alternative code & complexity breakdowns!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 bg-gray-950 text-gray-500 text-sm border-t border-gray-900">
        &copy; {new Date().getFullYear()} FIASCOde. All rights reserved.
      </footer>
    </div>
  );
}

export default HomePage;
