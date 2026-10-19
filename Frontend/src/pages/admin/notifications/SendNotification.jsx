import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiSend, FiUsers, FiBell, FiMail,
    FiSmartphone, FiShield, FiTag, FiZap, FiInfo, FiCheck, FiX,
    FiExternalLink, FiImage, FiEye, FiCheckCircle, FiClock,
    FiFileText, FiLayers, FiAlertTriangle, FiCalendar, FiPlus
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

const SendNotification = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState('in_app'); // 'in_app' | 'push' | 'email'
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateCode, setSelectedTemplateCode] = useState('');

    const [dispatchType, setDispatchType] = useState('now'); // 'now' | 'scheduled' | 'draft'

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        notification_type: 'promotion',
        category: 'promotion',
        priority: 'normal',
        channels: ['in_app', 'push', 'email'],
        audience: 'all_customers',
        receiver_type: 'customer',
        target_role: 'admin',
        specific_id: '',
        action_url: '/coupons',
        action_label: 'Shop Deals Now',
        image_url: '',
        scheduled_for: '',
    });

    const [errors, setErrors] = useState({});

    // Fetch existing templates for autofill selector
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await ApiService.getNotificationTemplates({ limit: 50 });
                if (res.data?.success) {
                    setTemplates(res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load templates', err);
            }
        };
        fetchTemplates();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleChannelToggle = (channel) => {
        setFormData(prev => {
            const current = [...prev.channels];
            const index = current.indexOf(channel);
            if (index > -1) {
                if (current.length === 1) {
                    toast.warning('At least one notification channel must be enabled');
                    return prev;
                }
                current.splice(index, 1);
            } else {
                current.push(channel);
            }
            return { ...prev, channels: current };
        });
    };

    const handleApplyPreset = (preset) => {
        setFormData(prev => ({
            ...prev,
            action_url: preset.url,
            action_label: preset.cta
        }));
    };

    const handleInsertVariable = (token) => {
        setFormData(prev => ({
            ...prev,
            message: prev.message ? `${prev.message} ${token}` : token
        }));
    };

    const handleSelectTemplate = (e) => {
        const code = e.target.value;
        setSelectedTemplateCode(code);
        if (!code) return;

        const tmpl = templates.find(t => t.template_code === code);
        if (tmpl) {
            setFormData(prev => ({
                ...prev,
                title: tmpl.title || tmpl.name || prev.title,
                message: tmpl.body_in_app || tmpl.body_email || tmpl.body_push || prev.message,
                category: tmpl.category || prev.category,
                priority: tmpl.priority || prev.priority,
                channels: Array.isArray(tmpl.channels) && tmpl.channels.length > 0 ? tmpl.channels : prev.channels,
            }));
            toast.info(`Loaded template: "${tmpl.name}"`);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Notification title is required';
        else if (formData.title.length > 120) newErrors.title = 'Title should be under 120 characters';

        if (!formData.message.trim()) newErrors.message = 'Notification message body is required';
        else if (formData.message.length > 800) newErrors.message = 'Message should be under 800 characters';

        if (formData.channels.length === 0) newErrors.channels = 'Select at least one channel';

        if (dispatchType === 'scheduled') {
            if (!formData.scheduled_for) {
                newErrors.scheduled_for = 'Please specify a future date and time for scheduled dispatch';
            } else if (new Date(formData.scheduled_for).getTime() <= Date.now()) {
                newErrors.scheduled_for = 'Scheduled time must be in the future';
            }
        }

        if (['specific_customer', 'specific_seller', 'specific_users'].includes(formData.audience) && !formData.specific_id.trim()) {
            newErrors.specific_id = 'Please provide recipient ID(s)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (action = dispatchType) => {
        if (!validate()) {
            toast.warning('Please review form fields before submitting');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: formData.title.trim(),
                message: formData.message.trim(),
                category: formData.category,
                notification_type: formData.category,
                priority: formData.priority,
                channels: formData.channels,
                channel: formData.channels[0] || 'in_app',
                audience: formData.audience,
                receiver_type: formData.audience.includes('seller') ? 'seller' : formData.audience.includes('admin') ? 'admin' : 'customer',
                target_role: formData.audience === 'specific_role' ? formData.target_role : undefined,
                specific_id: formData.specific_id.trim() || undefined,
                action_url: formData.action_url.trim() || undefined,
                action_label: formData.action_label.trim() || undefined,
                status: action === 'draft' ? 'draft' : action === 'scheduled' ? 'scheduled' : 'sent',
                scheduled_for: action === 'scheduled' ? formData.scheduled_for : undefined,
                metadata: formData.image_url ? { image_url: formData.image_url.trim() } : {}
            };

            await ApiService.sendBroadcastNotification(payload);

            if (action === 'draft') {
                toast.success('Broadcast saved as Draft!');
            } else if (action === 'scheduled') {
                toast.success(`Broadcast successfully scheduled for ${new Date(formData.scheduled_for).toLocaleString()}!`);
            } else {
                toast.success('Broadcast notification dispatched successfully!');
            }

            navigate('/admin/notifications');
        } catch (error) {
            console.error('Failed to dispatch notification', error);
            toast.error(error.response?.data?.message || 'Failed to dispatch broadcast');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Create Broadcast Notification"
                subtitle="Compose and dispatch multi-channel announcements to customers, sellers, and marketplace staff"
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
                            onClick={() => handleSubmit(dispatchType)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm disabled:opacity-50"
                        >
                            <FiSend className="w-4 h-4" />
                            <span>{loading ? 'Dispatching...' : dispatchType === 'scheduled' ? 'Schedule Broadcast' : dispatchType === 'draft' ? 'Save Draft' : 'Send Broadcast'}</span>
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Form Column (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. Template & Audience Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiFileText className="w-4 h-4 text-blue-600" />
                                    <span>Template & Target Audience</span>
                                </h3>
                                <span className="text-[11px] font-medium text-slate-400">Step 1 of 3</span>
                            </div>

                            {/* Template Selector */}
                            {templates.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Load from Existing Template (Optional)
                                    </label>
                                    <select
                                        value={selectedTemplateCode}
                                        onChange={handleSelectTemplate}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                                    >
                                        <option value="">-- Choose a template to autofill --</option>
                                        {templates.map(t => (
                                            <option key={t.template_code} value={t.template_code}>
                                                {t.name} ({t.category})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Audience Picker */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Target Audience <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="audience"
                                        value={formData.audience}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                                    >
                                        <option value="all_customers">All Customers</option>
                                        <option value="all_sellers">All Sellers</option>
                                        <option value="seller_employees">Seller Staff / Employees</option>
                                        <option value="all_admins">All Marketplace Admins</option>
                                        <option value="specific_role">Specific Admin Role</option>
                                        <option value="specific_seller">Specific Seller</option>
                                        <option value="specific_customer">Specific Customer</option>
                                        <option value="specific_users">Specific User IDs</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Notification Category
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                                    >
                                        <option value="promotion">Marketing & Promotional Deals</option>
                                        <option value="order">Order & Shipping Notice</option>
                                        <option value="product">Product & Inventory Update</option>
                                        <option value="seller">Seller Notice & Payouts</option>
                                        <option value="customer">Customer Account & Reviews</option>
                                        <option value="finance">Finance & Payment Settlement</option>
                                        <option value="system">System Alert / Policy</option>
                                    </select>
                                </div>
                            </div>

                            {/* Specific Role or ID inputs if chosen */}
                            {formData.audience === 'specific_role' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Admin Role
                                    </label>
                                    <select
                                        name="target_role"
                                        value={formData.target_role}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                                    >
                                        <option value="admin">General Admin</option>
                                        <option value="finance_admin">Finance Admin</option>
                                        <option value="seller_admin">Seller Management Admin</option>
                                        <option value="support_admin">Support Admin</option>
                                        <option value="marketing_admin">Marketing Admin</option>
                                    </select>
                                </div>
                            )}

                            {['specific_customer', 'specific_seller', 'specific_users'].includes(formData.audience) && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Recipient ID(s) / Code <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="specific_id"
                                        value={formData.specific_id}
                                        onChange={handleChange}
                                        placeholder="Enter User ID, Seller Code, or comma-separated IDs"
                                        className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition ${
                                            errors.specific_id ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                        }`}
                                    />
                                    {errors.specific_id && (
                                        <p className="text-[11px] text-rose-500 mt-1">{errors.specific_id}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. Content & Variables Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiTag className="w-4 h-4 text-sky-600" />
                                    <span>Notification Message & Dynamic Tags</span>
                                </h3>
                                <span className="text-[11px] font-medium text-slate-400">Step 2 of 3</span>
                            </div>

                            {/* Title */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Title <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400">{formData.title.length}/120</span>
                                </div>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Mega Weekend Flash Sale: Up to 50% Off!"
                                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition ${
                                        errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                    }`}
                                />
                                {errors.title && (
                                    <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>
                                )}
                            </div>

                            {/* Dynamic Variable Chips */}
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Insert Dynamic Variable
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {DYNAMIC_VARIABLES.map(v => (
                                        <button
                                            key={v.token}
                                            type="button"
                                            onClick={() => handleInsertVariable(v.token)}
                                            className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-mono text-[11px] font-semibold border border-sky-200/60 transition active:scale-95 flex items-center gap-1"
                                        >
                                            <FiPlus className="w-3 h-3 text-sky-500" />
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Body */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Message Body <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400">{formData.message.length}/800</span>
                                </div>
                                <textarea
                                    name="message"
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Enter your broadcast announcement message. You can use dynamic variables like {{customer_name}} to personalize."
                                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition resize-y ${
                                        errors.message ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                    }`}
                                />
                                {errors.message && (
                                    <p className="text-[11px] text-rose-500 mt-1">{errors.message}</p>
                                )}
                            </div>

                            {/* Deep Link / Action URL */}
                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Deep Link & Action Button (Optional)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        name="action_url"
                                        value={formData.action_url}
                                        onChange={handleChange}
                                        placeholder="Action URL e.g. /products, /coupons"
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                                    />
                                    <input
                                        type="text"
                                        name="action_label"
                                        value={formData.action_label}
                                        onChange={handleChange}
                                        placeholder="Button Label e.g. Shop Now"
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                                    />
                                </div>

                                {/* Preset link chips */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-slate-400 font-medium mr-1">Presets:</span>
                                    {PRESET_DEEP_LINKS.map(p => (
                                        <button
                                            key={p.url}
                                            type="button"
                                            onClick={() => handleApplyPreset(p)}
                                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium transition"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Channels, Priority & Scheduling Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <FiSend className="w-4 h-4 text-sky-600" />
                                    <span>Channels, Priority & Dispatch Time</span>
                                </h3>
                                <span className="text-[11px] font-medium text-slate-400">Step 3 of 3</span>
                            </div>

                            {/* Multi-Channel Checkboxes */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    Notification Channels <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <label
                                        onClick={() => handleChannelToggle('in_app')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                                            formData.channels.includes('in_app')
                                                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${formData.channels.includes('in_app') ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <FiBell className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">In-App Alert</p>
                                            <p className="text-[10px] text-slate-400">Marketplace Bell & Center</p>
                                        </div>
                                    </label>

                                    <label
                                        onClick={() => handleChannelToggle('push')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                                            formData.channels.includes('push')
                                                ? 'bg-purple-50/70 border-purple-300 text-purple-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${formData.channels.includes('push') ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <FiSmartphone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">Mobile Push</p>
                                            <p className="text-[10px] text-slate-400">Lock Screen Push</p>
                                        </div>
                                    </label>

                                    <label
                                        onClick={() => handleChannelToggle('email')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                                            formData.channels.includes('email')
                                                ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${formData.channels.includes('email') ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                            <FiMail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">Email Message</p>
                                            <p className="text-[10px] text-slate-400">Branded Node Mailer</p>
                                        </div>
                                    </label>
                                </div>
                                {errors.channels && (
                                    <p className="text-[11px] text-rose-500 mt-1">{errors.channels}</p>
                                )}
                            </div>

                            {/* Priority Radio */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Priority Level
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'low', label: 'Low', desc: 'General updates', color: 'border-slate-200 peer-checked:border-slate-600 peer-checked:bg-slate-50' },
                                        { id: 'normal', label: 'Normal', desc: 'Promos & orders', color: 'border-slate-200 peer-checked:border-blue-500 peer-checked:bg-blue-50/60' },
                                        { id: 'high', label: 'High', desc: 'Urgent notices', color: 'border-slate-200 peer-checked:border-amber-500 peer-checked:bg-amber-50/60' },
                                        { id: 'critical', label: 'Critical', desc: 'Security & system', color: 'border-slate-200 peer-checked:border-rose-500 peer-checked:bg-rose-50/60' }
                                    ].map(p => (
                                        <label key={p.id} className="relative cursor-pointer">
                                            <input
                                                type="radio"
                                                name="priority"
                                                value={p.id}
                                                checked={formData.priority === p.id}
                                                onChange={handleChange}
                                                className="peer sr-only"
                                            />
                                            <div className={`p-2.5 rounded-xl border text-center transition ${p.color}`}>
                                                <p className="text-xs font-bold capitalize text-slate-800">{p.label}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Dispatch Mode (Now vs Scheduled vs Draft) */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Dispatch Timing
                                </label>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setDispatchType('now')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                                            dispatchType === 'now'
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Send Immediately
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDispatchType('scheduled')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                                            dispatchType === 'scheduled'
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Schedule for Later
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDispatchType('draft')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                                            dispatchType === 'draft'
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Save as Draft
                                    </button>
                                </div>
                            </div>

                            {/* Scheduled Datetime Picker */}
                            {dispatchType === 'scheduled' && (
                                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5">
                                    <label className="block text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                                        <FiCalendar className="w-4 h-4 text-indigo-600" />
                                        <span>Target Dispatch Date & Time</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="scheduled_for"
                                        value={formData.scheduled_for}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition ${
                                            errors.scheduled_for ? 'border-rose-400' : 'border-slate-200'
                                        }`}
                                    />
                                    {errors.scheduled_for && (
                                        <p className="text-[11px] text-rose-600">{errors.scheduled_for}</p>
                                    )}
                                    <p className="text-[10px] text-indigo-700/80">
                                        Our background scheduling engine will automatically process and dispatch this broadcast at the scheduled time.
                                    </p>
                                </div>
                            )}

                            {/* Action Submission Buttons */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('draft')}
                                    disabled={loading}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(dispatchType)}
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-200 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <FiSend className="w-3.5 h-3.5" />
                                    <span>
                                        {loading
                                            ? 'Processing...'
                                            : dispatchType === 'scheduled'
                                            ? 'Confirm & Schedule Broadcast'
                                            : dispatchType === 'draft'
                                            ? 'Save Draft'
                                            : 'Dispatch Broadcast Now'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Live Preview Column (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <FiEye className="w-4 h-4 text-sky-600" />
                                    <h3 className="text-sm font-bold text-slate-800">Live Channel Preview</h3>
                                </div>
                                <div className="flex p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('in_app')}
                                        className={`px-2 py-1 rounded-md transition ${previewMode === 'in_app' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
                                    >
                                        In-App
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('push')}
                                        className={`px-2 py-1 rounded-md transition ${previewMode === 'push' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'}`}
                                    >
                                        Push
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewMode('email')}
                                        className={`px-2 py-1 rounded-md transition ${previewMode === 'email' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
                                    >
                                        Email
                                    </button>
                                </div>
                            </div>

                            {/* Preview Window */}
                            {previewMode === 'in_app' && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>In-App Banner / Notification</span>
                                        <span>Just now</span>
                                    </div>
                                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-sky-50 text-sky-600 flex-shrink-0">
                                            <FiBell className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                                {formData.title || 'Broadcast Title Preview'}
                                            </h4>
                                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                                                {formData.message || 'Notification message body will appear here in real time.'}
                                            </p>
                                            {formData.action_label && (
                                                <div className="mt-2.5">
                                                    <span className="inline-block px-3 py-1 bg-sky-600 text-white text-[10px] font-bold rounded-lg shadow-xs">
                                                        {formData.action_label} →
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {previewMode === 'push' && (
                                <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 shadow-md">
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                                        <span>ZYVENTO MARKETPLACE • NOW</span>
                                        <FiSmartphone className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                                            {formData.title || 'Push Alert Headline'}
                                        </h4>
                                        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                                            {formData.message || 'Push notification preview text shows on lockscreen.'}
                                        </p>
                                    </div>
                                    <div className="text-[10px] text-sky-400 font-semibold pt-1">
                                        Slide or tap to view in Zyvento app
                                    </div>
                                </div>
                            )}

                            {previewMode === 'email' && (
                                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
                                    <div className="text-[11px] text-slate-500 font-medium">
                                        From: <span className="text-slate-800 font-semibold">Zyvento Marketplace &lt;noreply@zyvento.com&gt;</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                                        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                                            <span className="font-extrabold text-sm text-sky-600">ZYVENTO</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">{formData.category}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">
                                            {formData.title || 'Email Subject Line Preview'}
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                                            {formData.message || 'Email announcement body with dynamic personalization.'}
                                        </p>
                                        <div className="pt-2 text-center">
                                            <span className="inline-block px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs">
                                                {formData.action_label || 'View on Zyvento'}
                                            </span>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                                            Manage your email preferences in your Zyvento account settings.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Broadcast Summary Info Card */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
                                <p className="font-bold text-slate-800 text-xs">Broadcast Specs</p>
                                <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                                    <span className="text-slate-400">Audience:</span>
                                    <span className="font-semibold capitalize">{formData.audience.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                                    <span className="text-slate-400">Channels:</span>
                                    <span className="font-semibold uppercase">{formData.channels.join(' + ')}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-200/50">
                                    <span className="text-slate-400">Priority:</span>
                                    <span className="font-semibold uppercase">{formData.priority}</span>
                                </div>
                                <div className="flex justify-between py-0.5">
                                    <span className="text-slate-400">Timing:</span>
                                    <span className="font-semibold capitalize">
                                        {dispatchType === 'scheduled' ? `Scheduled (${new Date(formData.scheduled_for || Date.now()).toLocaleDateString()})` : dispatchType}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendNotification;