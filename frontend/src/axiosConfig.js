// axiosConfig.js
import axios from "axios";

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true, // ✅ Important: send cookies in cross-origin requests
});

instance.interceptors.response.use(
  (res) => {
    console.log("✅", res.config.method.toUpperCase(), res.config.url, "-", res.status, `(${res.duration || 0}ms)`);
    return res;
  },
  (err) => {
    console.error("❌", err.config?.method?.toUpperCase(), err.config?.url, "-", err.response?.status, `(${err.duration || 0}ms)`);
    return Promise.reject(err);
  }
);

export default instance;
