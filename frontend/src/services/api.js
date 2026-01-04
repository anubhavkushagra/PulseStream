import axios from 'axios';

const API = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000') + '/api',
});

// Add auth header to every request if token exists
API.interceptors.request.use((req) => {
    if (localStorage.getItem('token')) {
        req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }
    return req;
});

export default API;
