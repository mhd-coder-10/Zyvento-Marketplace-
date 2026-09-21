import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft,
    FiSave,
    FiUploadCloud,
    FiX,
    FiPackage,
    FiDollarSign,
    FiTag,
    FiLayers,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const SellerCreateProduct = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    const [form, setForm] = useState({
        product_name: '',
        brand: '',
        description: '',
        category_id: '',
        sub_category_id: '',
        price: '',
        compare_at_price: '',
        cost_per_item: '',
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        stock: 10,
        status: 'active',
        images: [''],
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (form.category_id) {
            fetchSubCategories(form.category_id);
        } else {
            setSubCategories([]);
        }
    }, [form.category_id]);

    const fetchCategories = async () => {
        try {
            const res = await ApiService.getAllCategories({ limit: 100 });
            if (res?.data?.data) {
                const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.categories || [];
                setCategories(list);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const fetchSubCategories = async (catId) => {
        try {
            const res = await ApiService.getAllSubCategories({ categoryId: catId, limit: 100 });
            if (res?.data?.data) {
                const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.subCategories || [];
                setSubCategories(list);
            }
        } catch (err) {
            console.error('Failed to load subcategories:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleImageUrlChange = (index, value) => {
        const updated = [...form.images];
        updated[index] = value;
        setForm((prev) => ({ ...prev, images: updated }));
    };

    const addImageField = () => {
        setForm((prev) => ({ ...prev, images: [...prev.images, ''] }));
    };

    const removeImageField = (index) => {
        setForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.product_name.trim()) {
            toast.error('Product title is required');
            return;
        }
        if (!form.category_id) {
            toast.error('Please select a category');
            return;
        }
        if (!form.price || Number(form.price) <= 0) {
            toast.error('Please enter a valid price');
            return;
        }
        if (!form.sku.trim()) {
            toast.error('SKU is required');
            return;
        }

        const validImages = form.images.filter((img) => img.trim().length > 0);

        const payload = {
            product_name: form.product_name.trim(),
            brand: form.brand.trim() || undefined,
            description: form.description.trim(),
            category_id: form.category_id,
            sub_category_id: form.sub_category_id || undefined,
            price: Number(form.price),
            compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
            cost_per_item: form.cost_per_item ? Number(form.cost_per_item) : undefined,
            sku: form.sku.trim(),
            stock: Number(form.stock || 0),
            status: form.status,
            images: validImages.map((url) => ({ url, is_primary: false })),
        };

        setSubmitting(true);
        try {
            const res = await ApiService.createProductBySeller(payload);
            if (res?.data?.success) {
                toast.success('Product created successfully!');
                navigate('/seller/products');
            } else {
                toast.error(res?.data?.message || 'Failed to create product');
            }
        } catch (err) {
            console.error('Create product error:', err);
            toast.error(err?.response?.data?.message || 'Failed to create product');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <AdminTopbar
                title="Add New Product"
                subtitle="Create a new listing in your store catalog"
                actions={
                    <button
                        type="button"
                        onClick={() => navigate('/seller/products')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <FiArrowLeft className="h-4 w-4" />
                        <span>Back to Products</span>
                    </button>
                }
            />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Product Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Information Card */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiPackage className="text-sky-600" />
                            General Information
                        </h3>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Product Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="product_name"
                                value={form.product_name}
                                onChange={handleChange}
                                placeholder="e.g. Wireless Noise-Cancelling Headphones"
                                required
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Brand / Manufacturer
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={form.brand}
                                    onChange={handleChange}
                                    placeholder="e.g. Sony, Nike"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                rows={5}
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Provide detailed specifications, features, and key points of your product..."
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Pricing & Inventory Card */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiDollarSign className="text-emerald-600" />
                            Pricing & Inventory
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Selling Price (₹) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="999"
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Compare-at Price (MRP ₹)
                                </label>
                                <input
                                    type="number"
                                    name="compare_at_price"
                                    value={form.compare_at_price}
                                    onChange={handleChange}
                                    placeholder="1499"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Initial Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={form.stock}
                                    onChange={handleChange}
                                    placeholder="50"
                                    min="0"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Product Media / Images */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <FiUploadCloud className="text-indigo-600" />
                                Product Images (URLs)
                            </h3>
                            <button
                                type="button"
                                onClick={addImageField}
                                className="text-xs font-bold text-sky-600 hover:text-blue-700"
                            >
                                + Add Another Image URL
                            </button>
                        </div>

                        <div className="space-y-3">
                            {form.images.map((imgUrl, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="url"
                                        value={imgUrl}
                                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                                        placeholder="https://images.unsplash.com/... or hosted image URL"
                                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
                                    />
                                    {form.images.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeImageField(index)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                        >
                                            <FiX className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Organization Settings */}
                <div className="space-y-6">
                    {/* Category Selection */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiLayers className="text-sky-600" />
                            Category Organization
                        </h3>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Primary Category <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                    <option key={c._id || c.id} value={c._id || c.id}>
                                        {c.category_name || c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Sub Category
                            </label>
                            <select
                                name="sub_category_id"
                                value={form.sub_category_id}
                                onChange={handleChange}
                                disabled={!subCategories.length}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                            >
                                <option value="">Select Sub Category</option>
                                {subCategories.map((sc) => (
                                    <option key={sc._id || sc.id} value={sc._id || sc.id}>
                                        {sc.sub_category_name || sc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Listing Status & Save Action */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiTag className="text-slate-600" />
                            Listing Status
                        </h3>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                                <option value="active">Active (Publish immediately)</option>
                                <option value="draft">Draft (Save as draft)</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:from-sky-600 hover:to-blue-700 transition disabled:opacity-50"
                            >
                                <FiSave className="h-4 w-4" />
                                <span>{submitting ? 'Saving Product...' : 'Publish Product'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SellerCreateProduct;
