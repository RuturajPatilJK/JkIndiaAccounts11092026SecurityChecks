import axios from "axios";
import { attachAuthInterceptors } from "./authInterceptors";

const base_url = process.env.REACT_APP_API
const axiosInstance = axios.create({
  baseURL: base_url,
  withCredentials: true,
});

attachAuthInterceptors(axiosInstance, "/refresh");

export default axiosInstance;
