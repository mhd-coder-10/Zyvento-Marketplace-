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

const EditSubCategory = () => {
    const navigate = useNavigate();
    const { code } = useParams();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url'
    const [subCategoryMeta, setSubCategoryMeta] = useState(null);
    const [formData, setFormData] = useState({
        sub_category_name: '',
        category_id: '',
        description: '',
        display_order: 0,
        status: 'active',
        sub_category_image: ''
    });
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Main Categories for parent dropdown
                const catRes = await ApiService.getAllCategories({ limit: 100 });
                if (catRes.data.success) {
                    setCategories(catRes.data.data || []);
                }

                // Fetch Sub-Category Data
                const res = await ApiService.getSubCategoryByCode(code);
                if (res.data.success) {
                    const data = res.data.data;
                    setSubCategoryMeta(data);
                    setFormData({
                        sub_category_name: data.sub_category_name || '',
                        category_id: data.category_id?._id || data.category_id || '',
                        description: data.description || '',
                        display_order: data.display_order ?? 0,
                        status: data.status || 'active',
                        sub_category_image: data.sub_category_image || ''
                    });
                    if (data.sub_category_image) {
                        setImagePreview(data.sub_category_image);
                    }
                }
            } catch (error) {
                toast.error('Failed to load sub-category data');
                navigate('/admin/sub-categories');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [code, navigate]);

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
                setFormData(prev => ({ ...prev, sub_category_image: uploadedUrl }));
                setImagePreview(uploadedUrl);
                toast.success('Sub-Category image uploaded successfully');
            }
        } catch (error) {
            toast.error('Upload failed. You can paste a direct URL instead.');
        } finally {
            setUploading(false);
        }
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setImagePreview(url);
        setFormData(prev => ({ ...prev, sub_category_image: url }));
    };

    const handleRemoveImage = () => {
        setImagePreview('');
        setFormData(prev => ({ ...prev, sub_category_image: '' }));
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!formData.sub_category_name.trim()) {
            toast.warning('Sub-Category name is required');
            return;
        }
        if (!formData.category_id) {
            toast.warning('Please select a parent Root Category');
            return;
        }

        setSaving(true);
        try {
            await ApiService.updateSubCategory(code, formData);
            toast.success(`Sub-Category "${formData.sub_category_name}" updated successfully`);
            navigate(`/admin/sub-categories/${code}`);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update sub-category');
        } finally {
            setSaving(false);
        }
    };

    const selectedParentCategory = categories.find(c => c._id === formData.category_id);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading sub-category details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Edit Sub-Category"
                subtitle={`Modify taxonomy settings, parent classification, and visibility for #${code}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/sub-categories/${code}`)}
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

                            {/* Section 1: Basic Taxonomy & Parent Category */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Sub-Category Information</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Specify name, classification code, and root category</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Sub-Category Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="sub_category_name"
                                            required
                                            value={formData.sub_category_name}
                                            onChange={handleChange}
                                            placeholder="e.g. Smart Watches & Wearables"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Parent Root Category <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                name="category_id"
                                                required
                                                value={formData.category_id}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition font-medium"
                                            >
                                                <option value="">Select Root Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat._id} value={cat._id}>
                                                        {cat.category_name} ({cat.category_code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Sub-Category Code <span className="text-slate-400 font-normal">(System)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={code}
                                                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-mono cursor-not-allowed select-all"
                                                />
                                                <FiLock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Sub-Category Description <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Detail the sub-category items, catalog criteria, and customer shopping guidelines..."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Visual Media Assets */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Sub-Category Image & Icon</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Upload a clean icon or photography badge</p>
                                    </div>

                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setImageInputMode('upload')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${imageInputMode === 'upload' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                        >
                                            File Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setImageInputMode('url')}
                                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${imageInputMode === 'url' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                                            {uploading ? 'Uploading to Cloudinary...' : 'Click or drop file to upload sub-category image'}
                                        </span>
                                        <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP, SVG up to 5MB (Square ratio recommended)</span>
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
                                            value={formData.sub_category_image}
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
                                            <p className="text-[11px] text-slate-500 truncate">{formData.sub_category_image || 'Local preview ready'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Marketplace Settings & Ordering */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Visibility & Priority</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Control order placement under parent category and active status</p>
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
                                        <p className="text-[11px] text-slate-400 mt-1">Lower numbers appear first within the parent category list.</p>
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
                                        <p className="text-[11px] text-slate-400 mt-1">Inactive sub-categories hide associated products from filtering.</p>
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
                                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time sub-category presentation</p>
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
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                                                {(formData.sub_category_name?.[0] || 'S').toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h5 className="font-bold text-slate-900 text-sm truncate">
                                                {formData.sub_category_name || 'Sub-Category Name'}
                                            </h5>
                                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 truncate max-w-full">
                                                {selectedParentCategory?.category_name || subCategoryMeta?.category_id?.category_name || 'Select Parent Category'}
                                            </span>
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
                                        <span className="font-semibold text-slate-800">Sub-Category (L2)</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Parent Category:</span>
                                        <span className="font-bold text-blue-600 truncate max-w-[140px]">
                                            {selectedParentCategory?.category_name || subCategoryMeta?.category_id?.category_name || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-100">
                                        <span className="text-slate-400">Products Included:</span>
                                        <span className="font-bold text-purple-600">{subCategoryMeta?.product_count ?? subCategoryMeta?.total_products ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-400">Total Orders:</span>
                                        <span className="font-bold text-slate-800">{subCategoryMeta?.total_orders ?? subCategoryMeta?.order_count ?? 0}</span>
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
                                    {saving ? 'Saving Changes...' : 'Save Sub-Category Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/sub-categories/${code}`)}
                                    className="w-full px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-50 transition"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/sub-categories/${code}`)}
                                    className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold pt-1"
                                >
                                    <FiExternalLink className="w-3.5 h-3.5" /> View Sub-Category Details
                                </button>
                            </div>

                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSubCategory;