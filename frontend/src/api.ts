import axios from 'axios'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants'
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error status is 401 and there is no originalRequest._retry flag,
        // it means the token has expired and we need to refresh it
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem(REFRESH_TOKEN);
                const response = await api.post("/api/token/refresh/", {refresh: refreshToken, });
                const token = response.data.access;
                localStorage.setItem(ACCESS_TOKEN, token);

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axios(originalRequest);
            } catch (error) {
                // Handle refresh token error or redirect to login
                localStorage.clear();
            }
        }

        return Promise.reject(error);
    }
);

api.interceptors.request.use(
    
    (config) => {
        var token = localStorage.getItem(ACCESS_TOKEN);
        if(token){
            /* 
            const isExpired = isTokenExpired(token);
            if(isExpired){
                token = await refreshToken();
            } 
            */
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
        const res = await api.post("/api/token/refresh/", {refresh: refreshToken, })
        if(res.status === 200){
            return res.data.access;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
    return null;
}

export const isTokenExpired = (token: string) => {
    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if(tokenExpiration && tokenExpiration < now) {
        return true;
    }
    return false;
}

export default api;