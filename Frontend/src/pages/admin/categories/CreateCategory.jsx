import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSave, FiArrowLeft, FiUpload } from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const CreateCategory = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ category_name: '', description: '', display_order: 0, status: 'active' });
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        const fd = new FormData();
        fd.append('image', file);
        const res = await ApiService.uploadCategoryImage(fd);
        if (res.data.success) {
            setImageUrl(res.data.data.url);
            setFormData(prev => ({ ...prev, category_image: res.data.data.url }));
        }
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url);
        setImagePreview(url);
        setFormData(prev => ({ ...prev, category_image: url }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await ApiService.createCategory(formData);
            toast.success('Category created successfully');
            navigate('/admin/categories');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white">
            <AdminTopbar
                title="Create Category"
                actions={
                    <button
                        onClick={() => navigate('/admin/categories')}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-xl bg-white shadow-sm hover:bg-blue-50 transition"
                    >
                        <FiArrowLeft /> Back
                    </button>
                }
            />
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800">Basic Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">Category Name *</label>
                            <input
                                type="text"
                                name="category_name"
                                required
                                value={formData.category_name}
                                onChange={handleChange}
                                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Display Order</label>
                            <input
                                type="number"
                                name="display_order"
                                value={formData.display_order}
                                onChange={handleChange}
                                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea
                                name="description"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                                className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex-1 border-2 border-dashed border-blue-200 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-50 transition">
                            <FiUpload className="mx-auto text-blue-600 mb-1" />
                            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                            <span className="text-xs font-semibold text-slate-600">Upload Image</span>
                        </label>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Or Image URL</label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={handleUrlChange}
                                placeholder="Paste image URL..."
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg border border-slate-200" />
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-sky-700 transition disabled:opacity-50"
                    >
                        <FiSave /> {saving ? 'Creating...' : 'Create Category'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateCategory;