import axios from "axios";

const API_URL = "http://localhost:5000/api"; // backend base URL

// Auth APIs
export const signup = (data) => axios.post(`${API_URL}/auth/signup`, data);
export const login = (data) => axios.post(`${API_URL}/auth/login`, data);

// Chat API
export const sendMessage = (message) => axios.post(`${API_URL}/chat`, { message });
