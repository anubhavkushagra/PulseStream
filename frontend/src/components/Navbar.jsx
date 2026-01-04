import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { FaVideo, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const Navbar = ({ onUploadClick }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 text-blue-500 text-2xl font-bold flex items-center gap-2">
                            <FaVideo /> PulseStream
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                                {user && user.role === 'admin' && (
                                    <Link to="/analytics" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Analytics</Link>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="block">
                        <div className="ml-4 flex items-center md:ml-6 gap-4">
                            {user && (
                                <>
                                    {(user.role === 'editor' || user.role === 'admin') && (
                                        <button
                                            onClick={onUploadClick}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Upload Video
                                        </button>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <FaUserCircle size={24} />
                                        <span>{user.name}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1 bg-gray-700 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                                    >
                                        <FaSignOutAlt />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
