import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisansathi_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for consistent data & error extraction
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.error || error.message || 'Network request failed';
    return Promise.reject(new Error(errorMsg));
  }
);

export default apiClient;
