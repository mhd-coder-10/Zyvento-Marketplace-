import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FiSliders, FiSave, FiRefreshCw, FiCheck, FiX, FiLock,
    FiShield, FiBell, FiSmartphone, FiMail, FiSearch, FiInfo
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const DEFAULT_CATEGORIES = [
    { id: 'order_updates', label: 'Order & Shipping Updates', desc: 'Order status changes, tracking, fulfillment alerts', is_critical: false },
    { id: 'promotions', label: 'Promotional & Flash Deals', desc: 'Marketplace discount campaigns, coupons, and seasonal sales', is_critical: false },
    { id: 'inventory_alerts', label: 'Inventory & Stock Alerts', desc: 'Low stock notices and out-of-stock seller notifications', is_critical: false },
    { id: 'product_approval', label: 'Product Verification & Approval', desc: 'Catalog review decisions, approvals, and rejections', is_critical: false },
    { id: 'payment_notifications', label: 'Payments & Payout Settlements', desc: 'Escrow releases, customer refunds, and weekly seller payouts', is_critical: false },
    { id: 'seller_requests', label: 'Seller Support & Requests', desc: 'Inquiries, account assistance, and admin resolution notices', is_critical: false },
    { id: 'reviews', label: 'Reviews & Customer Reminders', desc: 'Product review submissions, ratings, and feedback alerts', is_critical: false },
    { id: 'system_security', label: 'Security & Critical Account Alerts', desc: 'Password changes, login notices, and emergency system bulletins', is_critical: true },
];

const NotificationPreferences = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [targetUserId, setTargetUserId] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [preferences, setPreferences] = useState({
        channels: { in_app: true, push: true, email: true },
        categories: {
            order_updates: { in_app: true, push: true, email: true },
            promotions: { in_app: true, push: false, email: false },
            inventory_alerts: { in_app: true, push: true, email: true },
            product_approval: { in_app: true, push: true, email: true },
            payment_notifications: { in_app: true, push: true, email: true },
            seller_requests: { in_app: true, push: true, email: true },
            reviews: { in_app: true, push: false, email: false },
            system_security: { in_app: true, push: true, email: true },
        }
    });

    const fetchPreferences = async (userId = targetUserId) => {
        setLoading(true);
        try {
            const res = await ApiService.getNotificationPreferences(userId);
            if (res.data?.success && res.data?.data) {
                const data = res.data.data;
                setPreferences(prev => ({
                    ...prev,
                    channels: data.channels || prev.channels,
                    categories: {
                        ...prev.categories,
                        ...(data.categories || {})
                    }
                }));
            }
        } catch (err) {
            console.error('Failed to load preferences', err);
            // Default preferences retained gracefully
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreferences();
    }, []);

    const handleToggleChannelGlobal = (ch) => {
        setPreferences(prev => ({
            ...prev,
            channels: {
                ...prev.channels,
                [ch]: !prev.channels[ch]
            }
        }));
    };

    const handleToggleCategoryChannel = (catId, ch) => {
        // Enforce: system_security cannot be disabled!
        if (catId === 'system_security') {
            toast.warning('Security and critical account alerts are mandatory and cannot be disabled.');
            return;
        }

        setPreferences(prev => {
            const catSettings = prev.categories[catId] || { in_app: true, push: true, email: true };
            return {
                ...prev,
                categories: {
                    ...prev.categories,
                    [catId]: {
                        ...catSettings,
                        [ch]: !catSettings[ch]
                    }
                }
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const userId = targetUserId || 'me';
            await ApiService.updateNotificationPreferences(userId, preferences);
            toast.success('Notification preferences updated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleSearchUser = (e) => {
        e.preventDefault();
        if (searchUser.trim()) {
            setTargetUserId(searchUser.trim());
            fetchPreferences(searchUser.trim());
        }
    };

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Notification Preferences"
                subtitle="Configure category and channel opt-ins for customers, sellers, and marketplace staff"
                actions={
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm disabled:opacity-50"
                    >
                        <FiSave className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                }
            />

            <div className="w-full space-y-6">
                {/* Search Target User Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                        <h3 className="font-bold text-slate-800">Account Notification Routing</h3>
                        <p className="text-slate-500 text-[11px]">
                            {targetUserId ? `Inspecting preferences for User ID: ${targetUserId}` : 'Currently viewing global default / your admin routing'}
                        </p>
                    </div>

                    <form onSubmit={handleSearchUser} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                            placeholder="Enter Customer or Seller User ID..."
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 w-full sm:w-64"
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
                        >
                            Lookup
                        </button>
                    </form>
                </div>

                {/* Master Channel Toggles */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Master Channel Deliverability
                    </h3>
                    <p className="text-xs text-slate-500">
                        Enable or disable entire communication channels across the platform.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {[
                            { id: 'in_app', label: 'In-App Alerts', desc: 'Bell notifications & activity center', icon: FiBell, color: 'text-indigo-600 bg-indigo-50' },
                            { id: 'push', label: 'Mobile Push', desc: 'Mobile device push notifications', icon: FiSmartphone, color: 'text-purple-600 bg-purple-50' },
                            { id: 'email', label: 'Email Bulletins', desc: 'Node backend mailer dispatches', icon: FiMail, color: 'text-blue-600 bg-blue-50' },
                        ].map((ch) => {
                            const isEnabled = preferences.channels[ch.id];
                            const Icon = ch.icon;
                            return (
                                <div
                                    key={ch.id}
                                    onClick={() => handleToggleChannelGlobal(ch.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition select-none flex items-center justify-between ${
                                        isEnabled
                                            ? 'bg-sky-50/60 border-sky-300 shadow-xs'
                                            : 'bg-slate-50 border-slate-200 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${ch.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{ch.label}</p>
                                            <p className="text-[10px] text-slate-400">{ch.desc}</p>
                                        </div>
                                    </div>
                                    <span className={`w-3.5 h-3.5 rounded-full ${isEnabled ? 'bg-sky-500 ring-4 ring-sky-100' : 'bg-slate-300'}`} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Category Channel Matrix */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Category Delivery Matrix</h3>
                            <p className="text-xs text-slate-500">Customize notification channels per business event category</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Event Category</th>
                                    <th className="py-3 px-4 text-center">In-App</th>
                                    <th className="py-3 px-4 text-center">Mobile Push</th>
                                    <th className="py-3 px-4 text-center">Email</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {DEFAULT_CATEGORIES.map((cat) => {
                                    const catPref = preferences.categories[cat.id] || { in_app: true, push: true, email: true };

                                    return (
                                        <tr key={cat.id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3.5 px-4 max-w-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-800">{cat.label}</span>
                                                    {cat.is_critical && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <FiLock className="w-2.5 h-2.5" />
                                                            Mandatory
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{cat.desc}</p>
                                            </td>

                                            {['in_app', 'push', 'email'].map((ch) => {
                                                const checked = catPref[ch];
                                                return (
                                                    <td key={ch} className="py-3.5 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            disabled={cat.is_critical}
                                                            onClick={() => handleToggleCategoryChannel(cat.id, ch)}
                                                            className={`w-5 h-5 rounded-lg border flex items-center justify-center mx-auto transition ${
                                                                checked
                                                                    ? 'bg-sky-600 border-sky-600 text-white'
                                                                    : 'bg-white border-slate-300 text-transparent'
                                                            } ${cat.is_critical ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-sky-500'}`}
                                                        >
                                                            <FiCheck className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Important Notice Callout */}
                <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl flex items-start gap-3 text-xs text-sky-900">
                    <FiInfo className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">System Compliance Policy</p>
                        <p className="text-[11px] text-sky-800/80 leading-relaxed mt-0.5">
                            Under Zyvento marketplace trust & safety regulations, critical account, security, and dispute notifications bypass opt-out preferences to ensure account compliance and avoid missed financial notices.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPreferences;
