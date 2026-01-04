import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import socket from '../services/socket';
import Navbar from '../components/Navbar';
import VideoItem from '../components/VideoItem';
import UploadModal from '../components/UploadModal';
import AssignmentModal from '../components/AssignmentModal';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter } from 'react-icons/fa';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedVideoForAssignment, setSelectedVideoForAssignment] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        // console.log("isUploadOpen changed:", isUploadOpen);
    }, [isUploadOpen]);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/videos', {
                params: {
                    keyword,
                    status: statusFilter,
                    category: categoryFilter
                }
            });
            setVideos(data.videos);
        } catch (error) {
            toast.error('Failed to fetch videos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [keyword, statusFilter, categoryFilter]);

    useEffect(() => {
        if (!user) return;

        socket.on('video_processing', (data) => {
            // toast.info(`Video Update: ${data.msg}`);

            setVideos((prevVideos) => {
                return prevVideos.map((vid) => {
                    if (vid._id === data.videoId) {
                        return {
                            ...vid,
                            processingStatus: data.status,
                            sensitivityStatus: data.sensitivity || vid.sensitivityStatus,
                            flaggedReason: data.reason || vid.flaggedReason
                        };
                    }
                    return vid;
                });
            });

            if (data.status === 'completed') {
                toast.success(`Video Processing Completed: ${data.sensitivity}`);
                fetchVideos(); // Refresh to get full details like duration/thumbnail if backend updates them
            }
        });

        return () => {
            socket.off('video_processing');
        };
    }, [user]);

    const handleUploadSuccess = () => {
        fetchVideos();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar onUploadClick={() => setIsUploadOpen(true)} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-700 focus:border-blue-500 sm:text-sm"
                            placeholder="Search videos..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white"
                        >
                            <option value="">All Status</option>
                            <option value="safe">Safe</option>
                            <option value="flagged">Flagged</option>
                            <option value="pending">Pending</option>
                        </select>

                        <input
                            type="text"
                            className="block w-full px-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-700 focus:border-blue-500 sm:text-sm"
                            placeholder="Category"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* Video Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    </div>
                ) : (
                    <>
                        {videos.length === 0 ? (
                            <div className="text-center text-gray-500 py-20">No videos found. Upload one!</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {videos.map((video) => (
                                    <VideoItem key={video._id} video={video} onDelete={fetchVideos} onAssign={setSelectedVideoForAssignment} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
            {/* Assignment Modal */}
            {selectedVideoForAssignment && (
                <AssignmentModal
                    isOpen={!!selectedVideoForAssignment}
                    onClose={() => setSelectedVideoForAssignment(null)}
                    videoId={selectedVideoForAssignment._id}
                    currentAssigned={selectedVideoForAssignment.assignedViewers || []} // We need to populate this on backend or just send IDs
                />
            )}
        </div>
    );
};

export default Dashboard;
