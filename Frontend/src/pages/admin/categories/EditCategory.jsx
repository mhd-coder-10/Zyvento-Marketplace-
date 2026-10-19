import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSave, FiArrowLeft, FiRefreshCw, FiUploadCloud, FiX,
    FiPackage, FiGrid, FiLayers, FiCheckCircle, FiLock,
    FiExternalLink, FiEye, FiTag
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const EditCategory = () => {
    const navigate = useNavigate();
    const { categoryCode } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url'
    const [categoryMeta, setCategoryMeta] = useState(null);
    const [formData, setFormData] = useState({
        category_name: '',
        description: '',
        display_order: 0,
        status: 'active',
        category_image: ''
    });
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const res = await ApiService.getCategoryByCode(categoryCode);
                if (res.data.success) {
                    const data = res.data.data;
                    setCategoryMeta(data);
                    setFormData({
                        category_name: data.category_name || '',
                        description: data.description || '',
                        display_order: data.display_order ?? 0,
                        status: data.status || 'active',
                        category_image: data.category_image || ''
                    });
                    if (data.category_image) {
                        setImagePreview(data.category_image);
                    }
                }
            } catch (error) {
                toast.error('Failed to load category data');
                navigate('/admin/categories');
            } finally {
                setLoading(false);
            }
        };
        fetchCategory();
    }, [categoryCode, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                toast.success('Category image uploaded successfully');
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
            await ApiService.updateCategory(categoryCode, formData);
            toast.success(`Category "${formData.category_name}" updated successfully`);
            navigate(`/admin/categories/${categoryCode}`);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update category');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading category details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Edit Root Category"
                subtitle={`Modify taxonomy settings, banner media, and marketplace visibility for #${categoryCode}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/categories/${categoryCode}`)}
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
                            {saving ? 'Saving...' : 'Save Changes'}
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
                                            placeholder="e.g. Electronics & Gadgets"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Category Code <span className="text-slate-400 font-normal">(System Identifier)</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={categoryCode}
                                                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-mono cursor-not-allowed select-all"
                                                />
                                                <FiLock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            System-generated unique identifier used across marketplace APIs and catalog references.
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
                                            placeholder="Describe the category, primary product lines, and taxonomy guidelines..."
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
                                        <p className="text-xs text-slate-500 mt-0.5">Upload a high-resolution banner or category badge</p>
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
                                    <label className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                                        <FiUploadCloud className="w-9 h-9 text-slate-400 group-hover:text-blue-600 transition" />
                                        <span className="text-xs font-semibold text-slate-700 mt-2">
                                            {uploading ? 'Uploading to Cloudinary...' : 'Click or drop file to upload replacement image'}
                                        </span>
                                        <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP, SVG up to 5MB (Recommended: 800x800px)</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Direct Image URL
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.category_image}
                                            onChange={handleUrlChange}
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>
                                )}

                                {imagePreview && (
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition"
                                                title="Remove image"
                                            >
                                                <FiX className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">Image Attached</p>
                                            <p className="text-[11px] text-slate-500 truncate">{formData.category_image || 'Local preview ready'}</p>
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
                                                {formData.category_name || 'Category Name'}
                                            </h5>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{categoryCode}</p>
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

                            {/* Card 2: Hierarchy & Catalog Stats */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <FiLayers className="text-blue-600 w-4 h-4" /> Taxonomy Overview
                                </h4>
                                <div className="space-y-2 pt-2 text-slate-600">
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Hierarchy Level:</span>
                                        <span className="font-semibold text-slate-800">Root Category (L1)</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Products Included:</span>
                                        <span className="font-bold text-purple-600">{categoryMeta?.product_count ?? categoryMeta?.total_products ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Sub-Categories:</span>
                                        <span className="font-bold text-blue-600">{categoryMeta?.sub_category_count ?? categoryMeta?.sub_categories?.length ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-400">Total Orders:</span>
                                        <span className="font-bold text-slate-800">{categoryMeta?.total_orders ?? 0}</span>
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
                                    {saving ? 'Saving Changes...' : 'Save Category Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/categories/${categoryCode}`)}
                                    className="w-full px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-50 transition"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/categories/${categoryCode}`)}
                                    className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold pt-1"
                                >
                                    <FiExternalLink className="w-3.5 h-3.5" /> View Category Details Page
                                </button>
                            </div>

                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCategory;