import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiSave, FiSend, FiUsers, FiBell, FiMail, FiMessageSquare,
    FiSmartphone, FiShield, FiTag, FiZap, FiInfo, FiCheck, FiX,
    FiExternalLink, FiImage, FiEye, FiRefreshCw, FiCopy
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const PRESET_DEEP_LINKS = [
    { label: 'Deals & Coupons', url: '/coupons', cta: 'Claim Coupon' },
    { label: 'Product Catalog', url: '/products', cta: 'Shop Now' },
    { label: 'Customer Orders', url: '/orders', cta: 'Track Order' },
    { label: 'Seller Portal', url: '/seller/dashboard', cta: 'View Bulletin' },
    { label: 'Account Profile', url: '/profile', cta: 'Update Profile' },
];

const EditNotification = () => {
    const { notificationCode } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState('push'); // 'push' | 'in_app'

    const [notificationOriginal, setNotificationOriginal] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        notification_type: 'promotion',
        priority: 'medium',
        channel: 'in_app',
        receiver_type: 'customer',
        action_url: '',
        action_label: '',
        image_url: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchNotification();
    }, [notificationCode]);

    const fetchNotification = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getNotificationByCode(notificationCode);
            if (res.data?.success && res.data?.data) {
                const n = res.data.data;
                setNotificationOriginal(n);
                setFormData({
                    title: n.title || '',
                    message: n.message || '',
                    notification_type: n.notification_type || 'system',
                    priority: n.priority || 'medium',
                    channel: n.channel || 'in_app',
                    receiver_type: n.receiver_type || 'customer',
                    action_url: n.action_url || '',
                    action_label: n.action_label || '',
                    image_url: n.metadata?.image_url || ''
                });
            } else {
                toast.error('Notification not found');
                navigate('/admin/notifications');
            }
        } catch (error) {
            console.error('Failed to load notification', error);
            toast.error('Failed to load notification details');
            navigate('/admin/notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleApplyPreset = (preset) => {
        setFormData(prev => ({
            ...prev,
            action_url: preset.url,
            action_label: preset.cta
        }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Notification title is required';
        if (!formData.message.trim()) newErrors.message = 'Notification message body is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!validate()) {
            toast.warning('Please review form fields before saving');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: formData.title.trim(),
                message: formData.message.trim(),
                notification_type: formData.notification_type,
                priority: formData.priority,
                channel: formData.channel,
                receiver_type: formData.receiver_type,
                action_url: formData.action_url.trim() || undefined,
                action_label: formData.action_label.trim() || undefined,
                metadata: formData.image_url ? { image_url: formData.image_url.trim() } : {}
            };

            await ApiService.updateNotification(notificationCode, payload);
            toast.success(`Notification "${notificationCode}" updated successfully!`);
            navigate('/admin/notifications');
        } catch (error) {
            console.error('Failed to update notification', error);
            toast.error(error.response?.data?.message || 'Failed to update notification');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading notification details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Edit Notification Alert"
                subtitle={`Modifying broadcast parameters for: ${notificationCode}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/notifications')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm disabled:opacity-50"
                        >
                            <FiSave className="w-4 h-4" />
                            {submitting ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ====== 2-COLUMN RESPONSIVE GRID ====== */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ====== LEFT COLUMN: COMPOSER (2 Cols) ====== */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Card 1: Alert Identity & Message Content */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Message Content & Classification</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Edit title headline, announcement body, and priority classification</p>
                                    </div>
                                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                                        {notificationCode}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Broadcast Title <span className="text-rose-500">*</span>
                                            </label>
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {formData.title.length}/80 chars
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            maxLength={80}
                                            placeholder="Enter notification title"
                                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                                                errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                            }`}
                                        />
                                        {errors.title && (
                                            <p className="text-xs text-rose-500 mt-1">{errors.title}</p>
                                        )}
                                    </div>

                                    {/* Message Body */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Notification Message <span className="text-rose-500">*</span>
                                            </label>
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {formData.message.length}/300 chars
                                            </span>
                                        </div>
                                        <textarea
                                            name="message"
                                            rows={4}
                                            value={formData.message}
                                            onChange={handleChange}
                                            maxLength={300}
                                            placeholder="Type your message..."
                                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none ${
                                                errors.message ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                            }`}
                                        />
                                        {errors.message && (
                                            <p className="text-xs text-rose-500 mt-1">{errors.message}</p>
                                        )}
                                    </div>

                                    {/* Category & Priority */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Campaign Category
                                            </label>
                                            <select
                                                name="notification_type"
                                                value={formData.notification_type}
                                                onChange={handleChange}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                                            >
                                                <option value="promotion">Marketing Promotion & Deals</option>
                                                <option value="order">Order & Shipment Updates</option>
                                                <option value="system">System & Platform Policy</option>
                                                <option value="payment">Payment & Settlement Notice</option>
                                                <option value="seller">Seller & Merchant Bulletins</option>
                                                <option value="security">Security & Account Alerts</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Urgency & Priority Level
                                            </label>
                                            <select
                                                name="priority"
                                                value={formData.priority}
                                                onChange={handleChange}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                                            >
                                                <option value="critical">Critical (Immediate Top Banner Alert)</option>
                                                <option value="high">High (Prominent Inbox Placement)</option>
                                                <option value="medium">Normal / Standard Priority</option>
                                                <option value="low">Low (Silent Feed Delivery)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Target Audience & Delivery Channels */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Audience Segmentation & Dispatch Channels</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Control which user group receives this broadcast and via what device medium</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Audience Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Target Recipient Segment
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            {[
                                                { id: 'customer', label: 'Customers', sub: 'Shoppers & buyers', icon: FiUsers },
                                                { id: 'seller', label: 'Sellers', sub: 'Active merchants', icon: FiTag },
                                                { id: 'admin', label: 'Admins', sub: 'Operations team', icon: FiShield },
                                                { id: 'super_admin', label: 'Super Admins', sub: 'Executive staff', icon: FiZap }
                                            ].map((item) => {
                                                const Icon = item.icon;
                                                const isSelected = formData.receiver_type === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, receiver_type: item.id }))}
                                                        className={`p-3 rounded-xl border text-left transition ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                                                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                                        <span className="block text-xs font-bold">{item.label}</span>
                                                        <span className="block text-[10px] text-slate-400">{item.sub}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Channel Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Dispatch Delivery Channel
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            {[
                                                { id: 'in_app', label: 'In-App Center', desc: 'Bell dropdown', icon: FiBell },
                                                { id: 'push', label: 'Mobile Push', desc: 'Device screen alert', icon: FiSmartphone },
                                                { id: 'email', label: 'Email Broadcast', desc: 'HTML newsletter', icon: FiMail },
                                            ].map((item) => {
                                                const Icon = item.icon;
                                                const isSelected = formData.channel === item.id;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, channel: item.id }))}
                                                        className={`p-3 rounded-xl border text-left transition ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                                                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                                                        <span className="block text-xs font-bold">{item.label}</span>
                                                        <span className="block text-[10px] text-slate-400">{item.desc}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Deep Link & Call to Action (CTA) */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Destination Link & Call to Action (CTA)</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Destination target when the customer clicks this alert</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Presets */}
                                    <div>
                                        <span className="text-xs font-semibold text-slate-500 block mb-1.5">
                                            Quick Destination Presets:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {PRESET_DEEP_LINKS.map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleApplyPreset(preset)}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200/80 transition"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Action / Redirect URL
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="action_url"
                                                    value={formData.action_url}
                                                    onChange={handleChange}
                                                    placeholder="e.g. /coupons, /products/sale"
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pl-8"
                                                />
                                                <FiExternalLink className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Action Button Text
                                            </label>
                                            <input
                                                type="text"
                                                name="action_label"
                                                value={formData.action_label}
                                                onChange={handleChange}
                                                placeholder="e.g. Shop Now, Track Order"
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Optional Banner Image URL */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Optional Rich Media / Banner Image URL
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                name="image_url"
                                                value={formData.image_url}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pl-8"
                                            />
                                            <FiImage className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ====== RIGHT COLUMN: LIVE PREVIEW & SAVE (1 Col) ====== */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Card 1: Real-Time Smartphone & In-App Preview */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <FiEye className="w-3.5 h-3.5 text-blue-600" /> Live Preview
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Real-time customer view</p>
                                    </div>

                                    <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode('push')}
                                            className={`px-2.5 py-1 rounded-md transition ${previewMode === 'push' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                                        >
                                            Mobile Push
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode('in_app')}
                                            className={`px-2.5 py-1 rounded-md transition ${previewMode === 'in_app' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                                        >
                                            In-App
                                        </button>
                                    </div>
                                </div>

                                {previewMode === 'push' ? (
                                    /* Smartphone Lockscreen Push Simulation */
                                    <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-md border border-slate-800">
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                    Z
                                                </div>
                                                <span className="font-semibold text-slate-200">ZYVENTO</span>
                                            </div>
                                            <span>active</span>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-sm text-white leading-tight">
                                                {formData.title || 'Notification Headline'}
                                            </h5>
                                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                                {formData.message || 'Notification preview description text will render here.'}
                                            </p>
                                        </div>

                                        {formData.image_url && (
                                            <img
                                                src={formData.image_url}
                                                alt="Banner preview"
                                                className="w-full h-28 object-cover rounded-xl border border-slate-700 mt-2 bg-slate-800"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}

                                        {formData.action_label && (
                                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                                <span className="text-blue-400 font-semibold">{formData.action_label}</span>
                                                <span className="text-slate-500 text-[10px]">Tap to open</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* In-App Toast Simulation */
                                    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-white p-4 space-y-2.5 shadow-xs">
                                        <div className="flex items-start gap-2.5">
                                            <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                                                <FiBell className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                                                        {formData.notification_type}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">Now</span>
                                                </div>
                                                <h5 className="font-bold text-slate-900 text-xs mt-1 truncate">
                                                    {formData.title || 'In-App Alert'}
                                                </h5>
                                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                                                    {formData.message || 'Customer notification text will appear here.'}
                                                </p>
                                            </div>
                                        </div>

                                        {formData.action_label && (
                                            <button
                                                type="button"
                                                className="w-full py-1.5 px-3 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                                            >
                                                {formData.action_label}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Card 2: Technical Status */}
                            {notificationOriginal && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-2.5 text-xs">
                                    <h4 className="font-bold text-slate-800 text-sm">Delivery Status</h4>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Current Status:</span>
                                        <span className="font-bold text-slate-800 capitalize">{notificationOriginal.status}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Read State:</span>
                                        <span className="font-bold text-slate-800">
                                            {notificationOriginal.is_read ? 'Read by recipient' : 'Unread'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-500">Dispatched:</span>
                                        <span className="font-medium text-slate-700">
                                            {new Date(notificationOriginal.created_at).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Card 3: Action Buttons */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <FiSave className="w-4 h-4" />
                                    {submitting ? 'Saving Changes...' : 'Save Notification Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/notifications')}
                                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-sm transition border border-slate-200 flex items-center justify-center gap-2"
                                >
                                    <FiX className="w-4 h-4" /> Cancel
                                </button>
                            </div>

                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditNotification;
