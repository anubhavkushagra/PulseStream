import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { FaArrowLeft, FaThumbsUp, FaEye } from 'react-icons/fa';

const Player = () => {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true);
                // We reuse the list endpoint or specific ID endpoint (we might need to add getById route)
                // Since we didn't add specific GET /api/videos/:id in the simplified plan, let's just GET /api/videos 
                // with a filter or add the route. Adding the route is cleaner. 
                // For now, I'll filter client side or assume we'll fix backend.
                // Actually, let's fix backend or just use find() on the list if simplistic.
                // Better: I will implement a quick GetById in backend or just use the list endpoint with a query?
                // Let's assumet the backend GET /api/videos route can return all or we add a new one.
                // Wait, I implemented GET /api/videos with search. I did NOT implement GET /api/videos/:id. 
                // I should fix backend videoRoutes.js to include GET /:id.

                // Fetch specific video
                const { data } = await API.get(`/videos/${id}`);
                setVideo(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [id]);

    const videoRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!videoRef.current) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault(); // Prevent scrolling
                    if (videoRef.current.paused) {
                        videoRef.current.play();
                    } else {
                        videoRef.current.pause();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    videoRef.current.currentTime += 5;
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    videoRef.current.currentTime -= 5;
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (loading) return <div className="text-white p-10">Loading...</div>;
    if (!video) return <div className="text-white p-10">Video not found</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <Link to="/" className="flex items-center text-gray-400 hover:text-white mb-4">
                    <FaArrowLeft className="mr-2" /> Back to Dashboard
                </Link>

                <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-2xl mb-6">
                    <video
                        ref={videoRef}
                        controls
                        autoPlay
                        className="w-full h-full"
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/videos/${id}/stream`}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-700 pb-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
                        <div className="text-sm text-gray-400 flex items-center gap-4">
                            <span className="flex items-center gap-1"><FaEye /> {video.views} views</span>
                            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${video.sensitivityStatus === 'safe' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {video.sensitivityStatus.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        {/* Placeholder Actions */}
                        <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full">
                            <FaThumbsUp /> Like
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{video.description || "No description provided."}</p>
                    <div className="mt-4 flex gap-2">
                        {video.categories?.map((cat, idx) => (
                            <span key={idx} className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">{cat}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;
