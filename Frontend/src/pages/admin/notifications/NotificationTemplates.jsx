import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiFileText, FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw,
    FiCheck, FiX, FiLayers, FiTag, FiMail, FiSmartphone, FiBell,
    FiCopy, FiArrowLeft
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const DYNAMIC_VARIABLES = [
    { label: 'Customer Name', token: '{{customer_name}}' },
    { label: 'Seller Name', token: '{{seller_name}}' },
    { label: 'Order ID', token: '{{order_id}}' },
    { label: 'Product Name', token: '{{product_name}}' },
    { label: 'Amount', token: '{{amount}}' },
    { label: 'Tracking ID', token: '{{tracking_id}}' },
    { label: 'Coupon Code', token: '{{coupon_code}}' },
    { label: 'Request ID', token: '{{request_id}}' },
];

const NotificationTemplates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, code: null });

    const [formData, setFormData] = useState({
        template_code: '',
        name: '',
        category: 'order',
        title: '',
        priority: 'normal',
        channels: ['in_app', 'push', 'email'],
        body_in_app: '',
        body_push: '',
        body_email: '',
    });

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getNotificationTemplates({ limit: 100 });
            if (res.data?.success) {
                setTemplates(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load templates', err);
            toast.error('Failed to load notification templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const openCreateModal = () => {
        setEditingTemplate(null);
        setFormData({
            template_code: '',
            name: '',
            category: 'order',
            title: '',
            priority: 'normal',
            channels: ['in_app', 'push', 'email'],
            body_in_app: '',
            body_push: '',
            body_email: '',
        });
        setModalOpen(true);
    };

    const openEditModal = (tmpl) => {
        setEditingTemplate(tmpl);
        setFormData({
            template_code: tmpl.template_code,
            name: tmpl.name,
            category: tmpl.category || 'order',
            title: tmpl.title || '',
            priority: tmpl.priority || 'normal',
            channels: Array.isArray(tmpl.channels) && tmpl.channels.length > 0 ? tmpl.channels : ['in_app'],
            body_in_app: tmpl.body_in_app || '',
            body_push: tmpl.body_push || '',
            body_email: tmpl.body_email || '',
        });
        setModalOpen(true);
    };

    const handleChannelToggle = (channel) => {
        setFormData(prev => {
            const current = [...prev.channels];
            const idx = current.indexOf(channel);
            if (idx > -1) {
                if (current.length === 1) return prev;
                current.splice(idx, 1);
            } else {
                current.push(channel);
            }
            return { ...prev, channels: current };
        });
    };

    const handleInsertToken = (field, token) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field] ? `${prev[field]} ${token}` : token
        }));
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.title.trim()) {
            toast.warning('Template name and title are required');
            return;
        }

        setSubmitting(true);
        try {
            if (editingTemplate) {
                await ApiService.updateNotificationTemplate(editingTemplate.template_code, formData);
                toast.success('Notification template updated successfully');
            } else {
                await ApiService.createNotificationTemplate(formData);
                toast.success('New notification template created successfully');
            }
            setModalOpen(false);
            fetchTemplates();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save template');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTemplate = async () => {
        try {
            await ApiService.deleteNotificationTemplate(deleteConfirm.code);
            toast.success('Template deleted');
            setTemplates(prev => prev.filter(t => t.template_code !== deleteConfirm.code));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete template');
        } finally {
            setDeleteConfirm({ open: false, code: null });
        }
    };

    const filteredTemplates = templates.filter(t => {
        if (categoryFilter !== 'all' && (t.category || '').toLowerCase() !== categoryFilter) {
            return false;
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            const nameMatch = (t.name || '').toLowerCase().includes(q);
            const titleMatch = (t.title || '').toLowerCase().includes(q);
            const codeMatch = (t.template_code || '').toLowerCase().includes(q);
            if (!nameMatch && !titleMatch && !codeMatch) return false;
        }
        return true;
    });

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Notification Templates"
                subtitle="Reusable multi-channel templates with dynamic variable interpolation for automated and broadcast alerts"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchTemplates}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                            title="Refresh data"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-blue-200 text-sm"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Create Template</span>
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">
                {/* Search & Filter Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search templates by name, title, code..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-slate-400 font-medium">Category:</span>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            <option value="order">Order Updates</option>
                            <option value="product">Product & Stock</option>
                            <option value="seller">Seller Alerts</option>
                            <option value="customer">Customer Updates</option>
                            <option value="finance">Finance & Payouts</option>
                            <option value="system">System Alerts</option>
                        </select>
                    </div>
                </div>

                {/* Templates Grid */}
                {loading ? (
                    <div className="p-16 text-center">
                        <FiRefreshCw className="animate-spin text-sky-600 w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Loading templates...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-md mx-auto space-y-3">
                        <FiFileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No Templates Found</h3>
                        <p className="text-xs text-slate-500">No notification templates match your filters.</p>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
                        >
                            Create First Template
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map((t) => (
                            <div
                                key={t.template_code}
                                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                {t.category || 'General'}
                                            </span>
                                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                                {t.name}
                                            </h4>
                                        </div>
                                        {t.is_system ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex-shrink-0">
                                                System
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 flex-shrink-0">
                                                Custom
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700">
                                        <p className="font-semibold text-slate-800 mb-1">{t.title}</p>
                                        <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                                            {t.body_in_app || t.body_email || t.body_push}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1">
                                        {(t.channels || ['in_app']).map(ch => (
                                            <span key={ch} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 uppercase">
                                                {ch}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="font-mono text-[10px] text-slate-400">
                                        {t.template_code}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditModal(t)}
                                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                            title="Edit Template"
                                        >
                                            <FiEdit2 className="w-3.5 h-3.5" />
                                        </button>
                                        {!t.is_system && (
                                            <button
                                                onClick={() => setDeleteConfirm({ open: true, code: t.template_code })}
                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                title="Delete Template"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Template Create / Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">
                                {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create Notification Template'}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Template Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Order Shipped Notification"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    >
                                        <option value="order">Order & Shipping</option>
                                        <option value="product">Product & Inventory</option>
                                        <option value="seller">Seller & Verification</option>
                                        <option value="customer">Customer Updates</option>
                                        <option value="finance">Finance & Payments</option>
                                        <option value="system">System Alert</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Subject / Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Your Order #{{order_id}} has been shipped!"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>

                            {/* Variable Tokens */}
                            <div>
                                <span className="block font-semibold text-slate-500 text-[10px] uppercase mb-1">
                                    Click Variable to Insert into Body:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {DYNAMIC_VARIABLES.map(v => (
                                        <button
                                            key={v.token}
                                            type="button"
                                            onClick={() => handleInsertToken('body_in_app', v.token)}
                                            className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[10px] border border-sky-200"
                                        >
                                            {v.token}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* In-App Body */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Notification Body (In-App / General)
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.body_in_app}
                                    onChange={(e) => setFormData({ ...formData, body_in_app: e.target.value })}
                                    placeholder="Hi {{customer_name}}, your order {{order_id}} for {{product_name}} is on its way."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>

                            {/* Channel Checkboxes */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1.5">
                                    Supported Channels
                                </label>
                                <div className="flex gap-4">
                                    {['in_app', 'push', 'email'].map(ch => (
                                        <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.channels.includes(ch)}
                                                onChange={() => handleChannelToggle(ch)}
                                                className="rounded text-sky-600 focus:ring-sky-500"
                                            />
                                            <span className="capitalize">{ch === 'in_app' ? 'In-App' : ch}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : 'Save Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                title="Delete Template"
                message="Are you sure you want to delete this notification template? This action cannot be undone."
                confirmText="Delete Template"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={handleDeleteTemplate}
                onCancel={() => setDeleteConfirm({ open: false, code: null })}
            />
        </div>
    );
};

export default NotificationTemplates;
