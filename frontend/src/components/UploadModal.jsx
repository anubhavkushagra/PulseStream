import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import API from '../services/api';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = (acceptedFiles) => {
        setFile(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': [] },
        multiple: false
    });

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return toast.error("File and Title are required");

        const formData = new FormData();
        formData.append('videoFile', file);
        formData.append('title', title);
        formData.append('description', description);
        if (category) formData.append('categories', category);

        setUploading(true);

        try {
            await API.post('/videos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });
            toast.success('Upload Successful! Processing started.');
            setFile(null);
            setTitle('');
            setDescription('');
            setCategory('');
            setProgress(0);
            onUploadSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload Failed');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg z-[1001] mx-4 overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
                    <h3 className="text-lg font-medium text-white">Upload Video</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimes />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleUpload} className="px-6 py-4">
                    {/* Dropzone */}
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-4 transition-colors ${isDragActive ? 'border-blue-500 bg-gray-700' : 'border-gray-600 hover:border-gray-500'}`}>
                        <input {...getInputProps()} />
                        {file ? (
                            <p className="text-green-400 font-medium">{file.name}</p>
                        ) : (
                            <div className="text-gray-400">
                                <FaCloudUploadAlt className="mx-auto text-4xl mb-2" />
                                <p>Drag & drop video, or click to select</p>
                            </div>
                        )}
                    </div>

                    {/* Title Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Video Title"
                            required
                        />
                    </div>

                    {/* Description Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-24"
                            placeholder="Video Description"
                        />
                    </div>

                    {/* Category Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Category (Optional)</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Education, Gaming"
                        />
                    </div>

                    {/* Progress Bar */}
                    {uploading && (
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            disabled={uploading}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
