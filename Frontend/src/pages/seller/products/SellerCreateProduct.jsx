import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft,
    FiSave,
    FiPackage,
    FiDollarSign,
    FiTag,
    FiLayers,
    FiPlus,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AddCategoryModal from '../../../components/seller/AddCategoryModal';
import ProductImageUpload from '../../../components/seller/ProductImageUpload';

const SellerCreateProduct = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryModalMode, setCategoryModalMode] = useState('category'); // 'category' | 'sub_category'

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
        status: 'pending',
        images: [],
    });

    useEffect(() => {
        fetchCategories();
        fetchSellerBrand();
    }, []);

    const fetchSellerBrand = async () => {
        try {
            const res = await ApiService.getSellerProfile();
            if (res?.data?.success && res.data.data) {
                const s = res.data.data;
                const defaultBrand = s.brand_name || s.store_name || s.business_name || '';
                if (defaultBrand) {
                    setForm((prev) => ({
                        ...prev,
                        brand: prev.brand || defaultBrand,
                    }));
                }
            }
        } catch (_) {
            // Non-blocking
        }
    };

    useEffect(() => {
        if (form.category_id) {
            fetchSubCategories(form.category_id);
        } else {
            setSubCategories([]);
        }
    }, [form.category_id]);

    const fetchCategories = async () => {
        try {
            const res = await ApiService.getPublicCategories({ status: 'active' });
            if (res?.data?.data) {
                const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.categories || [];
                setCategories(list);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const fetchSubCategories = async (catId) => {
        if (!catId) {
            setSubCategories([]);
            return;
        }
        setLoadingSubCategories(true);
        try {
            const res = await ApiService.getPublicSubCategories(catId);
            if (res?.data?.data) {
                const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.subCategories || [];
                setSubCategories(list);
            } else {
                setSubCategories([]);
            }
        } catch (err) {
            console.error('Failed to load subcategories:', err);
            setSubCategories([]);
        } finally {
            setLoadingSubCategories(false);
        }
    };

    const handleCategoryCreated = (newCategory, newSubCategory) => {
        if (!newCategory) return;
        const newCatId = newCategory._id || newCategory.id;
        setCategories((prev) => {
            const exists = prev.some((c) => (c._id || c.id) === newCatId);
            return exists ? prev : [newCategory, ...prev];
        });
        const newSubId = newSubCategory ? (newSubCategory._id || newSubCategory.id) : '';
        setForm((prev) => ({
            ...prev,
            category_id: newCatId,
            sub_category_id: newSubId,
        }));
        if (newSubCategory) {
            setSubCategories([newSubCategory]);
        } else {
            fetchSubCategories(newCatId);
        }
    };

    const handleSubCategoryCreated = (newSubCategory, parentCategory) => {
        if (!newSubCategory) return;
        const newSubId = newSubCategory._id || newSubCategory.id;
        const parentCatId = parentCategory?._id || parentCategory?.id || form.category_id;

        if (parentCatId && form.category_id !== parentCatId) {
            setForm((prev) => ({
                ...prev,
                category_id: parentCatId,
                sub_category_id: newSubId,
            }));
            fetchSubCategories(parentCatId);
        } else {
            setSubCategories((prev) => {
                const exists = prev.some((sc) => (sc._id || sc.id) === newSubId);
                return exists ? prev : [...prev, newSubCategory];
            });
            setForm((prev) => ({
                ...prev,
                sub_category_id: newSubId,
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
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

        const validImages = (form.images || [])
            .map((img, idx) => {
                const url = typeof img === 'string' ? img.trim() : (img.url || '').trim();
                const is_primary = typeof img === 'object' && img.is_primary !== undefined ? img.is_primary : idx === 0;
                return { url, is_primary };
            })
            .filter((img) => img.url.length > 0);

        if (validImages.length === 0) {
            toast.error('Please attach at least one product photo');
            return;
        }

        if (validImages.length > 10) {
            toast.error('You can only attach up to 10 product photos');
            return;
        }

        // Put cover / primary image at the front
        const sortedImages = [
            ...validImages.filter((img) => img.is_primary),
            ...validImages.filter((img) => !img.is_primary),
        ];

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
            images: sortedImages,
        };

        setSubmitting(true);
        try {
            const res = await ApiService.createProductBySeller(payload);
            if (res?.data?.success) {
                toast.success('Product submitted for Super Admin approval!');
                navigate('/seller/products');
            } else {
                toast.error(res?.data?.message || 'Failed to create product');
            }
        } catch (err) {
            console.error('Create product error:', err);
            const errDetails = err?.response?.data?.errors;
            const errorMsg = Array.isArray(errDetails) && errDetails.length > 0
                ? errDetails.map((e) => e.message).join(', ')
                : (err?.response?.data?.message || 'Failed to create product');
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <span>Seller Central</span>
                        <span>/</span>
                        <span>Catalog</span>
                        <span>/</span>
                        <span className="font-bold text-slate-800">Add a Product</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <FiPackage className="text-amber-500" />
                        Add a New Product Listing
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Create a catalog offer with vital product info, pricing, SKU, and imagery.
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
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                        <ProductImageUpload
                            images={form.images}
                            onChange={(updatedImages) => setForm((prev) => ({ ...prev, images: updatedImages }))}
                            maxImages={10}
                        />
                    </div>
                </div>

                {/* Sidebar Organization Settings */}
                <div className="space-y-6">
                    {/* Category Selection */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <FiLayers className="text-sky-600" />
                                Category Organization
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setCategoryModalMode('category');
                                    setShowCategoryModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition"
                            >
                                <FiPlus className="h-3.5 w-3.5" />
                                Add Custom
                            </button>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Primary Category <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCategoryModalMode('category');
                                        setShowCategoryModal(true);
                                    }}
                                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                                >
                                    + Add New
                                </button>
                            </div>
                            <select
                                name="category_id"
                                value={form.category_id}
                                onChange={(e) => {
                                    if (e.target.value === '__add_new_category__') {
                                        setCategoryModalMode('category');
                                        setShowCategoryModal(true);
                                    } else {
                                        setForm((prev) => ({
                                            ...prev,
                                            category_id: e.target.value,
                                            sub_category_id: '',
                                        }));
                                    }
                                }}
                                required
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                            >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                    <option key={c._id || c.id} value={c._id || c.id}>
                                        {c.category_name || c.name}
                                    </option>
                                ))}
                                <option value="__add_new_category__" className="text-sky-600 font-bold bg-sky-50">
                                    ➕ + Add New Primary Category...
                                </option>
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Sub Category
                                </label>
                                {form.category_id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCategoryModalMode('sub_category');
                                            setShowCategoryModal(true);
                                        }}
                                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                                    >
                                        + Add Sub-Category
                                    </button>
                                )}
                            </div>
                            <select
                                name="sub_category_id"
                                value={form.sub_category_id}
                                onChange={(e) => {
                                    if (e.target.value === '__add_new_sub__') {
                                        setCategoryModalMode('sub_category');
                                        setShowCategoryModal(true);
                                    } else {
                                        handleChange(e);
                                    }
                                }}
                                disabled={!form.category_id || loadingSubCategories}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:bg-slate-50 bg-white"
                            >
                                {!form.category_id ? (
                                    <option value="">Select Primary Category First</option>
                                ) : loadingSubCategories ? (
                                    <option value="">Loading sub-categories...</option>
                                ) : (
                                    <>
                                        <option value="">
                                            {subCategories.length === 0
                                                ? 'No sub-categories yet (Click below to add)'
                                                : 'Select Sub Category'}
                                        </option>
                                        {subCategories.map((sc) => (
                                            <option key={sc._id || sc.id} value={sc._id || sc.id}>
                                                {sc.sub_category_name || sc.name}
                                            </option>
                                        ))}
                                        <option value="__add_new_sub__" className="text-sky-600 font-bold bg-sky-50">
                                            ➕ + Add New Sub-Category...
                                        </option>
                                    </>
                                )}
                            </select>
                            {form.category_id && !loadingSubCategories && subCategories.length === 0 && (
                                <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                                    <span>No sub-categories found. Click the dropdown or button above to add one.</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Listing Status & Approval Workflow */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiTag className="text-slate-600" />
                            Listing Status
                        </h3>

                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    Pending Approval
                                </span>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Newly created products are reviewed by Zyvento Super Admin before becoming live on the marketplace.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:from-sky-600 hover:to-blue-700 transition disabled:opacity-50"
                            >
                                <FiSave className="h-4 w-4" />
                                <span>{submitting ? 'Submitting Product...' : 'Submit for Approval'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <AddCategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                initialMode={categoryModalMode}
                selectedCategoryId={form.category_id}
                categories={categories}
                onCategoryCreated={handleCategoryCreated}
                onSubCategoryCreated={handleSubCategoryCreated}
            />
        </div>
    );
};

export default SellerCreateProduct;
