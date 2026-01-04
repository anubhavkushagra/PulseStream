import { createContext, useState, useEffect } from 'react';
import API from '../services/api';
import socket from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = localStorage.getItem('token');

        if (userInfo && token) {
            setUser(userInfo);
            socket.connect();
            socket.emit('setup', userInfo);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        localStorage.setItem('userInfo', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        setUser(data);
        socket.connect();
        socket.emit('setup', data);
    };

    const register = async (name, email, password, role, adminSecret) => {
        await API.post('/auth/register', { name, email, password, role, adminSecret });
        // Do not auto-login
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUser(null);
        socket.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
