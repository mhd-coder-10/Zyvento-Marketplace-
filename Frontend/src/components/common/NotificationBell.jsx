import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FiBell,
    FiCheck,
    FiPackage,
    FiTag,
    FiShield,
    FiShoppingBag,
    FiCreditCard,
    FiStar,
    FiTrash2,
    FiSettings,
    FiRefreshCw,
    FiAlertTriangle,
    FiX,
    FiExternalLink,
    FiCheckCircle,
    FiMessageSquare
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';
import { timeAgo } from '../../utils/helper';

const NotificationBell = ({
    variant = 'customer', // 'customer' or 'seller'
    align = 'right',
    className = '',
    mobileFilled = false // gradient filled trigger on phones (<640px)
}) => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'order', 'promo'
    const dropdownRef = useRef(null);

    // Fetch unread count lightweight
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await ApiService.getUnreadNotificationCount();
            const count = res?.data?.data?.unreadCount ?? res?.data?.unreadCount ?? 0;
            setUnreadCount(count);
        } catch (err) {
            // Silently handle
        }
    }, [isAuthenticated]);

    // Fetch recent notifications when dropdown opens or user switches tabs
    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await ApiService.getUserNotifications({ limit: 20 });
            const list = res?.data?.data || res?.data?.notifications || [];
            const safeList = Array.isArray(list) ? list : [];
            setNotifications(safeList);

            // Also sync unread count
            const unread = safeList.filter((n) => !n.is_read).length;
            const backendUnread = res?.data?.pagination?.unreadCount ?? res?.data?.unreadCount;
            setUnreadCount(backendUnread !== undefined ? backendUnread : unread);
        } catch (err) {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial load + polling every 45s
    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            setNotifications([]);
            return;
        }

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 45000);

        // Listen for global notification refresh events
        const handleCustomRefresh = () => {
            fetchUnreadCount();
            if (isOpen) fetchNotifications();
        };
        window.addEventListener('notification:refresh', handleCustomRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notification:refresh', handleCustomRefresh);
        };
    }, [isAuthenticated, fetchUnreadCount, fetchNotifications, isOpen]);

    // Fetch full list whenever popover is opened
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Handle outside clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Mark single notification as read
    const handleMarkAsRead = async (e, item) => {
        e.stopPropagation();
        const idOrCode = item._id || item.notification_code;
        // Optimistic UI update
        setNotifications((prev) =>
            prev.map((n) =>
                (n._id === item._id || n.notification_code === item.notification_code)
                    ? { ...n, is_read: true }
                    : n
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await ApiService.markUserNotificationAsRead(idOrCode);
        } catch (err) {
            // Revert on error
            fetchUnreadCount();
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        try {
            await ApiService.markAllUserNotificationsAsRead();
        } catch (err) {
            fetchUnreadCount();
        }
    };

    // Delete single notification
    const handleDeleteNotification = async (e, item) => {
        e.stopPropagation();
        const idOrCode = item._id || item.notification_code;
        setNotifications((prev) =>
            prev.filter((n) => n._id !== item._id && n.notification_code !== item.notification_code)
        );
        if (!item.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        try {
            await ApiService.deleteUserNotification(idOrCode);
        } catch (err) {
            // Handled
        }
    };

    // Click on notification card -> mark read & follow action url
    const handleNotificationClick = async (item) => {
        const idOrCode = item._id || item.notification_code;
        if (!item.is_read) {
            setNotifications((prev) =>
                prev.map((n) =>
                    (n._id === item._id || n.notification_code === item.notification_code)
                        ? { ...n, is_read: true }
                        : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            try {
                await ApiService.markUserNotificationAsRead(idOrCode);
                if (item.notification_code) {
                    ApiService.trackNotificationClick(item.notification_code).catch(() => {});
                }
            } catch (err) {}
        }

        setIsOpen(false);

        // Navigation logic based on action_url or type
        if (item.action_url) {
            if (item.action_url.startsWith('http://') || item.action_url.startsWith('https://')) {
                window.open(item.action_url, '_blank');
            } else {
                navigate(item.action_url);
            }
            return;
        }

        // Smart fallback navigation
        const type = (item.notification_type || item.category || '').toLowerCase();
        if (type.includes('order')) {
            if (variant === 'seller') {
                navigate(item.reference_id ? `/seller/orders/${item.reference_id}` : '/seller/orders');
            } else {
                navigate(item.reference_id ? `/orders/${item.reference_id}` : '/orders');
            }
        } else if (type.includes('product')) {
            if (variant === 'seller') {
                navigate(item.reference_id ? `/seller/products/edit/${item.reference_id}` : '/seller/products');
            } else {
                navigate(item.reference_id ? `/product/${item.reference_id}` : '/products');
            }
        } else if (type.includes('review')) {
            navigate(variant === 'seller' ? '/seller/reviews' : '/orders');
        } else {
            navigate(variant === 'seller' ? '/seller/settings' : '/notifications');
        }
    };

    // Filter notifications based on tab
    const filteredNotifications = notifications.filter((item) => {
        if (activeTab === 'unread') return !item.is_read;
        const cat = (item.category || '').toUpperCase();
        const typ = (item.notification_type || '').toLowerCase();
        if (activeTab === 'order') return cat === 'ORDER' || typ.includes('order');
        if (activeTab === 'promo') return cat === 'PROMOTION' || typ.includes('promo') || typ.includes('offer');
        return true;
    });

    // Helper: Category/type visual styling
    const getNotificationVisual = (item) => {
        const cat = (item.category || '').toUpperCase();
        const typ = (item.notification_type || '').toLowerCase();

        if (cat === 'ORDER' || typ.includes('order')) {
            return {
                icon: FiPackage,
                bg: 'bg-blue-50 text-blue-600 border border-blue-100'
            };
        }
        if (cat === 'PROMOTION' || typ.includes('promo') || typ.includes('offer') || typ.includes('discount')) {
            return {
                icon: FiTag,
                bg: 'bg-amber-50 text-amber-600 border border-amber-100'
            };
        }
        if (cat === 'PRODUCT' || typ.includes('product') || typ.includes('inventory') || typ.includes('stock')) {
            return {
                icon: FiShoppingBag,
                bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            };
        }
        if (cat === 'FINANCE' || typ.includes('payment') || typ.includes('payout') || typ.includes('refund')) {
            return {
                icon: FiCreditCard,
                bg: 'bg-teal-50 text-teal-600 border border-teal-100'
            };
        }
        if (typ.includes('review') || typ.includes('rating')) {
            return {
                icon: FiStar,
                bg: 'bg-amber-50 text-amber-500 border border-amber-100'
            };
        }
        if (cat === 'SYSTEM_ALERT' || cat === 'ADMIN_SYSTEM' || typ.includes('security') || item.priority === 'critical') {
            return {
                icon: FiAlertTriangle,
                bg: 'bg-rose-50 text-rose-600 border border-rose-100'
            };
        }
        return {
            icon: FiBell,
            bg: 'bg-sky-50 text-sky-600 border border-sky-100'
        };
    };

    if (!isAuthenticated) return null;

    const isSeller = variant === 'seller';
    const settingsPath = isSeller ? '/seller/settings' : '/settings';
    const allNotificationsPath = isSeller ? '/seller/dashboard' : '/notifications';

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative transition-all duration-200 active:scale-95 flex items-center justify-center ${
                    mobileFilled
                        ? `h-[38px] w-[38px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-blue-500/20 sm:h-auto sm:w-auto sm:p-2.5 sm:rounded-2xl sm:bg-none sm:shadow-none ${
                            isOpen
                                ? 'ring-2 ring-blue-300 sm:bg-blue-100 sm:text-blue-700 sm:ring-2 sm:ring-blue-300'
                                : 'sm:text-slate-700 sm:hover:text-blue-600 sm:hover:bg-slate-100/80 sm:border sm:border-transparent sm:hover:border-slate-200'
                        }`
                        : `p-2.5 rounded-2xl ${
                            isOpen
                                ? isSeller
                                    ? 'bg-sky-100 text-sky-700 ring-2 ring-sky-300'
                                    : 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                                : isSeller
                                    ? 'text-slate-600 hover:text-sky-600 hover:bg-sky-50'
                                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 border border-transparent hover:border-slate-200'
                        }`
                }`}
                aria-label="Notifications"
                title="Notifications"
            >
                <FiBell className="w-5 h-5 transition-transform group-hover:rotate-12" />

                {/* Badge Counter */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-sm animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] sm:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Popover Dropdown */}
            {isOpen && (
                <div
                    className={`fixed sm:absolute ${
                        align === 'left' ? 'sm:left-0' : 'sm:right-0'
                    } left-3 right-3 sm:left-auto top-[4.25rem] sm:top-full sm:mt-2.5 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                    {/* Header */}
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-sky-50/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm tracking-tight">Notifications</span>
                            {unreadCount > 0 ? (
                                <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            ) : (
                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <FiCheckCircle className="w-3 h-3" /> All read
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                                    title="Mark all notifications as read"
                                >
                                    <FiCheck className="w-3.5 h-3.5" />
                                    <span>Mark all read</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => fetchNotifications()}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="Refresh"
                            >
                                <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 sm:hidden"
                                aria-label="Close"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="px-4 py-2 border-b border-slate-100/80 bg-slate-50/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'unread', label: `Unread (${unreadCount})` },
                            { id: 'order', label: 'Orders' },
                            { id: 'promo', label: 'Promotions' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-2.5 py-1 rounded-xl font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-slate-800 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Notification Feed */}
                    <div className="max-h-[62vh] sm:max-h-88 overflow-y-auto divide-y divide-slate-100/80 scrollbar-thin scrollbar-thumb-slate-200">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
                                <p className="text-xs">Loading notifications...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="py-10 px-6 text-center text-slate-400">
                                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto mb-3">
                                    <FiBell className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">No notifications found</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">
                                    {activeTab === 'unread'
                                        ? 'Great job! You have read all notifications.'
                                        : 'Updates regarding orders, promotions, and account alerts will appear here.'}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((item) => {
                                const visual = getNotificationVisual(item);
                                const IconComponent = visual.icon;
                                const isUnread = !item.is_read;

                                return (
                                    <div
                                        key={item._id || item.notification_code}
                                        onClick={() => handleNotificationClick(item)}
                                        className={`group relative px-4 py-3.5 transition-all cursor-pointer flex items-start gap-3 ${
                                            isUnread
                                                ? 'bg-sky-50/50 hover:bg-sky-100/60'
                                                : 'bg-white hover:bg-slate-50/80'
                                        }`}
                                    >
                                        {/* Icon */}
                                        <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${visual.bg}`}>
                                            <IconComponent className="w-4 h-4" />
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className={`text-xs leading-snug line-clamp-1 ${
                                                    isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                                                }`}>
                                                    {item.title}
                                                </p>
                                                {item.priority === 'critical' && (
                                                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-rose-100 text-rose-700">
                                                        Urgent
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[11.5px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                                                {item.message}
                                            </p>

                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {timeAgo(item.created_at || item.sent_at)}
                                                </span>
                                                {item.action_label && (
                                                    <span className="text-[10px] text-sky-600 font-bold group-hover:underline flex items-center gap-0.5">
                                                        <span>{item.action_label}</span>
                                                        <FiExternalLink className="w-2.5 h-2.5" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions / Unread dot */}
                                        <div className="shrink-0 flex items-center gap-1 self-center">
                                            {isUnread && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleMarkAsRead(e, item)}
                                                    className="w-2.5 h-2.5 rounded-full bg-sky-500 hover:scale-125 transition-transform"
                                                    title="Mark as read"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteNotification(e, item)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                                                title="Remove notification"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                        <Link
                            to={allNotificationsPath}
                            onClick={() => setIsOpen(false)}
                            className="font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                        >
                            <span>View All Notifications</span>
                        </Link>
                        <Link
                            to={settingsPath}
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
                            title="Notification Preferences"
                        >
                            <FiSettings className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium">Preferences</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
