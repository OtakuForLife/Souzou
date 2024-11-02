import axios from 'axios'
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
})


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error)
    }
)

export const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
        const res = await api.post("/api/token/refresh/", {refresh: refreshToken, })
        if(res.status === 200){
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            return true;
        }
    } catch (error) {
        console.log(error);
    }
    return false;
}
export default api;