import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Homepage";
import AdminPage from "./pages/AdminPage";
import EditorWrapper from "./components/CCWrapper";
import ProblemsListPage from "./pages/ProblemsListPage";
import ProfilePage from "./pages/ProfilePage";
import ContestsListPage from "./pages/ContestsListPage";
import DashboardPage from "./pages/DashboardPage";
import InterviewPrepPage from "./pages/InterviewPrepPage";
import ContestReportPage from "./pages/ContestReportPage";
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
            {/* Public Landing Route */}
            <Route path="/" element={<HomePage />} />

            {/* User Account Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* LeetCode Practice Problems List */}
            <Route path="/problems" element={<ProblemsListPage />} />

            {/* Contests Hub */}
            <Route path="/contests" element={<ContestsListPage />} />

            {/* Contest Performance & Weakness Analysis Report */}
            <Route path="/contests/:contestId/report" element={<ContestReportPage />} />

            {/* Interview Preparation Suite with JD Upload & PDF Export */}
            <Route path="/interview-prep" element={<InterviewPrepPage />} />

            {/* User Profile Dashboard */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin Protected Route */}
            <Route
              path="/admin"
              element={
                <RequireAuth allowedTypes={["admin"]}>
                  <AdminPage />
                </RequireAuth>
              }
            />

            {/* Code Editor Practice / Contest Workspace */}
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
