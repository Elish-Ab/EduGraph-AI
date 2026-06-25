import axios from "axios";
import { useAuthStore } from "@/store/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let redirecting = false;

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !redirecting) {
      redirecting = true;
      useAuthStore.getState().logout();
      window.location.href = "/login";
      setTimeout(() => { redirecting = false; }, 3000);
    }
    return Promise.reject(error);
  }
);

export default api;
