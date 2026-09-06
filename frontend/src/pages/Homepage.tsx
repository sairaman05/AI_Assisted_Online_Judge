import React, { useContext } from "react";
import { AuthContext } from "../api/authuser";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans relative overflow-x-hidden">
      {error && <p className="text-red-500 text-center">Error: {typeof error === 'string' ? error : error.message}</p>}

      {/* Hero Section */}
      <main className="mb-4 relative flex-grow flex flex-col justify-center items-center text-center px-6 py-24 rounded-t-3xl rounded-b-3xl bg-indigo-700 shadow-inner">
        <div className="absolute inset-0 opacity-20 -z-10 bg-gradient-to-br from-indigo-500 via-indigo-700 to-purple-800"></div>

        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
          Code. Compete. Conquer.
        </h2>
        <p className="mb-8 text-indigo-100 leading-relaxed max-w-xl text-lg">
          Welcome to <span className="font-bold text-yellow-300">FIASCOde</span> — your arena for real-time code judging, AI feedback, and global competition.
        </p>

        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-4 rounded-2xl border border-indigo-400/30">
            <span className="text-yellow-300 font-bold text-lg">
              Welcome, {user?.name || user?.email || "Coder"}!
            </span>
            <button
              onClick={() => navigate(type === "admin" ? "/admin" : "/editor")}
              className="px-6 py-2.5 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 transition cursor-pointer shadow-md"
            >
              Open {type === "admin" ? "Admin Panel" : "Workspace"}
            </button>
            <button
              onClick={logout}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition cursor-pointer shadow-md"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <button
              onClick={signup}
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-indigo-700 hover:scale-105 transition duration-300 shadow-xl"
            >
              Get Started
            </button>
            <button
              onClick={login}
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-indigo-700 hover:scale-105 transition duration-300"
            >
              Login
            </button>
          </div>
        )}
      </main>

      {/* Instructions Section */}
      <section
        id="instructions"
        className="bg-white text-gray-800 py-20 px-6 relative z-10 rounded-t-3xl rounded-b-3xl shadow-inner"
      >
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-extrabold mb-6 text-center">
            Rules & How It Works
          </h3>
          <ul className="space-y-4 text-lg leading-relaxed">
            <li>📝 You must register for a contest to start solving questions.</li>
            <li>
              There are two types of contests:
              <ol className="list-decimal list-inside ml-5 mt-1">
                <li><strong>Normal Contest</strong> — Solve standard coding problems as usual.</li>
                <li>
                  <strong>FIASCOde Contest</strong> — You are required to intentionally introduce a specified language-specific error within the given constraints, modifying the original codebase only as permitted.
                </li>
              </ol>
            </li>
            <li>🏆 You can join <strong>only one contest at a time</strong>.</li>
            <li>⚠️ Challenges may require you to create a specific intentional error <em>without altering the original codebase beyond the allowed limits</em>.</li>
            <li>💻 FIASCOde can also be used as a normal coding platform for writing and executing code outside of contests.</li>
          </ul>

        </div>
      </section>
      {/* About Section */}
      <section
        id="about"
        className="bg-white text-gray-800 py-20 px-6 relative z-10 rounded-t-3xl rounded-b-3xl shadow-inner"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-extrabold mb-4">Why FIASCOde?</h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            Helps you understand errors better than before. <span className="text-indigo-600 font-semibold">FIASCOde</span> provides real-time judge feedback, AI suggestions, and performance insights.
          </p>
        </div>
      </section>
      {/* Footer */}
      <footer className="text-center py-6 bg-gray-900 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} FIASCOde. All rights reserved.
      </footer>
    </div>
  );
}

export default HomePage;
