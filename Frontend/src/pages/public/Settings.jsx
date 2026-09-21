// ============================================================
// SETTINGS / PREFERENCES PAGE
// Description: User account, notification, and regional settings
// APIs: getNotificationPreferences, updateNotificationPreferences
// ============================================================

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FiBell,
    FiMail,
    FiPhone,
    FiGlobe,
    FiShield,
    FiLock,
    FiSave,
    FiCheck,
    FiSliders,
    FiMoon,
    FiSun,
    FiCheckCircle,
    FiPackage,
    FiTag,
    FiMessageSquare,
    FiStar
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const defaultPreferences = {
        notifications: { email: true, push: true, sms: false },
        language: 'en',
        timezone: 'Asia/Kolkata',
        theme: 'light',
    };

    const defaultNotificationTypes = {
        order_updates: true,
        promotions: false,
        reminders: true,
        seller_messages: true,
        review_requests: true,
    };

    const [preferences, setPreferences] = useState(defaultPreferences);
    const [notificationTypes, setNotificationTypes] = useState(defaultNotificationTypes);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getNotificationPreferences();
            if (response.data?.success) {
                const data = response.data.data || {};
                setPreferences({
                    notifications: data.notifications || defaultPreferences.notifications,
                    language: data.language || 'en',
                    timezone: data.timezone || 'Asia/Kolkata',
                    theme: data.theme || 'light',
                });
                if (data.notification_types) {
                    setNotificationTypes(data.notification_types);
                }
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setPreferences(defaultPreferences);
                setNotificationTypes(defaultNotificationTypes);
            } else {
                toast.error(error.response?.data?.message || 'Failed to load settings');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                notifications: {
                    email: !!preferences.notifications.email,
                    push: !!preferences.notifications.push,
                    sms: !!preferences.notifications.sms,
                },
                notification_types: {
                    order_updates: !!notificationTypes.order_updates,
                    promotions: !!notificationTypes.promotions,
                    reminders: !!notificationTypes.reminders,
                    seller_messages: !!notificationTypes.seller_messages,
                    review_requests: !!notificationTypes.review_requests,
                },
                language: preferences.language || 'en',
                timezone: preferences.timezone || 'Asia/Kolkata',
                theme: preferences.theme || 'light',
            };

            const response = await ApiService.updateNotificationPreferences(payload);
            if (response.data?.success) {
                toast.success('Settings updated successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update preferences');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
                            <FiSliders className="text-sm text-indigo-400" />
                            Account Preferences
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            Account Settings
                        </h1>
                        <p className="text-sm text-slate-300 mt-2 max-w-xl">
                            Tailor your notification alerts, regional display settings, and shopping experience.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                            {saving ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                            ) : (
                                <><FiSave className="text-sm" /> Save All Preferences</>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* ============ MAIN CONTENT ============ */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 space-y-6">

                {/* 1. Notification Channels */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                            <FiBell />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Notification Channels</h2>
                            <p className="text-xs text-slate-500">Choose how you want Zyvento to reach you.</p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 mt-2">
                        {[
                            { key: 'email', icon: FiMail, label: 'Email Notifications', desc: 'Order receipts, tracking links, and critical security alerts.' },
                            { key: 'push', icon: FiBell, label: 'Browser Push Notifications', desc: 'Instant flash deal alerts and live delivery updates on this device.' },
                            { key: 'sms', icon: FiPhone, label: 'SMS / Text Messages', desc: 'Delivery OTP verification and carrier dispatch alerts.' },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isChecked = !!preferences.notifications[item.key];
                            return (
                                <div key={item.key} className="py-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-sm flex-shrink-0">
                                            <Icon />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{item.label}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPreferences({
                                            ...preferences,
                                            notifications: {
                                                ...preferences.notifications,
                                                [item.key]: !isChecked
                                            }
                                        })}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            isChecked ? 'bg-indigo-600' : 'bg-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                isChecked ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Notification Types */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                            <FiPackage />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Activity & Updates</h2>
                            <p className="text-xs text-slate-500">Pick which specific notifications you wish to receive.</p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 mt-2">
                        {[
                            { key: 'order_updates', icon: FiPackage, label: 'Order Status & Shipping', desc: 'Updates when your order is packed, shipped, out for delivery, or completed.' },
                            { key: 'promotions', icon: FiTag, label: 'Discounts & Promotional Offers', desc: 'Special flash sale coupons, festive offers, and personalized discounts.' },
                            { key: 'seller_messages', icon: FiMessageSquare, label: 'Seller & Support Messages', desc: 'Direct messages regarding inquiries, product customizations, or ticket resolutions.' },
                            { key: 'review_requests', icon: FiStar, label: 'Product Review Invitations', desc: 'Help other shoppers by reviewing items after delivery.' },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isChecked = !!notificationTypes[item.key];
                            return (
                                <div key={item.key} className="py-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-sm flex-shrink-0">
                                            <Icon />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{item.label}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotificationTypes({
                                            ...notificationTypes,
                                            [item.key]: !isChecked
                                        })}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            isChecked ? 'bg-indigo-600' : 'bg-slate-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                isChecked ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Regional & Display */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                            <FiGlobe />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Regional & Display</h2>
                            <p className="text-xs text-slate-500">Configure language, timezone, and appearance.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Language
                            </label>
                            <select
                                value={preferences.language}
                                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="en">English (India)</option>
                                <option value="hi">हिन्दी (Hindi)</option>
                                <option value="mr">मराठी (Marathi)</option>
                                <option value="ta">தமிழ் (Tamil)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Timezone
                            </label>
                            <select
                                value={preferences.timezone}
                                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                                <option value="UTC">UTC (Coordinated Universal Time)</option>
                                <option value="America/New_York">America/New York (EST)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Theme
                            </label>
                            <select
                                value={preferences.theme}
                                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="light">☀️ Light Theme</option>
                                <option value="dark">🌙 Dark Theme (Coming Soon)</option>
                                <option value="system">🖥️ System Default</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Save Footer Bar */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">Remember to save your updated configuration.</p>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : <><FiCheck /> Save Changes</>}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Settings;
