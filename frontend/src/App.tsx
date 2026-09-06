import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Homepage";
import AdminPage from "./pages/AdminPage";
import EditorWrapper from "./components/CCWrapper";
import { RequireAuth } from "./components/RequireAuth";
import { AuthProvider } from "./api/authuser";
import { useEffect } from "react";
import { ContestSessionProvider } from "./api/CreateSessionContext";

function useKeepAlivePing() {
  useEffect(() => {
    const pingInterval = setInterval(() => {
      fetch(`${import.meta.env.VITE_BACKEND_IP}`)
        .then(res => console.log("Ping sent:", res.status))
        .catch(err => console.error("Ping failed:", err));
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(pingInterval);
  }, []);
}

function App() {
  useKeepAlivePing();
  return (
    
    <BrowserRouter>
      <AuthProvider>
        <ContestSessionProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<HomePage />} />

          {/* Admin Protected Route */}
          <Route
            path="/admin"
            element={
              <RequireAuth allowedTypes={["admin"]}>
                <AdminPage />
              </RequireAuth>
            }
          />

          {/* User and Admin Protected Route */}
          <Route
            path="/editor"
            element={
              <RequireAuth allowedTypes={["user", "admin"]}>
                
                  <EditorWrapper />
              </RequireAuth>
            }
          />
        </Routes>
      </ContestSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
