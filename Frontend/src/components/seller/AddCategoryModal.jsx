import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
    FiX,
    FiPlus,
    FiLayers,
    FiCheckCircle,
    FiRefreshCw,
    FiTag,
    FiFileText,
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';

const AddCategoryModal = ({ isOpen, onClose, onCategoryCreated }) => {
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        category_name: '',
        sub_category_name: '',
        description: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = form.category_name.trim();
        if (!trimmedName) {
            toast.error('Please enter a category name');
            return;
        }

        setSubmitting(true);
        try {
            const res = await ApiService.createSellerCategory({
                category_name: trimmedName,
                sub_category_name: form.sub_category_name.trim() || undefined,
                description: form.description.trim() || undefined,
            });

            if (res?.data?.success && res.data.data) {
                const { category, subCategory, isNew } = res.data.data;
                toast.success(
                    isNew
                        ? `New Category "${category.category_name}" created successfully!`
                        : `Category "${category.category_name}" selected!`
                );

                if (onCategoryCreated) {
                    onCategoryCreated(category, subCategory);
                }

                setForm({ category_name: '', sub_category_name: '', description: '' });
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white rounded-3xl border border-sky-100 shadow-2xl p-6 sm:p-7 overflow-hidden text-left">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 text-blue-600 flex items-center justify-center font-bold">
                            <FiLayers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Add Custom Category</h3>
                            <p className="text-xs text-slate-400">Create a new category for your products if not listed.</p>
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <FiTag className="text-blue-600 w-3.5 h-3.5" />
                            <span>Category Name <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.category_name}
                            onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                            placeholder="e.g. Smart Wearables, Footwear, Organic Snacks..."
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            This category will be stored in database and available to Admin and Customers too.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <FiLayers className="text-indigo-600 w-3.5 h-3.5" />
                            <span>Optional Sub-Category</span>
                        </label>
                        <input
                            type="text"
                            value={form.sub_category_name}
                            onChange={(e) => setForm({ ...form, sub_category_name: e.target.value })}
                            placeholder="e.g. Fitness Bands, Running Shoes (Optional)..."
                            className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <FiFileText className="text-slate-500 w-3.5 h-3.5" />
                            <span>Short Description</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            </div>
        </div>
    );
};

export default AddCategoryModal;
