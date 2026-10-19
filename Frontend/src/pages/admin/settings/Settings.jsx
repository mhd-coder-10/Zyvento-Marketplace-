// SUPER ADMIN SETTINGS HUB (Amazon-Grade Multi-Vendor Platform Controls)
// Robust draft state isolation: Inputs are kept in draft state until 'Save & Apply' is clicked.
// Active platform status displays saved server settings. Real-time platform sync on save.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
    FiSettings, FiGlobe, FiTruck, FiShoppingBag, FiDollarSign,
    FiShield, FiPercent, FiSave, FiRefreshCw, FiCheckCircle,
    FiAlertTriangle, FiInfo, FiSliders, FiClock, FiMail, FiPhone,
    FiCreditCard, FiSend, FiEye, FiCheck, FiLayers, FiX, FiRotateCcw
} from 'react-icons/fi';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ApiService from '../../../api/ApiService';
import { useSystemSettings } from '../../../context/SettingsContext';

const defaultSettings = {
    // GENERAL / BRANDING
    site_name: 'Zyvento Shopping',
    site_tagline: 'Discover Premium Deals & Trending Collections',
    announcement_text: '⚡ Free Shipping on prepaid orders above ₹499 | Express 48h Delivery | Easy 7-Day Returns',
    currency: 'INR',
    currency_symbol: '₹',
    support_email: 'support@zyvento.com',
    support_phone: '+91 1800-123-4567',
    maintenance_mode: false,

    // SHIPPING & FREIGHT
    free_shipping_threshold: 499,
    standard_delivery_fee: 49,
    express_delivery_fee: 99,
    estimated_delivery_days: 3,

    // ORDERS & CONSUMER POLICIES
    cod_enabled: true,
    min_order_amount: 99,
    max_order_amount: 200000,
    return_window_days: 7,
    allow_returns: true,
    allow_cancellation_until: 'dispatched',

    // MARKETPLACE & COMMISSION
    platform_commission_rate: 10,
    min_seller_payout_threshold: 1000,
    seller_auto_approval: true,

    // TAXES & GST
    platform_gstin: '27AABCZ1234F1Z5',
    default_gst_rate: 18,
    prices_inclusive_tax: true,

    // SECURITY & ACCESS GATES
    user_registration_enabled: true,
    seller_registration_enabled: true,
    guest_checkout_enabled: true,

    // PAYMENTS & COMMUNICATION
    razorpay_enabled: true,
    stripe_enabled: false,
    email_from_name: 'Zyvento Marketplace',
    email_from_address: 'notifications@zyvento.com',
    order_confirmation_email: true,
};

const groupFieldsMap = {
    general: ['site_name', 'site_tagline', 'announcement_text', 'currency', 'currency_symbol', 'support_email', 'support_phone', 'maintenance_mode'],
    shipping: ['free_shipping_threshold', 'standard_delivery_fee', 'express_delivery_fee', 'estimated_delivery_days'],
    order: ['cod_enabled', 'min_order_amount', 'max_order_amount', 'return_window_days', 'allow_returns', 'allow_cancellation_until'],
    commission: ['platform_commission_rate', 'min_seller_payout_threshold', 'seller_auto_approval'],
    tax: ['platform_gstin', 'default_gst_rate', 'prices_inclusive_tax'],
    security: ['user_registration_enabled', 'seller_registration_enabled', 'guest_checkout_enabled'],
    payment: ['razorpay_enabled', 'stripe_enabled', 'email_from_name', 'email_from_address', 'order_confirmation_email'],
};

const Settings = () => {
    const { refreshSettings } = useSystemSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState('draft'); // 'draft' or 'live'

    // Server source of truth (Active saved platform settings)
    const [savedSettings, setSavedSettings] = useState(defaultSettings);

    // Form working draft (Local changes waiting to be saved)
    const [formData, setFormData] = useState(defaultSettings);

    const tabs = [
        {
            id: 'general',
            label: 'General & Branding',
            icon: FiGlobe,
            description: 'Platform name, announcements, branding & emergency mode',
        },
        {
            id: 'shipping',
            label: 'Shipping & Delivery',
            icon: FiTruck,
            description: 'Free shipping threshold, standard & express freight charges',
        },
        {
            id: 'order',
            label: 'Orders & Policies',
            icon: FiShoppingBag,
            description: 'COD availability, min/max limits & customer return policy',
        },
        {
            id: 'commission',
            label: 'Marketplace & Fees',
            icon: FiPercent,
            description: 'Seller commission rates, payout limits & merchant onboarding',
        },
        {
            id: 'tax',
            label: 'Taxes & GST',
            icon: FiDollarSign,
            description: 'GST compliance, tax inclusive pricing & invoice details',
        },
        {
            id: 'security',
            label: 'Access & Security',
            icon: FiShield,
            description: 'Customer registration gates, guest checkouts & user security',
        },
        {
            id: 'payment',
            label: 'Payments & Email',
            icon: FiCreditCard,
            description: 'Gateway activations, notification sender, and order receipts',
        },
    ];

    // Load active settings from backend API
    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ApiService.getPublicSettings();
            if (res?.data?.success && res.data.data) {
                const loaded = {
                    ...defaultSettings,
                    ...res.data.data,
                };
                setSavedSettings(loaded);
                setFormData(loaded);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
            toast.error('Failed to load settings from server. Using cached platform defaults.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Input handlers with safe typing
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNumberChange = (field, value) => {
        // Keep string while user is typing/backspacing, convert when empty or valid number
        if (value === '') {
            setFormData((prev) => ({ ...prev, [field]: '' }));
        } else {
            const num = Number(value);
            setFormData((prev) => ({ ...prev, [field]: isNaN(num) ? value : num }));
        }
    };

    // Calculate modified fields for each group
    const getGroupDirtyFields = useCallback((group) => {
        const fields = groupFieldsMap[group] || [];
        return fields.filter((f) => {
            const current = formData[f];
            const saved = savedSettings[f];
            return String(current) !== String(saved);
        });
    }, [formData, savedSettings]);

    const isGroupDirty = useCallback((group) => {
        return getGroupDirtyFields(group).length > 0;
    }, [getGroupDirtyFields]);

    const totalDirtyCount = useMemo(() => {
        return tabs.reduce((acc, tab) => acc + getGroupDirtyFields(tab.id).length, 0);
    }, [tabs, getGroupDirtyFields]);

    // Discard unsaved changes for a single section
    const handleDiscardGroup = (group) => {
        const fields = groupFieldsMap[group] || [];
        setFormData((prev) => {
            const next = { ...prev };
            fields.forEach((f) => {
                next[f] = savedSettings[f];
            });
            return next;
        });
        toast.info(`Changes discarded for ${tabs.find((t) => t.id === group)?.label || group}`);
    };

    // Discard all unsaved changes
    const handleDiscardAll = () => {
        setFormData({ ...savedSettings });
        toast.info('All draft changes discarded. Reverted to active platform settings.');
    };

    // Build and validate clean payload for a group
    const buildGroupPayload = (group) => {
        const fields = groupFieldsMap[group] || [];
        const payload = {};

        for (const k of fields) {
            let val = formData[k];
            // Format number fields cleanly
            if (typeof defaultSettings[k] === 'number') {
                const parsed = Number(val);
                val = isNaN(parsed) ? defaultSettings[k] : parsed;
            } else if (typeof defaultSettings[k] === 'boolean') {
                val = Boolean(val);
            } else if (typeof val === 'string') {
                val = val.trim();
            }
            payload[k] = val;
        }

        // Section-specific validation
        if (group === 'general') {
            if (!payload.site_name) {
                throw new Error('Marketplace Store Name cannot be empty');
            }
        } else if (group === 'shipping') {
            if (payload.free_shipping_threshold < 0) throw new Error('Free shipping threshold cannot be negative');
            if (payload.standard_delivery_fee < 0) throw new Error('Standard delivery fee cannot be negative');
            if (payload.express_delivery_fee < 0) throw new Error('Express delivery fee cannot be negative');
        } else if (group === 'order') {
            if (payload.min_order_amount < 0) throw new Error('Minimum order amount cannot be negative');
            if (payload.max_order_amount < payload.min_order_amount) {
                throw new Error('Minimum order amount cannot exceed Maximum order amount');
            }
            if (payload.return_window_days < 0) throw new Error('Return window cannot be negative');
        } else if (group === 'commission') {
            if (payload.platform_commission_rate < 0 || payload.platform_commission_rate > 100) {
                throw new Error('Commission rate must be between 0% and 100%');
            }
            if (payload.min_seller_payout_threshold < 0) {
                throw new Error('Seller payout threshold cannot be negative');
            }
        }

        return payload;
    };

    // Save active tab's settings
    const handleSaveGroup = async (group) => {
        let payload;
        try {
            payload = buildGroupPayload(group);
        } catch (valErr) {
            toast.warning(valErr.message);
            return;
        }

        setSaving(true);
        try {
            const res = await ApiService.updateSettingsByGroup(group, payload);
            if (res?.data?.success) {
                // Update local savedSettings state to match newly applied payload
                setSavedSettings((prev) => ({
                    ...prev,
                    ...payload,
                }));
                // Harmonize formData with cleanly formatted payload
                setFormData((prev) => ({
                    ...prev,
                    ...payload,
                }));

                const tabLabel = tabs.find((t) => t.id === group)?.label || 'Settings';
                toast.success(`${tabLabel} saved & applied platform-wide! 🎉`);

                // Synchronize global context across Storefront, Header, Cart & Checkout
                await refreshSettings();
            } else {
                toast.error(res?.data?.message || 'Failed to save settings');
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to save settings. Please verify your connection.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // Save All Groups that have modified fields
    const handleSaveAll = async () => {
        const dirtyTabs = tabs.filter((t) => isGroupDirty(t.id));

        if (dirtyTabs.length === 0) {
            toast.info('No changes detected. Platform settings are already up to date.');
            return;
        }

        setSaving(true);
        try {
            let combinedSavedUpdates = {};

            // Save each modified group
            for (const tab of dirtyTabs) {
                const payload = buildGroupPayload(tab.id);
                const res = await ApiService.updateSettingsByGroup(tab.id, payload);
                if (res?.data?.success) {
                    combinedSavedUpdates = {
                        ...combinedSavedUpdates,
                        ...payload,
                    };
                }
            }

            // Update saved state
            setSavedSettings((prev) => ({
                ...prev,
                ...combinedSavedUpdates,
            }));
            setFormData((prev) => ({
                ...prev,
                ...combinedSavedUpdates,
            }));

            // Broadcast refresh platform-wide
            await refreshSettings();
            toast.success(`All settings (${dirtyTabs.length} section(s)) saved and synchronized successfully! 🎉`);
        } catch (err) {
            console.error('Save all failed:', err);
            toast.error(err.response?.data?.message || err.message || 'Error occurred while saving settings');
        } finally {
            setSaving(false);
        }
    };

    // Preview data selection: when mode is 'draft', preview reflects editable formData; when mode is 'live', preview reflects savedSettings
    const previewData = previewMode === 'draft' ? formData : savedSettings;
    const currentTabDirty = isGroupDirty(activeTab);
    const currentTabDirtyCount = getGroupDirtyFields(activeTab).length;

    return (
        <div className="space-y-6 pb-20">
            <AdminTopbar
                title="System Settings & Platform Rules"
                subtitle="Master configuration hub: changes are saved to draft first, and apply platform-wide when you click 'Save & Apply'"
            />

            {/* Top Active Platform Status - ALWAYS displays saved server settings */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Currently Active Platform Values (Live on Storefront)
                        </span>
                    </div>
                    {totalDirtyCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                            <FiAlertTriangle className="w-3.5 h-3.5" />
                            {totalDirtyCount} unsaved draft change{totalDirtyCount > 1 ? 's' : ''} pending
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <FiGlobe className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-blue-100">Live Marketplace Brand</p>
                                <p className="text-base font-black truncate max-w-[200px]">{savedSettings.site_name}</p>
                            </div>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                            Live
                        </span>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <FiTruck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-emerald-100">Free Freight Threshold</p>
                                <p className="text-base font-black">
                                    {savedSettings.currency_symbol}{savedSettings.free_shipping_threshold}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                            Live
                        </span>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600 to-pink-700 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <FiPercent className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-purple-100">Marketplace Take-Rate</p>
                                <p className="text-base font-black">{savedSettings.platform_commission_rate}% Platform Fee</p>
                            </div>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                            Live
                        </span>
                    </div>
                </div>
            </div>

            {/* Storefront Appearance Preview Box with Draft vs Live Switcher */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <FiEye className="text-sky-400 w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Storefront Appearance Preview
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            previewMode === 'draft' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                            {previewMode === 'draft' ? 'Previewing Draft Edits' : 'Showing Current Live Platform'}
                        </span>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 self-start sm:self-auto text-xs">
                        <button
                            type="button"
                            onClick={() => setPreviewMode('draft')}
                            className={`px-3 py-1 rounded-lg font-bold transition ${
                                previewMode === 'draft' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Draft Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode('live')}
                            className={`px-3 py-1 rounded-lg font-bold transition ${
                                previewMode === 'live' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Active Live
                        </button>
                    </div>
                </div>

                {/* Announcement Bar Preview */}
                <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 px-4 py-2 rounded-xl text-xs flex items-center justify-between text-white font-medium">
                    <div className="flex items-center gap-2 truncate">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">ANNOUNCEMENT</span>
                        <span className="truncate">{previewData.announcement_text || 'No announcement configured'}</span>
                    </div>
                    <span className="hidden sm:inline text-sky-200 text-[11px] shrink-0">
                        📞 {previewData.support_phone}
                    </span>
                </div>

                {/* Header Logo & Policies Preview */}
                <div className="flex flex-wrap items-center justify-between bg-slate-800/80 p-3 rounded-xl gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">
                            <FiShoppingBag />
                        </div>
                        <div>
                            <span className="font-extrabold text-sm text-white">{previewData.site_name}</span>
                            <span className="block text-[9px] uppercase tracking-widest text-sky-400 font-bold">{previewData.site_tagline}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold">
                            ✓ {previewData.return_window_days}-Day Easy Return Policy
                        </span>
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg font-bold">
                            🚚 Est. Delivery: {previewData.estimated_delivery_days} Days
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg font-bold border ${previewData.cod_enabled ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {previewData.cod_enabled ? 'COD Enabled' : 'COD Disabled'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Tabs and Form Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Navigation Sidebar Tabs (4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-3 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const dirtyCount = getGroupDirtyFields(tab.id).length;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-start justify-between p-3.5 rounded-2xl text-left transition-all ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                                }`}
                            >
                                <div className="flex items-start gap-3.5 min-w-0">
                                    <div className={`p-2 rounded-xl shrink-0 ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm leading-snug">{tab.label}</div>
                                        <div className={`text-[11px] leading-tight line-clamp-1 mt-0.5 ${
                                            isActive ? 'text-blue-100' : 'text-slate-400'
                                        }`}>
                                            {tab.description}
                                        </div>
                                    </div>
                                </div>

                                {dirtyCount > 0 && (
                                    <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                        {dirtyCount} edit{dirtyCount > 1 ? 's' : ''}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    <div className="pt-3 border-t border-slate-100 mt-2 space-y-2">
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            disabled={saving || loading || totalDirtyCount === 0}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <FiCheck className="w-4 h-4 text-emerald-400" />
                            {saving ? 'Syncing...' : `Save All Changes (${totalDirtyCount})`}
                        </button>

                        {totalDirtyCount > 0 && (
                            <button
                                type="button"
                                onClick={handleDiscardAll}
                                disabled={saving || loading}
                                className="w-full flex items-center justify-center gap-1.5 py-2 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl transition"
                            >
                                <FiRotateCcw className="w-3.5 h-3.5" />
                                Discard All Edits
                            </button>
                        )}
                    </div>
                </div>

                {/* Form Panels (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                    
                    {/* Tab Header with Status & Save Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-slate-900">
                                    {tabs.find((t) => t.id === activeTab)?.label}
                                </h2>
                                {currentTabDirty && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200">
                                        ● Unsaved Draft
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {tabs.find((t) => t.id === activeTab)?.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {currentTabDirty && (
                                <button
                                    type="button"
                                    onClick={() => handleDiscardGroup(activeTab)}
                                    disabled={saving || loading}
                                    className="px-3.5 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl border border-slate-200 transition"
                                >
                                    Discard
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleSaveGroup(activeTab)}
                                disabled={saving || loading}
                                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 ${
                                    currentTabDirty
                                        ? 'bg-blue-600 text-white shadow-blue-600/25 hover:bg-blue-700 animate-pulse'
                                        : 'bg-slate-800 text-white hover:bg-slate-900'
                                }`}
                            >
                                <FiSave className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save & Apply'}
                            </button>
                        </div>
                    </div>

                    {/* Unsaved Changes Banner Notice */}
                    {currentTabDirty && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-amber-900 text-xs">
                            <div className="flex items-center gap-2">
                                <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                    <strong>{currentTabDirtyCount} field(s) edited.</strong> Values are in draft state and will <u>not</u> affect customers until you click <strong>Save & Apply</strong>.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSaveGroup(activeTab)}
                                disabled={saving}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shrink-0 transition"
                            >
                                Save Now
                            </button>
                        </div>
                    )}

                    {/* TAB 1: GENERAL & BRANDING */}
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Marketplace Store Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.site_name || ''}
                                        onChange={(e) => handleInputChange('site_name', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="Zyvento Shopping"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: <span className="font-semibold text-slate-600">{savedSettings.site_name}</span>
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Currency Symbol & ISO Code
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={formData.currency_symbol || ''}
                                            onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none transition"
                                            placeholder="₹"
                                        />
                                        <input
                                            type="text"
                                            value={formData.currency || ''}
                                            onChange={(e) => handleInputChange('currency', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none transition"
                                            placeholder="INR"
                                        />
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active: <span className="font-semibold text-slate-600">{savedSettings.currency_symbol} ({savedSettings.currency})</span>
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Brand Tagline / Slogan
                                </label>
                                <input
                                    type="text"
                                    value={formData.site_tagline || ''}
                                    onChange={(e) => handleInputChange('site_tagline', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="Discover Premium Deals & Trending Collections"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Top Announcement Bar Text (Displayed store-wide)
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.announcement_text || ''}
                                    onChange={(e) => handleInputChange('announcement_text', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="⚡ Free Shipping on prepaid orders above ₹499 | Express 48h Delivery"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Customer Support Email
                                    </label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3.5 top-3 text-slate-400" />
                                        <input
                                            type="email"
                                            value={formData.support_email || ''}
                                            onChange={(e) => handleInputChange('support_email', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Toll-Free Support Helpline
                                    </label>
                                    <div className="relative">
                                        <FiPhone className="absolute left-3.5 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            value={formData.support_phone || ''}
                                            onChange={(e) => handleInputChange('support_phone', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Maintenance Toggle */}
                            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                                        <FiAlertTriangle className="text-rose-600" /> Maintenance Mode Killswitch
                                    </h4>
                                    <p className="text-xs text-rose-700 mt-0.5">
                                        When enabled and saved, non-admin visitors see a scheduled maintenance notice and checkout is paused.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.maintenance_mode)}
                                        onChange={(e) => handleInputChange('maintenance_mode', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: SHIPPING & DELIVERY */}
                    {activeTab === 'shipping' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-3 text-xs text-sky-800">
                                <FiInfo className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Amazon-grade Dynamic Freight Engine</p>
                                    <p className="mt-0.5">
                                        Carts reaching or exceeding the threshold automatically receive 100% Free Shipping. Currently saved live threshold: <strong>{savedSettings.currency_symbol}{savedSettings.free_shipping_threshold}</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Free Delivery Cart Threshold (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.free_shipping_threshold ?? ''}
                                        onChange={(e) => handleNumberChange('free_shipping_threshold', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="499"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: ₹{savedSettings.free_shipping_threshold}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Standard Delivery Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.standard_delivery_fee ?? ''}
                                        onChange={(e) => handleNumberChange('standard_delivery_fee', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="49"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: ₹{savedSettings.standard_delivery_fee}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Express Priority Shipping Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.express_delivery_fee ?? ''}
                                        onChange={(e) => handleNumberChange('express_delivery_fee', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Estimated Standard Delivery (Days)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimated_delivery_days ?? ''}
                                        onChange={(e) => handleNumberChange('estimated_delivery_days', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        placeholder="3"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Shown on product detail pages and checkout timeline
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ORDERS & POLICIES */}
                    {activeTab === 'order' && (
                        <div className="space-y-4">
                            {/* COD Toggle */}
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Cash on Delivery (COD) Payment Option
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        When enabled, customers can select Cash on Delivery at checkout. Current live state: <strong>{savedSettings.cod_enabled ? 'Active' : 'Disabled'}</strong>.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.cod_enabled)}
                                        onChange={(e) => handleInputChange('cod_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Minimum Order Amount to Checkout (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.min_order_amount ?? ''}
                                        onChange={(e) => handleNumberChange('min_order_amount', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none transition"
                                        placeholder="99"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: ₹{savedSettings.min_order_amount}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Maximum Order Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.max_order_amount ?? ''}
                                        onChange={(e) => handleNumberChange('max_order_amount', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none transition"
                                        placeholder="200000"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: ₹{savedSettings.max_order_amount}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Customer Return Window Duration (Days)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.return_window_days ?? ''}
                                        onChange={(e) => handleNumberChange('return_window_days', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none transition"
                                        placeholder="7"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: {savedSettings.return_window_days} Days
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Allow Cancellation Until Stage
                                    </label>
                                    <select
                                        value={formData.allow_cancellation_until || 'dispatched'}
                                        onChange={(e) => handleInputChange('allow_cancellation_until', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none transition"
                                    >
                                        <option value="pending">Pending Only</option>
                                        <option value="confirmed">Confirmed by Seller</option>
                                        <option value="dispatched">Before Dispatch</option>
                                    </select>
                                </div>
                            </div>

                            {/* Customer Returns Toggle */}
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Enable Platform Return Requests
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Allows buyers to open replacement and refund claims in My Orders.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.allow_returns)}
                                        onChange={(e) => handleInputChange('allow_returns', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: MARKETPLACE & COMMISSIONS */}
                    {activeTab === 'commission' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Default Platform Commission Rate (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.platform_commission_rate ?? ''}
                                            onChange={(e) => handleNumberChange('platform_commission_rate', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white outline-none transition"
                                            placeholder="10"
                                        />
                                        <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">%</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: <span className="font-bold text-slate-700">{savedSettings.platform_commission_rate}%</span> platform fee
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Minimum Seller Payout Threshold (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.min_seller_payout_threshold ?? ''}
                                        onChange={(e) => handleNumberChange('min_seller_payout_threshold', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white outline-none transition"
                                        placeholder="1000"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: ₹{savedSettings.min_seller_payout_threshold}
                                    </span>
                                </div>
                            </div>

                            {/* Auto Approval Toggle */}
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Auto-Approve New Merchant Registrations
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        If active, sellers can publish products immediately after completing KYC.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.seller_auto_approval)}
                                        onChange={(e) => handleInputChange('seller_auto_approval', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: TAXES & GST */}
                    {activeTab === 'tax' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Platform GSTIN Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.platform_gstin || ''}
                                        onChange={(e) => handleInputChange('platform_gstin', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white outline-none uppercase transition"
                                        placeholder="27AABCZ1234F1Z5"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: <span className="font-mono text-slate-700">{savedSettings.platform_gstin}</span>
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Standard GST Rate (%)
                                    </label>
                                    <select
                                        value={formData.default_gst_rate ?? 18}
                                        onChange={(e) => handleNumberChange('default_gst_rate', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none transition"
                                    >
                                        <option value={0}>0% (Tax Exempt)</option>
                                        <option value={5}>5% (Essential Goods)</option>
                                        <option value={12}>12% (Standard Low)</option>
                                        <option value={18}>18% (Standard High / Electronics)</option>
                                        <option value={28}>28% (Luxury & Automotive)</option>
                                    </select>
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Active saved: {savedSettings.default_gst_rate}%
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Display Catalog Prices Inclusive of GST
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Recommended for Indian retail consumer compliance (MRP inclusive).
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.prices_inclusive_tax)}
                                        onChange={(e) => handleInputChange('prices_inclusive_tax', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: SECURITY & ACCESS */}
                    {activeTab === 'security' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Allow Public Customer Registration
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Permit new buyers to create accounts self-service. If disabled, new user signups are paused.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.user_registration_enabled)}
                                        onChange={(e) => handleInputChange('user_registration_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Allow New Merchant / Seller Registration
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Permit new vendors to register and onboard into the Zyvento marketplace.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.seller_registration_enabled)}
                                        onChange={(e) => handleInputChange('seller_registration_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Enable Quick Guest Browsing & Cart Additions
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Allows unauthenticated users to assemble cart items before sign-in.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.guest_checkout_enabled)}
                                        onChange={(e) => handleInputChange('guest_checkout_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB 7: PAYMENTS & EMAIL */}
                    {activeTab === 'payment' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
                                <FiCreditCard className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Payment Gateway Orchestration</p>
                                    <p className="mt-0.5">Toggle payment methods available to customers during checkout. Saved configurations take effect immediately.</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Razorpay Payment Gateway (UPI, Cards, NetBanking)
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Enable seamless online payments for Indian buyers via Razorpay.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(formData.razorpay_enabled)}
                                            onChange={(e) => handleInputChange('razorpay_enabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Stripe International Payment Gateway
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Accept global cross-border credit card payments via Stripe.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(formData.stripe_enabled)}
                                            onChange={(e) => handleInputChange('stripe_enabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                                    Email Communications & Notifications
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Sender Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.email_from_name || ''}
                                            onChange={(e) => handleInputChange('email_from_name', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white outline-none transition"
                                            placeholder="Zyvento Marketplace"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Sender Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email_from_address || ''}
                                            onChange={(e) => handleInputChange('email_from_address', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white outline-none transition"
                                            placeholder="notifications@zyvento.com"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between mt-3">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Send Order Confirmation Email Receipts
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Automatically email buyers itemized invoices immediately after order placement.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(formData.order_confirmation_email)}
                                            onChange={(e) => handleInputChange('order_confirmation_email', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Save Action Bar */}
                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <FiCheckCircle className="text-emerald-500 shrink-0" />
                            {currentTabDirty ? (
                                <span className="text-amber-700 font-semibold">
                                    {currentTabDirtyCount} unsaved modification{currentTabDirtyCount > 1 ? 's' : ''} in this section
                                </span>
                            ) : (
                                <span>All settings in this section match the live active platform</span>
                            )}
                        </span>

                        <div className="flex items-center gap-2">
                            {currentTabDirty && (
                                <button
                                    type="button"
                                    onClick={() => handleDiscardGroup(activeTab)}
                                    disabled={saving || loading}
                                    className="px-4 py-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl border border-slate-200 transition"
                                >
                                    Discard Section
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleSaveGroup(activeTab)}
                                disabled={saving || loading}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                <FiSave className="w-4 h-4" />
                                {saving ? 'Saving...' : `Save & Apply ${tabs.find((t) => t.id === activeTab)?.label}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;