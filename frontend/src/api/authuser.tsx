import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, createContext  } from "react";
import { useNavigate, useLocation} from "react-router-dom";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuthHandler();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthHandler() {
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect,
    logout: auth0Logout,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  const [type, setType] = useState<"admin" | "user" | null>(null);
  const [dbUser, setDbUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const signup = () =>
    loginWithRedirect({ authorizationParams: { screen_hint: "signup" } });
  const login = () => loginWithRedirect();
  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  useEffect(() => {
    const fetchUserFromDB = async () => {
       if (isLoading) return;
      if (!isAuthenticated || !user) {
        navigate("/");
        return;
      }
      const token = await getAccessTokenSilently();
              await fetch("http://localhost:5174/api/auth/set-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
      const userData = {
        id: user.sub,                  
        name: user.name,
        email: user.email,
        type: "user", // default
      };

      try {
        const encodedId = encodeURIComponent(user.sub);
        console.log(encodedId)
        const res = await fetch(`http://localhost:5174/api/users/${encodedId}`, {credentials: "include"});
        if (res.ok) {
          const existingUser = await res.json();
          setType(existingUser.type);
          setDbUser(existingUser);
        if (existingUser.type === "admin" && location.pathname !== "/admin") {
          navigate("/admin");
        } else if (existingUser.type === "user" && location.pathname !== "/editor") {
          navigate("/editor");
        }
        } else {
          const createRes = await fetch("http://localhost:5174/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(userData),
          });
          if (createRes.ok) {
            const createdUser = await createRes.json();
            setType(createdUser.type);
            setDbUser(createdUser);
          } else {
            const errorText = await createRes.text();
            throw new Error(`User creation failed: ${errorText}`);
          }
        }
      } catch (err) {
        console.error("❌ AuthHandler error:", err);
      }
    };

    fetchUserFromDB();
  }, [isAuthenticated, user?.sub, navigate, getAccessTokenSilently]);
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
  }
}