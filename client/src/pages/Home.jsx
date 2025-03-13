import { useState, useEffect } from "react";
import axiosInstance from "../axios/axiosInstance.js"; // Your configured Axios instance
import axios from "axios";

const Home = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/home");
        setData(response.data);
      } catch (error) {
        if (error.response?.status === 401) { // Check if token expired
          try {
            const refreshResponse = await axios.post('/refresh', {}, { withCredentials: true });

            // Store the new access token
            localStorage.setItem("accessToken", refreshResponse.data.accessToken);

            // Retry the original request with the new token
            const retryResponse = await axiosInstance.get("/home");
            setData(retryResponse.data);
          } catch (refreshError) {
            console.error("Refresh token failed:", refreshError);
            localStorage.removeItem("accessToken");
            window.location.href = "/login"; // Redirect to login
          }
        } else {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, []);

  return <div>{data ? JSON.stringify(data) : "Loading..."}</div>;
};

export default Home;
