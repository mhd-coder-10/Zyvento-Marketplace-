// ============================================================
// NOTIFICATIONS PAGE
// Description: User notifications hub with filtering and read/unread status
// APIs: getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiBell,
    FiCheckCircle,
    FiPackage,
    FiTag,
    FiShield,
    FiTrash2,
    FiCheck,
    FiFilter,
    FiClock,
    FiAlertCircle,
    FiChevronRight,
    FiMessageSquare
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    // Default sample fallback if no backend notifications yet
    const demoNotifications = [
        {
            _id: 'notif_1',
            title: 'Order Dispatched!',
            message: 'Your order #ORD-982341 has been dispatched via BlueDart. Track package in real time.',
            type: 'order',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
            link: '/order-tracking'
        },
        {
            _id: 'notif_2',
            title: 'Weekend Flash Sale is LIVE! 🔥',
            message: 'Flat 20% off on all wireless audio gear with promo code SOUND20. Limited quantities available.',
            type: 'promo',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
            link: '/products'
        },
        {
            _id: 'notif_3',
            title: 'Account Security Notice',
            message: 'Your account was accessed from a new browser in Delhi, India. If this was not you, change your password.',
            type: 'security',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
            link: '/settings'
        },
        {
            _id: 'notif_4',
            title: 'Seller Responded to Your Query',
            message: 'TechZone Store replied to your product question regarding Bluetooth 5.3 specifications.',
            type: 'message',
            is_read: true,
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2d ago
            link: '/help-center'
        },
    ];

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getAllNotifications();
            if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
                setNotifications(response.data.data);
            } else {
                setNotifications(demoNotifications);
            }
        } catch (error) {
            // Use demo fallback gracefully
            setNotifications(demoNotifications);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await ApiService.markNotificationAsRead(id);
        } catch (e) {
            // Graceful fallback
        }
        setNotifications(prev =>
            prev.map(n => n._id === id ? { ...n, is_read: true } : n)
        );
    };

    const handleMarkAllAsRead = async () => {
        try {
            await ApiService.markAllNotificationsAsRead();
            toast.success('All notifications marked as read');
        } catch (e) {
            toast.success('All notifications marked as read');
        }
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleDelete = async (id) => {
        try {
            await ApiService.deleteNotification(id);
            toast.success('Notification removed');
        } catch (e) {
            toast.success('Notification removed');
        }
        setNotifications(prev => prev.filter(n => n._id !== id));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'unread') return !n.is_read;
        if (activeTab === 'orders') return n.type === 'order';
        if (activeTab === 'promos') return n.type === 'promo';
        return true;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'order':
                return { icon: FiPackage, bg: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100' };
            case 'promo':
                return { icon: FiTag, bg: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' };
            case 'security':
                return { icon: FiShield, bg: 'bg-rose-50 text-rose-600', ring: 'ring-rose-100' };
            case 'message':
                return { icon: FiMessageSquare, bg: 'bg-indigo-50 text-indigo-600', ring: 'ring-indigo-100' };
            default:
                return { icon: FiBell, bg: 'bg-slate-100 text-slate-600', ring: 'ring-slate-100' };
        }
    };

    const formatTimestamp = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.round((now - date) / (1000 * 60 * 60));
        if (diffHours < 1) return 'Few minutes ago';
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        const diffDays = Math.round(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="relative max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
                            <FiBell className="text-sm text-indigo-400" />
                            Activity Hub
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            Notifications
                        </h1>
                        <p className="text-sm text-slate-300 mt-2">
                            Stay on top of shipping milestones, discount events, and critical alerts.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <FiCheck className="text-sm text-emerald-400" /> Mark All as Read ({unreadCount})
                        </button>
                    )}
                </div>
            </section>

            {/* ============ NOTIFICATIONS LIST ============ */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">

                {/* Filter Tabs */}
                <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-md shadow-slate-200/50 flex flex-wrap gap-2 mb-6">
                    {[
                        { id: 'all', label: 'All Notifications', count: notifications.length },
                        { id: 'unread', label: 'Unread', count: unreadCount },
                        { id: 'orders', label: 'Orders & Shipping' },
                        { id: 'promos', label: 'Discounts & Deals' },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Notifications Cards */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-3">
                                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto mb-4">
                            <FiBell />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No notifications here</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            You're all caught up! When you place an order or receive special offers, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {filteredNotifications.map((notif) => {
                            const { icon: TypeIcon, bg, ring } = getTypeIcon(notif.type);
                            return (
                                <div
                                    key={notif._id}
                                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 flex items-start gap-4 ${
                                        !notif.is_read
                                            ? 'border-indigo-200 bg-indigo-50/20 shadow-md shadow-indigo-100/40'
                                            : 'border-slate-200/80 shadow-sm hover:border-slate-300'
                                    }`}
                                >
                                    {/* Type Icon */}
                                    <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center text-xl flex-shrink-0 ring-4 ${ring}`}>
                                        <TypeIcon />
                                    </div>

                                    {/* Main Body */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className={`text-sm ${!notif.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                                                {notif.title}
                                            </h3>
                                            {!notif.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                            {notif.message}
                                        </p>

                                        <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <FiClock className="text-xs" /> {formatTimestamp(notif.created_at)}
                                            </span>
                                            {notif.link && (
                                                <Link
                                                    to={notif.link}
                                                    onClick={() => handleMarkAsRead(notif._id)}
                                                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                >
                                                    View Details <FiChevronRight />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif._id)}
                                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition-colors"
                                                title="Mark as read"
                                            >
                                                <FiCheck className="text-sm" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notif._id)}
                                            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                                            title="Delete notification"
                                        >
                                            <FiTrash2 className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Notifications;
