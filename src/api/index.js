import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================
// ENV CONFIG
// ============================
const IS_PROD = false; // ✅ switch this when building for production

const BASE_URL = IS_PROD
  ? "https://rgmedlink-backend001.onrender.com/api"
  : "http://192.168.29.47:5000/api"; // ✅ Local backend

// ============================
// AXIOS INSTANCE
// ============================
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================
// REQUEST INTERCEPTOR (Attach Token)
// ============================
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.log("Token fetch error:", err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================
// RESPONSE INTERCEPTOR (Handle 401)
// ============================
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // 🔥 Token expired → clear storage
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      } catch (err) {
        console.log("Storage clear error:", err);
      }
    }

    return Promise.reject(error);
  }
);

// ============================
// EXPORTS
// ============================
export default API;
export { BASE_URL };