import { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';

const AssignmentModal = ({ isOpen, onClose, videoId, currentAssigned = [] }) => {
    const [viewers, setViewers] = useState([]);
    const [selectedViewers, setSelectedViewers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchViewers();
            setSelectedViewers(currentAssigned);
        }
    }, [isOpen, videoId]);

    const fetchViewers = async () => {
        try {
            const { data } = await API.get('/users/viewers');
            setViewers(data);
        } catch (error) {
            console.error("Failed to fetch viewers", error);
        }
    };

    const handleToggle = (viewerId) => {
        if (selectedViewers.includes(viewerId)) {
            setSelectedViewers(selectedViewers.filter(id => id !== viewerId));
        } else {
            setSelectedViewers([...selectedViewers, viewerId]);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await API.put(`/videos/${videoId}/assign`, { viewerIds: selectedViewers });
            toast.success('Assignments updated');
            onClose();
        } catch (error) {
            toast.error('Failed to update assignments');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Assign Viewers</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimes />
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto mb-4 border border-gray-700 rounded p-2">
                    {viewers.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No viewers found in the system.</p>
                    ) : (
                        viewers.map(viewer => (
                            <div
                                key={viewer._id}
                                className={`flex items-center p-2 mb-1 rounded cursor-pointer ${selectedViewers.includes(viewer._id) ? 'bg-blue-900' : 'hover:bg-gray-700'}`}
                                onClick={() => handleToggle(viewer._id)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedViewers.includes(viewer._id)}
                                    readOnly
                                    className="mr-3"
                                />
                                <div>
                                    <p className="text-white font-medium">{viewer.name}</p>
                                    <p className="text-gray-400 text-xs">{viewer.email}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Assignments'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentModal;
