// SUPER ADMIN SETTINGS HUB (Amazon-Grade Platform Controls)
// Real-time synchronization across the entire Marketplace (Header, Cart, Checkout, Policies)

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
    FiSettings, FiGlobe, FiTruck, FiShoppingBag, FiDollarSign,
    FiShield, FiPercent, FiSave, FiRefreshCw, FiCheckCircle,
    FiAlertTriangle, FiInfo, FiSliders, FiClock, FiMail, FiPhone
} from 'react-icons/fi';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ApiService from '../../../api/ApiService';
import { useSystemSettings } from '../../../context/SettingsContext';

const Settings = () => {
    const { refreshSettings } = useSystemSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state dictionary by group
    const [formData, setFormData] = useState({
        // GENERAL
        site_name: 'Zyvento Shopping',
        site_tagline: 'Discover Premium Deals & Trending Collections',
        announcement_text: '⚡ Free Shipping on prepaid orders above ₹499 | Express 48h Delivery | Easy 7-Day Returns',
        currency: 'INR',
        currency_symbol: '₹',
        support_email: 'support@zyvento.com',
        support_phone: '+91 1800-123-4567',
        maintenance_mode: false,

        // SHIPPING
        free_shipping_threshold: 499,
        standard_delivery_fee: 49,
        express_delivery_fee: 99,
        estimated_delivery_days: 3,

        // ORDER
        cod_enabled: true,
        min_order_amount: 99,
        max_order_amount: 200000,
        return_window_days: 7,
        allow_cancellation_until: 'dispatched',

        // COMMISSION
        platform_commission_rate: 10,
        min_seller_payout_threshold: 1000,
        seller_auto_approval: true,

        // TAX
        platform_gstin: '27AABCZ1234F1Z5',
        default_gst_rate: 18,
        prices_inclusive_tax: true,

        // SECURITY
        user_registration_enabled: true,
        guest_checkout_enabled: true,
    });

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
            description: 'COD availability, min order constraints & customer return policy',
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
    ];

    // Load settings for the active group or all public settings
    const loadGroupSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ApiService.getPublicSettings();
            if (res?.data?.success && res.data.data) {
                setFormData((prev) => ({
                    ...prev,
                    ...res.data.data,
                }));
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroupSettings();
    }, [loadGroupSettings]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Save active tab's settings
    const handleSaveGroup = async (group) => {
        setSaving(true);
        try {
            // Pick only fields belonging to this group
            const groupFields = {
                general: ['site_name', 'site_tagline', 'announcement_text', 'currency', 'currency_symbol', 'support_email', 'support_phone', 'maintenance_mode'],
                shipping: ['free_shipping_threshold', 'standard_delivery_fee', 'express_delivery_fee', 'estimated_delivery_days'],
                order: ['cod_enabled', 'min_order_amount', 'max_order_amount', 'return_window_days', 'allow_cancellation_until'],
                commission: ['platform_commission_rate', 'min_seller_payout_threshold', 'seller_auto_approval'],
                tax: ['platform_gstin', 'default_gst_rate', 'prices_inclusive_tax'],
                security: ['user_registration_enabled', 'guest_checkout_enabled'],
            }[group] || [];

            const payload = {};
            for (const k of groupFields) {
                if (formData[k] !== undefined) {
                    payload[k] = formData[k];
                }
            }

            const res = await ApiService.updateSettingsByGroup(group, payload);
            if (res.data.success) {
                toast.success(`${tabs.find(t => t.id === group)?.label || 'Settings'} saved & applied platform-wide!`);
                await refreshSettings();
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            toast.error(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <AdminTopbar
                title="System Settings"
                subtitle="Amazon-grade configuration hub: changes apply instantly across the entire platform"
            />

            {/* Quick Banner Alert */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/70 p-4 rounded-2xl text-xs sm:text-sm text-blue-900 shadow-sm">
                <FiInfo className="w-5 h-5 text-blue-600 shrink-0" />
                <p>
                    <strong>Global Synchronization:</strong> Changes saved here (such as Free Shipping Threshold, COD availability, Store Name, and Delivery Fees) immediately take effect on the storefront, header, shopping cart, and customer checkout.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Navigation Sidebar Tabs (4 cols) */}
                <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-3 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl text-left transition-all ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                                }`}
                            >
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
                            </button>
                        );
                    })}
                </div>

                {/* Form Panels (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                    
                    {/* Tab Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {tabs.find(t => t.id === activeTab)?.description}
                            </p>
                        </div>
                        <button
                            onClick={() => handleSaveGroup(activeTab)}
                            disabled={saving || loading}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <FiSave className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save & Apply'}
                        </button>
                    </div>

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
                                        value={formData.site_name}
                                        onChange={(e) => handleInputChange('site_name', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Zyvento Shopping"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Currency Symbol & Code
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={formData.currency_symbol}
                                            onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none"
                                            placeholder="₹"
                                        />
                                        <input
                                            type="text"
                                            value={formData.currency}
                                            onChange={(e) => handleInputChange('currency', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none"
                                            placeholder="INR"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Brand Tagline
                                </label>
                                <input
                                    type="text"
                                    value={formData.site_tagline}
                                    onChange={(e) => handleInputChange('site_tagline', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Discover Premium Deals & Trending Collections"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Top Announcement Bar Text (Displayed store-wide)
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.announcement_text}
                                    onChange={(e) => handleInputChange('announcement_text', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                                            value={formData.support_email}
                                            onChange={(e) => handleInputChange('support_email', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                                            value={formData.support_phone}
                                            onChange={(e) => handleInputChange('support_phone', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                                        When enabled, non-admin visitors see a scheduled maintenance notice.
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
                                    <p className="font-bold">Amazon-grade Tiered Freight Engine</p>
                                    <p className="mt-0.5">Carts reaching or exceeding the threshold automatically receive 100% Free Shipping. Carts below will be charged the standard delivery fee.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Free Delivery Cart Threshold (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.free_shipping_threshold}
                                        onChange={(e) => handleInputChange('free_shipping_threshold', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="499"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Applies to Cart progress bar & checkout discounts
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Standard Delivery Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.standard_delivery_fee}
                                        onChange={(e) => handleInputChange('standard_delivery_fee', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="49"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Charged when cart total is below the free threshold
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
                                        value={formData.express_delivery_fee}
                                        onChange={(e) => handleInputChange('express_delivery_fee', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Estimated Standard Delivery (Days)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimated_delivery_days}
                                        onChange={(e) => handleInputChange('estimated_delivery_days', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="3"
                                    />
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
                                        When enabled, customers can select Cash on Delivery at checkout.
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
                                        value={formData.min_order_amount}
                                        onChange={(e) => handleInputChange('min_order_amount', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none"
                                        placeholder="99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Return Window Duration (Days)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.return_window_days}
                                        onChange={(e) => handleInputChange('return_window_days', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none"
                                        placeholder="7"
                                    />
                                </div>
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
                                            value={formData.platform_commission_rate}
                                            onChange={(e) => handleInputChange('platform_commission_rate', Number(e.target.value))}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white outline-none"
                                            placeholder="10"
                                        />
                                        <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">%</span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Marketplace take-rate automatically deducted on order completion
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Minimum Seller Payout Threshold (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.min_seller_payout_threshold}
                                        onChange={(e) => handleInputChange('min_seller_payout_threshold', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white outline-none"
                                        placeholder="1000"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Minimum balance seller must accumulate before requesting payout
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
                                        value={formData.platform_gstin}
                                        onChange={(e) => handleInputChange('platform_gstin', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white outline-none uppercase"
                                        placeholder="27AABCZ1234F1Z5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Standard GST Rate (%)
                                    </label>
                                    <select
                                        value={formData.default_gst_rate}
                                        onChange={(e) => handleInputChange('default_gst_rate', Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white outline-none"
                                    >
                                        <option value={0}>0% (Tax Exempt)</option>
                                        <option value={5}>5% (Essential Goods)</option>
                                        <option value={12}>12% (Standard Low)</option>
                                        <option value={18}>18% (Standard High / Electronics)</option>
                                        <option value={28}>28% (Luxury & Automotive)</option>
                                    </select>
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
                                        Permit new buyers to create accounts self-service.
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

                    {/* Bottom Save Action Bar */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <FiCheckCircle className="text-emerald-500" /> Auto-validated before persistent commit
                        </span>
                        <button
                            onClick={() => handleSaveGroup(activeTab)}
                            disabled={saving || loading}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <FiSave className="w-4 h-4" />
                            {saving ? 'Saving...' : `Save ${tabs.find(t => t.id === activeTab)?.label}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;