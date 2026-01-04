import { useNavigate } from 'react-router-dom';
import { FaPlay, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaTrash, FaUserPlus } from 'react-icons/fa';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../services/api';
import { toast } from 'react-toastify';

const VideoItem = ({ video, onDelete, onAssign }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const getStatusIcon = (status, sensitivity) => {
        if (status === 'processing') return <FaSpinner className="animate-spin text-yellow-500" />;
        if (status === 'failed') return <FaExclamationTriangle className="text-red-500" />;
        if (sensitivity === 'flagged') return <FaExclamationTriangle className="text-red-500" title={`Flagged: ${video.flaggedReason || 'Unsafe Content'}`} />;
        return <FaCheckCircle className="text-green-500" />;
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this video?')) {
            try {
                await API.delete(`/videos/${video._id}`);
                toast.success('Video deleted');
                if (onDelete) onDelete(video._id);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Delete failed');
            }
        }
    };

    const isOwner = user && user._id === video.user?._id;

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 relative group">
            <div
                className="relative h-48 bg-gray-700 cursor-pointer"
                onClick={() => video.processingStatus === 'completed' && navigate(`/video/${video._id}`)}
            >
                {video.processingStatus === 'completed' ? (
                    <video
                        src={`http://localhost:5000/api/videos/${video._id}/stream#t=0.1`}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => {
                            e.target.pause();
                            e.target.currentTime = 0;
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {video.processingStatus === 'processing' ? 'Processing...' : 'No Preview'}
                    </div>
                )}

                <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 rounded px-2 py-1 text-xs text-white flex items-center gap-1 z-10 pointer-events-none">
                    {getStatusIcon(video.processingStatus, video.sensitivityStatus)}
                    <span className="capitalize">{video.processingStatus === 'completed' ? video.sensitivityStatus : video.processingStatus}</span>
                </div>

                {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 px-1 rounded text-xs z-10 pointer-events-none">
                        {Math.floor(video.duration / 60)}:{('0' + (video.duration % 60)).slice(-2)}
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-white truncate max-w-[80%]" title={video.title}>{video.title}</h3>
                    <div className="flex gap-2">
                        {user && user.role === 'admin' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAssign(video); }}
                                className="text-gray-500 hover:text-blue-500 transition-colors p-1"
                                title="Assign Viewers"
                            >
                                <FaUserPlus />
                            </button>
                        )}
                        {(user?.role === 'admin' || (isOwner && user?.role !== 'viewer')) && (
                            <button
                                onClick={handleDelete}
                                className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                title="Delete Video"
                            >
                                <FaTrash />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-400 mt-1 truncate">{video.description || 'No description'}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    <span>{video.user?.name}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {video.categories?.map((cat, idx) => (
                        <span key={idx} className="bg-gray-700 text-xs px-2 py-0.5 rounded-full text-gray-300">{cat}</span>
                    ))}
                </div>
                {video.sensitivityStatus === 'flagged' && video.flaggedReason && video.flaggedReason.replace(/[^a-zA-Z]/g, '').length > 0 && (
                    <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-1.5 rounded border border-red-900/50">
                        <span className="font-semibold">⚠️ Flagged:</span> {video.flaggedReason}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoItem;
