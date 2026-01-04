import { useState, useEffect } from 'react';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const AdminAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await API.get('/videos/analytics');
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const COLORS = ['#10B981', '#EF4444']; // Green (Safe), Red (Flagged)

    if (loading) return <div className="text-white text-center mt-20">Loading Analytics...</div>;
    if (!analytics) return <div className="text-white text-center mt-20">Error loading data.</div>;

    const pieData = [
        { name: 'Safe Videos', value: analytics.safeVideos },
        { name: 'Flagged Videos', value: analytics.flaggedVideos }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold mb-8">Admin Analytics Dashboard</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-gray-400 text-sm uppercase">Total Videos</h3>
                        <p className="text-4xl font-bold mt-2">{analytics.totalVideos}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-red-500">
                        <h3 className="text-gray-400 text-sm uppercase">Flagged Videos</h3>
                        <p className="text-4xl font-bold mt-2 text-red-500">{analytics.flaggedVideos}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-green-500">
                        <h3 className="text-gray-400 text-sm uppercase">Safe Videos</h3>
                        <p className="text-4xl font-bold mt-2 text-green-500">{analytics.safeVideos}</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Pie Chart: Safety Overview */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Content Safety Overview</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: Flagged Reasons */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">Flagged Content Breakdown</h3>
                        {analytics.reasonData.length > 0 ? (
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.reasonData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="name" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" allowDecimals={false} />
                                        <Tooltip cursor={{ fill: '#374151' }} contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                                        <Bar dataKey="count" fill="#EF4444" barSize={50} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-gray-500">
                                No flagged content details available.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
