import axios from "axios";

const API_URL = "http://localhost:5000"; // your backend

export const signup = (data) => axios.post(`${API_URL}/auth/signup`, data);
export const login = (data) => axios.post(`${API_URL}/auth/login`, data);
export const sendMessage = (message) => axios.post(`${API_URL}/chat`, { message });
