import axios, { AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import { getToken, removeToken, removeUserData, setToken } from './auth';

// Explicitly set the backend URL to match the running server
const API_BASE_URL = 'http://127.0.0.1:5001';
console.log('API configured to use backend at:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent requests from hanging (increased to 30 seconds)
  timeout: 30000,
  // Add withCredentials for CORS requests with credentials
  withCredentials: true
});

// Debug function to inspect tokens
const debugToken = (token: string | null) => {
  if (!token) {
    console.debug('No token available');
    return;
  }
  
  try {
    // Log first and last 10 chars to identify token
    const tokenPreview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
    console.debug(`Using token: ${tokenPreview}`);
  } catch (e) {
    console.error('Error debugging token:', e);
  }
};

// Add error handling to request
const safeRequest = async (requestFn: () => Promise<any>) => {
  try {
    return await requestFn();
  } catch (error: any) {
    console.error('[API ERROR]', error.message);
    if (error.response) {
      console.error('[API ERROR RESPONSE]', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('[API NO RESPONSE]', error.request);
    }
    throw error;
  }
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void; }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor for API calls
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      console.log(`Adding auth token to request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('Token preview:', token.substring(0, 10) + '...');
      
      // Ensure headers object exists
      config.headers = config.headers || {};
      
      // Add Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log(`No token available for request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    console.error('API error intercepted:', error.message);
    
    // Log request details
    if (error.config) {
      console.error(`Request that failed: ${error.config.method?.toUpperCase()} ${error.config.url}`);
      console.error(`Full URL: ${error.config.baseURL || ''}${error.config.url}`);
    }
    
    // Get the error response details
    const status = error.response?.status;
    const data = error.response?.data;
    
    if (status) {
      console.error(`Response status: ${status}, data:`, data);
    } else {
      console.error('No response received from server');
    }
    
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          if (originalRequest.headers) originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest); // Retry with new token from queue processing
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Do not attempt to refresh token if the failed request was to a refresh endpoint itself or auth endpoints
      const isAuthOrRefreshEndpoint = originalRequest.url?.includes('/auth/') || originalRequest.url?.includes('/swift/refresh');
      
      if (isAuthOrRefreshEndpoint && originalRequest.url !== '/api/swift/refresh') { // allow refresh to proceed if it's not the refresh endpoint itself
         console.log('401 on auth endpoint, not refreshing. Clearing token.');
         removeToken();
         removeUserData();
         isRefreshing = false;
         // window.location.href = '/login'; // Or use react-router for navigation
         return Promise.reject(error);
      }
      // Specifically for /api/swift/refresh failure - avoid loop
      if (originalRequest.url === '/api/swift/refresh') {
        console.error('Refresh token request itself failed with 401. Logging out.');
        removeToken();
        removeUserData();
        isRefreshing = false;
        // window.location.href = '/login'; // Or use react-router for navigation
        return Promise.reject(error);
      }

      try {
        console.log('Attempting to refresh token for ', originalRequest.url);
        const currentToken = getToken();
        if (!currentToken) {
            console.log('No token available to refresh. Aborting refresh.');
            isRefreshing = false;
            processQueue(error, null); // Clear queue with error
            return Promise.reject(error);
        }
        const rs = await axios.post(`${API_BASE_URL}/api/swift/refresh`, {}, {
            headers: { 'Authorization': `Bearer ${currentToken}` }, 
            withCredentials: true 
        }); 

        const { access_token: newAccessToken } = rs.data as { access_token: string }; 
        setToken(newAccessToken);
        console.log('Token refreshed successfully.');
        
        // Update default header for subsequent requests by the main 'api' instance
        if (api.defaults.headers) {
            (api.defaults.headers as any).common['Authorization'] = `Bearer ${newAccessToken}`;
        }
        // Update the failed request's header
        if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        
        processQueue(null, newAccessToken);
        isRefreshing = false;
        return api(originalRequest); // Retry the original request with the new token
      } catch (_error: any) {
        console.error('Token refresh failed:', _error.response?.data || _error.message);
        processQueue(_error, null);
        removeToken();
        removeUserData();
        isRefreshing = false;
        // window.location.href = '/login'; // Or use react-router for navigation
        return Promise.reject(_error);
      }
    }
    return Promise.reject(error);
  }
);

// Enhanced methods with better error handling
const enhancedApi = {
  // Basic CRUD operations
  get: (url: string, config = {}) => safeRequest(() => api.get(url, config)),
  post: (url: string, data = {}, config = {}) => safeRequest(() => api.post(url, data, config)),
  put: (url: string, data = {}, config = {}) => safeRequest(() => api.put(url, data, config)),
  delete: (url: string, config = {}) => safeRequest(() => api.delete(url, config)),
  // Original api instance
  request: api.request.bind(api),
  // Direct access to the underlying axios instance
  axios: api
};

// Make API available globally for debugging and mocking
if (typeof window !== 'undefined') {
  (window as any).__NUTRIVIZE_API__ = enhancedApi;
}

export default enhancedApi; 