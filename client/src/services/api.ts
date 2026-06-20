const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests (crucial for Refresh Tokens)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('auth_session');
    if (authData) {
      try {
        const { token } = JSON.parse(authData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error('Failed to parse auth session', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request returns 401 Unauthorized, and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Post refresh request. Cookie-based tokens are sent automatically.
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const { token } = res.data;

        // Update local session
        const authData = localStorage.getItem('auth_session');
        if (authData) {
          const parsed = JSON.parse(authData);
          parsed.token = token;
          localStorage.setItem('auth_session', JSON.stringify(parsed));
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed -> clear session and boot user to login
        console.error('Refresh token expired or invalid', refreshError);
        localStorage.removeItem('auth_session');
        // We can dispatch window event to notify store or routing
        window.dispatchEvent(new Event('auth_session_expired'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
