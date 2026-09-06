import React, { useEffect, useState, createContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const AuthContext = createContext<any>(null);

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_IP || 'http://localhost:5174'}`;

const safeParseJson = async (res: Response) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid server response (${res.status}): ${text.slice(0, 80)}`);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthHandler();

  return (
    <AuthContext.Provider value={auth}>
      {children}
      {auth.isModalOpen && <AuthModal auth={auth} />}
    </AuthContext.Provider>
  );
}

export function useAuthHandler() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [type, setType] = useState<"admin" | "user" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "signup">("login");

  const location = useLocation();
  const navigate = useNavigate();

  // On mount, check if logged in via JWT cookie or stored session
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        setUser(data.user);
        setDbUser(data.dbUser);
        setType(data.user?.type);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setDbUser(null);
        setType(null);
      }
    } catch (err) {
      console.error("Session check error:", err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email?: string, password?: string) => {
    if (typeof email !== "string" || !email) {
      setModalMode("login");
      setIsModalOpen(true);
      return;
    }

    try {
      setError(null);
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || `Login failed (${res.status})`);
      }

      setUser(data.user);
      setDbUser(data.dbUser);
      setType(data.user.type);
      setIsAuthenticated(true);
      setIsModalOpen(false);

      if (data.user.type === "admin") {
        navigate("/admin");
      } else {
        navigate("/editor");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    }
  };

  const signup = async (name?: string, email?: string, password?: string, roleType: "user" | "admin" = "user") => {
    if (typeof email !== "string" || !email) {
      setModalMode("signup");
      setIsModalOpen(true);
      return;
    }

    try {
      setError(null);
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, type: roleType }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || `Registration failed (${res.status})`);
      }

      setUser(data.user);
      setDbUser(data.dbUser);
      setType(data.user.type);
      setIsAuthenticated(true);
      setIsModalOpen(false);

      if (data.user.type === "admin") {
        navigate("/admin");
      } else {
        navigate("/editor");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setDbUser(null);
      setType(null);
      navigate("/");
    }
  };

  return {
    isLoading,
    isAuthenticated,
    error,
    login,
    signup,
    logout,
    user,
    type,
    dbUser,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    setModalMode,
  };
}

function AuthModal({ auth }: { auth: any }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState<"user" | "admin">("user");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLogin = auth.modalMode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await auth.login(email, password);
      } else {
        await auth.signup(name, email, password, roleType);
      }
    } catch (err: any) {
      setLocalError(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-zinc-900 border border-zinc-700 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={() => auth.setIsModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✖
        </button>

        <h2 className="text-2xl font-bold mb-2 text-indigo-400">
          {isLogin ? "Welcome Back to FIASCOde" : "Create your Account"}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {isLogin ? "Enter your email to sign in" : "Register to start solving challenges"}
        </p>

        {localError && (
          <div className="mb-4 bg-red-600/30 border border-red-500 text-red-200 text-sm p-3 rounded">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Account Type</label>
              <select
                value={roleType}
                onChange={(e: any) => setRoleType(e.target.value)}
                className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="user">User (Competitor)</option>
                <option value="admin">Admin (Manager)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition duration-200 disabled:opacity-50"
          >
            {submitting ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              auth.setModalMode(isLogin ? "signup" : "login");
              setLocalError("");
            }}
            className="text-indigo-400 hover:underline font-semibold"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}