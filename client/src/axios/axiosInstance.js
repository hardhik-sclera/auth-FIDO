import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000", // Change this to your API base URL
});

// Attach token automatically before each request
axiosInstance.interceptors.request.use(
  (config) => {
    let accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    console.log("EREEEE")
    return Promise.reject(error);
  }
);

export default axiosInstance;
