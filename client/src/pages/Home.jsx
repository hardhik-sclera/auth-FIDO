import { useState, useEffect } from "react";
import useAxios from "../axios/axiosInstance.js"; 

const Home = () => {
  const [data, setData] = useState(null);
  const axiosInstance = useAxios(); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get("/home");
        // console.log(response.data);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [axiosInstance]); 
  return <div>{data ? data : "Loading..."}</div>;
};

export default Home;
