import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSave, FiArrowLeft, FiUploadCloud, FiX, FiPackage,
    FiGrid, FiLayers, FiCheckCircle, FiEye, FiTag, FiCheck,
    FiInfo, FiSliders
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const CreateCategory = () => {
    const navigate = useNavigate();

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url'
    const [formData, setFormData] = useState({
        category_name: '',
        description: '',
        display_order: 0,
        status: 'active',
        category_image: ''
    });
    const [imagePreview, setImagePreview] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Auto-generate code preview from name
    const generatedSlugPreview = formData.category_name
        ? 'CAT-' + formData.category_name.trim().slice(0, 3).toUpperCase() + '-AUTO'
        : 'CAT-XXX-AUTO';

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImagePreview(URL.createObjectURL(file));
        setUploading(true);

        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await ApiService.uploadCategoryImage(fd);
            if (res.data.success) {
                const uploadedUrl = res.data.data?.url || res.data.data?.secure_url || res.data.data;
                setFormData(prev => ({ ...prev, category_image: uploadedUrl }));
                setImagePreview(uploadedUrl);
                toast.success('Category banner uploaded successfully');
            }
        } catch (error) {
            toast.error('Image upload failed. You can paste a direct URL instead.');
        } finally {
            setUploading(false);
        }
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setImagePreview(url);
        setFormData(prev => ({ ...prev, category_image: url }));
    };

    const handleRemoveImage = () => {
        setImagePreview('');
        setFormData(prev => ({ ...prev, category_image: '' }));
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!formData.category_name.trim()) {
            toast.warning('Category name is required');
            return;
        }

        setSaving(true);
        try {
            const res = await ApiService.createCategory(formData);
            if (res.data.success) {
                toast.success(`Root Category "${formData.category_name}" created successfully`);
                navigate('/admin/categories');
            } else {
                throw new Error(res.data.message);
            }
        } catch (error) {
            console.error('Failed to create category', error);
            toast.error(error?.response?.data?.message || 'Failed to create category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Create Root Category"
                subtitle="Add a new top-level classification to the marketplace product catalog"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/categories')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving || uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm disabled:opacity-50"
                        >
                            <FiSave className="w-4 h-4" />
                            {saving ? 'Creating...' : 'Create Category'}
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ====== 2-COLUMN RESPONSIVE GRID ====== */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ====== LEFT COLUMN: MAIN FORM SECTIONS (2 Cols) ====== */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Section 1: Basic Taxonomy Information */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Taxonomy Information</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Core identification details for this root product category</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Category Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="category_name"
                                            required
                                            value={formData.category_name}
                                            onChange={handleChange}
                                            placeholder="e.g. Electronics & Gadgets, Fashion & Apparel"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Category Code Preview <span className="text-slate-400 font-normal">(Auto-Generated on Save)</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                disabled
                                                value={generatedSlugPreview}
                                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-mono cursor-not-allowed select-all"
                                            />
                                            <FiTag className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            A unique permanent code will be automatically assigned upon creation for catalog APIs and indexing.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Category Description <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Describe the category, primary product types, and taxonomy guidelines..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Visual Assets & Banner Image */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Category Banner & Icon</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Upload a high-resolution banner image or category badge</p>
                                    </div>

                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setImageInputMode('upload')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                                                imageInputMode === 'upload' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            File Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setImageInputMode('url')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                                                imageInputMode === 'url' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Image URL
                                        </button>
                                    </div>
                                </div>

                                {imageInputMode === 'upload' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Upload Media File
                                        </label>
                                        <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center transition bg-slate-50/50">
                                            <input
                                                type="file"
                                                id="category-file-upload"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleUpload}
                                                disabled={uploading}
                                            />
                                            <label
                                                htmlFor="category-file-upload"
                                                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                                            >
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                                    <FiUploadCloud className="w-6 h-6" />
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    <span className="font-semibold text-blue-600 hover:underline">Click to upload</span> or drag and drop
                                                </div>
                                                <p className="text-[11px] text-slate-400">PNG, JPG, WebP or SVG up to 5MB (1:1 or 16:9 recommended)</p>
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Direct Image URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.category_image}
                                            onChange={handleUrlChange}
                                            placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>
                                )}

                                {/* Image Preview Display */}
                                {imagePreview && (
                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Selected Media Preview
                                        </label>
                                        <div className="relative inline-block border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs p-1">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-32 w-48 object-cover rounded-xl"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition shadow-sm"
                                                title="Remove Image"
                                            >
                                                <FiX className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Marketplace Settings & Ordering */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Visibility & Priority</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Control storefront listing position and active state</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Display Order Priority
                                        </label>
                                        <input
                                            type="number"
                                            name="display_order"
                                            value={formData.display_order}
                                            onChange={handleChange}
                                            min="0"
                                            placeholder="0"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1">Lower numbers appear first in the customer navigation menu.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Marketplace Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                                        >
                                            <option value="active">Active (Visible in Marketplace)</option>
                                            <option value="inactive">Inactive (Hidden from Customers)</option>
                                        </select>
                                        <p className="text-[11px] text-slate-400 mt-1">Inactive categories hide associated products from search.</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ====== RIGHT COLUMN: PREVIEW & ACTIONS (1 Col) ====== */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Card 1: Live Marketplace Card Preview */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiEye className="w-3.5 h-3.5 text-blue-600" /> Live Preview
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time storefront category appearance</p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 transition hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white shrink-0 shadow-xs"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                                                {(formData.category_name?.[0] || 'C').toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h5 className="font-bold text-slate-900 text-sm truncate">
                                                {formData.category_name || 'New Category Name'}
                                            </h5>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{generatedSlugPreview}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                        {formData.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                                            </span>
                                        )}
                                        <span className="text-[11px] text-slate-500 font-medium">
                                            Priority: <strong>#{formData.display_order}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Guidelines & Checklist */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <FiInfo className="text-blue-600 w-4 h-4" /> Category Checklist
                                </h4>
                                <div className="space-y-2.5 pt-2 text-slate-600">
                                    <div className="flex items-start gap-2">
                                        <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Use broad, distinct category titles that avoid overlapping with existing departments.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>High-resolution banners increase customer click-through by 35% on the homepage.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Once created, you can attach child sub-categories from the Sub-Categories module.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Action Buttons */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
                                <button
                                    type="submit"
                                    disabled={saving || uploading}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition disabled:opacity-50"
                                >
                                    <FiSave className="w-4 h-4" />
                                    {saving ? 'Creating Category...' : 'Create Root Category'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/categories')}
                                    className="w-full px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-50 transition"
                                >
                                    Cancel & Return
                                </button>
                            </div>

                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCategory;