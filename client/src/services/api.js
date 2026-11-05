import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT or Demo flag
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisansathi_token');
  const isDemo = localStorage.getItem('kisansathi_is_demo') === 'true';

  if (isDemo) {
    config.headers['x-demo-user'] = 'true';
  } else if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(error));

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.error || error.message || 'Network request failed';
    return Promise.reject(new Error(errorMsg));
  }
);

export default apiClient;
