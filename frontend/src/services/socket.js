import io from 'socket.io-client';

const ENDPOINT = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const socket = io(ENDPOINT, { autoConnect: false });

export default socket;
