import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FiX,
    FiPlus,
    FiLayers,
    FiCheckCircle,
    FiRefreshCw,
    FiTag,
    FiFileText,
    FiChevronDown,
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';

const AddCategoryModal = ({
    isOpen,
    onClose,
    initialMode = 'category',
    selectedCategoryId = '',
    categories = [],
    onCategoryCreated,
    onSubCategoryCreated,
}) => {
    const [mode, setMode] = useState(initialMode); // 'category' | 'sub_category'
    const [submitting, setSubmitting] = useState(false);

    // Form state for Primary Category
    const [catForm, setCatForm] = useState({
        category_name: '',
        sub_category_name: '',
        description: '',
    });

    // Form state for Sub Category
    const [subForm, setSubForm] = useState({
        category_id: selectedCategoryId || (categories[0]?._id || categories[0]?.id || ''),
        sub_category_name: '',
        description: '',
    });

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode || 'category');
            if (selectedCategoryId) {
                setSubForm((prev) => ({ ...prev, category_id: selectedCategoryId }));
            } else if (categories.length > 0) {
                setSubForm((prev) => ({
                    ...prev,
                    category_id: prev.category_id || categories[0]._id || categories[0].id,
                }));
            }
        }
    }, [isOpen, initialMode, selectedCategoryId, categories]);

    if (!isOpen) return null;

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        const trimmedName = catForm.category_name.trim();
        if (!trimmedName) {
            toast.error('Please enter a primary category name');
            return;
        }

        setSubmitting(true);
        try {
            const res = await ApiService.createSellerCategory({
                category_name: trimmedName,
                sub_category_name: catForm.sub_category_name.trim() || undefined,
                description: catForm.description.trim() || undefined,
            });

            if (res?.data?.success && res.data.data) {
                const { category, subCategory, isNew } = res.data.data;
                toast.success(
                    isNew
                        ? `Primary Category "${category.category_name}" created successfully!`
                        : `Category "${category.category_name}" selected!`
                );

                if (onCategoryCreated) {
                    onCategoryCreated(category, subCategory);
                }

                setCatForm({ category_name: '', sub_category_name: '', description: '' });
                onClose();
            } else {
                toast.error(res?.data?.message || 'Failed to create category');
            }
        } catch (err) {
            console.error('Error creating category:', err);
            toast.error(err.response?.data?.message || 'Failed to create category');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubCategorySubmit = async (e) => {
        e.preventDefault();
        const catId = subForm.category_id;
        const trimmedSub = subForm.sub_category_name.trim();

        if (!catId) {
            toast.error('Please select a primary category');
            return;
        }
        if (!trimmedSub) {
            toast.error('Please enter a sub-category name');
            return;
        }

        setSubmitting(true);
        try {
            const res = await ApiService.createSellerSubCategory({
                category_id: catId,
                sub_category_name: trimmedSub,
                description: subForm.description.trim() || undefined,
            });

            if (res?.data?.success && res.data.data) {
                const { subCategory, category, isNewSub } = res.data.data;
                toast.success(
                    isNewSub
                        ? `Sub-category "${subCategory.sub_category_name}" created successfully!`
                        : `Sub-category "${subCategory.sub_category_name}" selected!`
                );

                if (onSubCategoryCreated) {
                    onSubCategoryCreated(subCategory, category);
                }

                setSubForm({
                    category_id: catId,
                    sub_category_name: '',
                    description: '',
                });
                onClose();
            } else {
                toast.error(res?.data?.message || 'Failed to create sub-category');
            }
        } catch (err) {
            console.error('Error creating sub-category:', err);
            toast.error(err.response?.data?.message || 'Failed to create sub-category');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white rounded-3xl border border-sky-100 shadow-2xl p-6 sm:p-7 overflow-hidden text-left">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 text-blue-600 flex items-center justify-center font-bold">
                            {mode === 'category' ? (
                                <FiLayers className="w-5 h-5" />
                            ) : (
                                <FiTag className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                {mode === 'category' ? 'Add Primary Category' : 'Add Sub-Category'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {mode === 'category'
                                    ? 'Create a new primary category for your products in the database.'
                                    : 'Add a new sub-category under your selected primary category.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="mt-4 flex rounded-xl bg-slate-100 p-1">
                    <button
                        type="button"
                        onClick={() => setMode('category')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                            mode === 'category'
                                ? 'bg-white text-sky-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <FiLayers className="w-3.5 h-3.5" />
                        <span>Primary Category</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('sub_category')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                            mode === 'sub_category'
                                ? 'bg-white text-sky-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <FiTag className="w-3.5 h-3.5" />
                        <span>Sub-Category</span>
                    </button>
                </div>

                {/* Form: Primary Category */}
                {mode === 'category' ? (
                    <form onSubmit={handleCategorySubmit} className="mt-5 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <FiLayers className="text-blue-600 w-3.5 h-3.5" />
                                <span>Category Name <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                required
                                value={catForm.category_name}
                                onChange={(e) => setCatForm({ ...catForm, category_name: e.target.value })}
                                placeholder="e.g. Smart Wearables, Footwear, Organic Snacks..."
                                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                This category will be stored in database and available across the entire platform.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <FiTag className="text-indigo-600 w-3.5 h-3.5" />
                                <span>Optional Sub-Category</span>
                            </label>
                            <input
                                type="text"
                                value={catForm.sub_category_name}
                                onChange={(e) => setCatForm({ ...catForm, sub_category_name: e.target.value })}
                                placeholder="e.g. Fitness Bands, Running Shoes (Optional)..."
                                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <FiFileText className="text-slate-500 w-3.5 h-3.5" />
                                <span>Short Description (Optional)</span>
                            </label>
                            <textarea
                                rows={2}
                                value={catForm.description}
                                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                                placeholder="Briefly describe what items fall under this category..."
                                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FiCheckCircle className="w-4 h-4" />
                                )}
                                <span>{submitting ? 'Saving...' : 'Save & Select Category'}</span>
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Form: Sub Category */
                    <form onSubmit={handleSubCategorySubmit} className="mt-5 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <FiLayers className="text-sky-600 w-3.5 h-3.5" />
                                <span>Primary Category <span className="text-rose-500">*</span></span>
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    value={subForm.category_id}
                                    onChange={(e) => setSubForm({ ...subForm, category_id: e.target.value })}
                                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all bg-white appearance-none pr-8"
                                >
                                    <option value="">Select Primary Category</option>
                                    {categories.map((c) => (
                                        <option key={c._id || c.id} value={c._id || c.id}>
                                            {c.category_name || c.name}
                                        </option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none w-3.5 h-3.5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <FiTag className="text-blue-600 w-3.5 h-3.5" />
                                <span>Sub-Category Name <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                required
                                value={subForm.sub_category_name}
                                onChange={(e) => setSubForm({ ...subForm, sub_category_name: e.target.value })}
                                placeholder="e.g. Duffel Bags, Trolley Bags, Cabin Luggage..."
                                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                This sub-category will be saved in the database under the selected primary category.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <FiFileText className="text-slate-500 w-3.5 h-3.5" />
                                <span>Short Description (Optional)</span>
                            </label>
                            <textarea
                                rows={2}
                                value={subForm.description}
                                onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                                placeholder="Briefly describe what items fall under this sub-category..."
                                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FiCheckCircle className="w-4 h-4" />
                                )}
                                <span>{submitting ? 'Saving...' : 'Save & Select Sub-Category'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddCategoryModal;
