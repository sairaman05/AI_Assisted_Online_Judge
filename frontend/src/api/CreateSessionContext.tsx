import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";

interface ContestSessionContextType {
  timeLeft: number | null;
  startSession: (durationMinutes: number) => void;
  clearSession: () => void;
}

const ContestSessionContext = createContext<ContestSessionContextType | undefined>(undefined);

export const ContestSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number | null>(null); // in seconds
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    console.log("Timer effect triggered", sessionStartTime, sessionDuration);

    if (sessionStartTime === null || sessionDuration === null) {
      console.log("Timer not started yet");
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime) / 1000);
      const remaining = sessionDuration - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 60000);

    return () => clearInterval(intervalId);
  }, [sessionStartTime, sessionDuration]);


  useEffect(() => {
    if (timeLeft === 0) {
      alert("Session expired. Logging out.");
      clearSession();
      window.location.href = "/logout"; // Adjust as your logout URL
    }
  }, [timeLeft]);

  const startSession = (durationMinutes: number) => {
    setSessionStartTime(Date.now());
    setSessionDuration(durationMinutes * 60);
  };

  const clearSession = () => {
    setSessionStartTime(null);
    setSessionDuration(null);
    setTimeLeft(null);
  };

  return (
    <ContestSessionContext.Provider value={{ timeLeft, startSession, clearSession }}>
      {children}
    </ContestSessionContext.Provider>
  );
};

// Custom hook for easier consumption
export const useContestSession = (): ContestSessionContextType => {
  const context = useContext(ContestSessionContext);
  if (!context) {
    throw new Error("useContestSession must be used within a ContestSessionProvider");
  }
  return context;
};
