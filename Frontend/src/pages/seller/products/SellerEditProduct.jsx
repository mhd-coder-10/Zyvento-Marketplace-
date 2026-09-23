import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    FiLoader,
    FiPlus,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AddCategoryModal from '../../../components/seller/AddCategoryModal';

const SellerEditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const [form, setForm] = useState({
        product_name: '',
        brand: '',
        description: '',
        category_id: '',
        sub_category_id: '',
        price: '',
        compare_at_price: '',
        sku: '',
        stock: 0,
        status: 'active',
        images: [''],
    });

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line
    }, [id]);

    useEffect(() => {
        if (form.category_id) {
            fetchSubCategories(form.category_id);
        } else {
            setSubCategories([]);
        }
    }, [form.category_id]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.allSettled([
                ApiService.getPublicCategories({ status: 'active' }),
                ApiService.getProductById(id),
            ]);

            if (catRes.status === 'fulfilled' && catRes.value?.data?.data) {
                const list = Array.isArray(catRes.value.data.data) ? catRes.value.data.data : catRes.value.data.data.categories || [];
                setCategories(list);
            }

            if (prodRes.status === 'fulfilled' && prodRes.value?.data?.data) {
                const p = prodRes.value.data.data;
                const imgUrls = Array.isArray(p.images)
                    ? p.images.map((img) => (typeof img === 'string' ? img : img.url || ''))
                    : [];

                setForm({
                    product_name: p.product_name || p.title || '',
                    brand: p.brand || '',
                    description: p.description || '',
                    category_id: p.category_id?._id || p.category_id || '',
                    sub_category_id: p.sub_category_id?._id || p.sub_category_id || '',
                    price: p.price || '',
                    compare_at_price: p.compare_at_price || '',
                    sku: p.sku || '',
                    stock: p.stock ?? p.quantity ?? 0,
                    status: p.status || 'active',
                    images: imgUrls.length ? imgUrls : [''],
                });
            } else {
                toast.error('Could not find product details');
            }
        } catch (err) {
            console.error('Failed to load product:', err);
            toast.error('Failed to load product data');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubCategories = async (catId) => {
        try {
            const res = await ApiService.getPublicSubCategories(catId);
            if (res?.data?.data) {
                const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.subCategories || [];
                setSubCategories(list);
            }
        } catch (err) {
            console.error('Failed to load subcategories:', err);
        }
    };

    const handleCategoryCreated = (newCategory, newSubCategory) => {
        if (!newCategory) return;
        const newCatId = newCategory._id || newCategory.id;
        setCategories((prev) => {
            const exists = prev.some((c) => (c._id || c.id) === newCatId);
            return exists ? prev : [newCategory, ...prev];
        });
        setForm((prev) => ({
            ...prev,
            category_id: newCatId,
            sub_category_id: newSubCategory ? (newSubCategory._id || newSubCategory.id) : prev.sub_category_id,
        }));
        if (newSubCategory) {
            const newSubId = newSubCategory._id || newSubCategory.id;
            setSubCategories((prev) => {
                const exists = prev.some((sc) => (sc._id || sc.id) === newSubId);
                return exists ? prev : [newSubCategory, ...prev];
            });
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
        if (!form.price || Number(form.price) <= 0) {
            toast.error('Please enter a valid price');
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
            sku: form.sku.trim(),
            stock: Number(form.stock || 0),
            status: form.status,
            images: validImages.map((url) => ({ url, is_primary: false })),
        };

        setSubmitting(true);
        try {
            const res = await ApiService.updateSellerProduct(id, payload);
            if (res?.data?.success) {
                toast.success('Product updated successfully!');
                navigate('/seller/products');
            } else {
                toast.error(res?.data?.message || 'Failed to update product');
            }
        } catch (err) {
            console.error('Update product error:', err);
            toast.error(err?.response?.data?.message || 'Failed to update product');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <FiLoader className="h-8 w-8 animate-spin text-sky-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500">Loading Product Information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <span>Seller Central</span>
                        <span>/</span>
                        <span>Inventory</span>
                        <span>/</span>
                        <span className="font-bold text-slate-800">Edit Product</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <FiEdit2 className="text-amber-500" />
                        Edit Listing: {form.product_name || 'Product Details'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Update vital listing information, stock quantity, variations, and pricing.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate('/seller/products')}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                    >
                        <FiArrowLeft className="h-3.5 w-3.5" />
                        <span>Cancel & Return</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* General Information */}
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
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
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
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiDollarSign className="text-emerald-600" />
                            Pricing & Stock
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
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Compare-at Price (₹)
                                </label>
                                <input
                                    type="number"
                                    name="compare_at_price"
                                    value={form.compare_at_price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={form.stock}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media */}
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
                                        placeholder="Image URL"
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

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <FiLayers className="text-sky-600" />
                                Category Organization
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowCategoryModal(true)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition"
                            >
                                <FiPlus className="h-3.5 w-3.5" />
                                + Add Custom
                            </button>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Primary Category
                                </label>
                            </div>
                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
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
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none disabled:opacity-50"
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
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
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
                                <span>{submitting ? 'Updating Product...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <AddCategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onCategoryCreated={handleCategoryCreated}
            />
        </div>
    );
};

export default SellerEditProduct;
