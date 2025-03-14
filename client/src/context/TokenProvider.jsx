import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const fetchInitialToken = async () => {
      try {
        const response = await axios.post("http://localhost:3000/refresh", {}, { withCredentials: true });
        setAccessToken(response.data.accessToken);
      } catch (error) {
        console.error("Failed to refresh token on mount:", error);
      }
    };

    fetchInitialToken();
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};
