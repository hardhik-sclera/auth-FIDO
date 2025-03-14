import axios from "axios";
import { useContext, useMemo } from "react";
import { AuthContext } from "../context/TokenProvider.jsx"; // Token Context

const useAxios = () => {
  const { accessToken, setAccessToken } = useContext(AuthContext);


  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: "http://localhost:3000",
      withCredentials: true,
    });


    instance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

  
    instance.interceptors.response.use(
      (response) => {

        return response}, 
      async (error) => {

        if (error.response?.status === 403) {
          console.log(error.response.status);
          
          console.log("Access token expired, refreshing...");
          try {
            const refreshResponse = await axios.post(
              "http://localhost:3000/refresh",
              {},
              { withCredentials: true }
            );
    
            const newAccessToken = refreshResponse.data.accessToken;
            setAccessToken(newAccessToken); 
           
            console.log(error.response.status);
            console.log("newAccessToken: ", newAccessToken);
            
            error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
            console.log(error.config);
            return instance(error.config);
          } catch (refreshError) {
            console.warn("Refresh token failed, redirecting to login...");
            setAccessToken(null);
            window.location.href = "/login";
          }
        }
       if (error.response?.status !== 403) {
          console.log(error.response.status);
          
          console.error("Error fetching data:", error);
        }
        return Promise.reject(error);
      }
    );
    

    return instance;
  }, [accessToken, setAccessToken]);

  return axiosInstance;
};

export default useAxios;
