import axios from 'axios';
import config from '../../../config/environment.js';

const apiClient = axios.create({
    baseURL: config.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
    withCredentials: true,
});

/**
 * Set authorization token in axios headers
 * @param {string|null} token - JWT access token
 */
export const setAuthToken = (token) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers.common['Authorization'];
    }
};

/**
 * Response interceptor for handling token refresh
 * Automatically refreshes token on 401 response
 */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    isRefreshing = false;
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 (Unauthorized) and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue request while refreshing
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Import here to avoid circular dependency
                const TokenManager = (await import('./TokenManager.js')).default;
                const TokenRefreshService = (await import('./TokenRefreshService.js')).default;

                const refreshToken = TokenManager.getRefreshToken();

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Attempt to refresh token
                const response = await TokenRefreshService.refreshAccessToken(refreshToken);

                if (response.success) {
                    const newToken = response.data.accessToken;
                    setAuthToken(newToken);
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    processQueue(null, newToken);
                    return apiClient(originalRequest);
                } else {
                    // Refresh failed, clear tokens and reject
                    TokenManager.clearTokens();
                    setAuthToken(null);
                    processQueue(new Error('Token refresh failed'), null);
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
            } catch (err) {
                processQueue(err, null);
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;