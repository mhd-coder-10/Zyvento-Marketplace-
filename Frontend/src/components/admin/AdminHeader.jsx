
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
    FiMenu,
    FiBell,
    FiSearch,
    FiUser,
    FiLogOut,
    FiSettings,
    FiChevronDown,
    FiX,
    FiMail,
    FiShoppingBag,
    FiStar,
    FiCheckCircle,
    FiAlertCircle,
    FiClock,
    FiShield
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';

const AdminHeader = ({
    sidebarOpen,
    setSidebarOpen,
    isExpanded = sidebarOpen,
    toggleSidebar,
    isMobile,
    user
}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const fetchHeaderNotifications = async () => {
        try {
            setLoadingNotifications(true);
            const res = await ApiService.getAllNotifications({ limit: 8 });
            if (res.data?.success) {
                const list = res.data.data || [];
                setNotifications(list);
                const unread = list.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error('Failed to load header notifications', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        fetchHeaderNotifications();
        // Periodically refresh notification badge every 60s
        const interval = setInterval(fetchHeaderNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await ApiService.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true, status: 'read' })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all notifications read', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        try {
            if (!notif.is_read) {
                await ApiService.markNotificationAsRead(notif.notification_code);
                setNotifications(prev =>
                    prev.map(n => n.notification_code === notif.notification_code ? { ...n, is_read: true, status: 'read' } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            setIsNotificationsOpen(false);
            if (notif.action_url) {
                navigate(notif.action_url);
            } else {
                navigate(`/admin/notifications/${notif.notification_code}`);
            }
        } catch (err) {
            navigate(`/admin/notifications/${notif.notification_code}`);
        }
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return 'Just now';
        const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diffSec < 60) return 'Just now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return `${Math.floor(diffSec / 86400)}d ago`;
    };

    const getNotificationVisual = (category, priority) => {
        if (priority === 'critical') return { icon: FiAlertCircle, color: 'text-rose-500 bg-rose-50' };
        switch ((category || '').toLowerCase()) {
            case 'order': return { icon: FiShoppingBag, color: 'text-emerald-500 bg-emerald-50' };
            case 'product': return { icon: FiShield, color: 'text-indigo-500 bg-indigo-50' };
            case 'payment':
            case 'finance': return { icon: FiCheckCircle, color: 'text-purple-500 bg-purple-50' };
            case 'customer':
            case 'seller': return { icon: FiUser, color: 'text-sky-500 bg-sky-50' };
            case 'system': return { icon: FiAlertCircle, color: 'text-amber-500 bg-amber-50' };
            default: return { icon: FiBell, color: 'text-blue-500 bg-blue-50' };
        }
    };

    return (
        <header
            className={`fixed top-0 right-0 z-40 h-16 transition-all duration-300 ease-in-out bg-white/85 backdrop-blur-xl border-b border-sky-100 shadow-[0_4px_20px_-14px_rgba(2,132,199,0.5)] ${
                isExpanded && !isMobile ? 'left-0 lg:left-64' : 'left-0'
            }`}
        >
            <div className="flex items-center justify-between h-full px-3 sm:px-6 gap-2">
                {/* Left side */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <button
                        onClick={() => {
                            if (toggleSidebar) {
                                toggleSidebar();
                            } else {
                                setSidebarOpen(!sidebarOpen);
                            }
                        }}
                        className="p-2 rounded-xl text-slate-600 hover:bg-sky-50 hover:text-sky-600 active:scale-95 transition-all"
                        aria-label="Toggle sidebar"
                        title={isExpanded ? 'Collapse sidebar' : 'Open sidebar'}
                    >
                        {isExpanded && isMobile ? (
                            <FiX className="w-5 h-5" />
                        ) : (
                            <FiMenu className={`w-5 h-5 ${isExpanded && !isMobile ? 'text-sky-600' : ''}`} />
                        )}
                    </button>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center">
                        <div className="relative group">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search orders, users, products..."
                                className="pl-9 pr-4 py-2.5 w-64 lg:w-80 rounded-2xl border border-sky-100 bg-sky-50/60 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all hover:bg-white focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                        </div>
                    </form>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                    {/* Mobile search shortcut */}
                    <button
                        onClick={() => navigate('/admin/search')}
                        className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        aria-label="Search"
                    >
                        <FiSearch className="w-5 h-5" />
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative p-2 rounded-xl text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                            aria-label="Notifications"
                        >
                            <FiBell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-sky-200 ring-2 ring-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-[4.25rem] sm:top-auto sm:mt-2 sm:w-96 bg-white rounded-2xl shadow-2xl shadow-sky-100 border border-sky-100 overflow-hidden z-50 animate-fadeIn">
                                <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="text-[11px] font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs font-semibold text-sky-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-sky-50 transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-sky-50">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 px-4 text-center">
                                            <FiBell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-slate-500">No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map((n) => {
                                            const visual = getNotificationVisual(n.category || n.notification_type, n.priority);
                                            const Icon = visual.icon;
                                            return (
                                                <div
                                                    key={n._id || n.notification_code}
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-sky-50/70 ${
                                                        !n.is_read ? 'bg-sky-50/40' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-xl flex-shrink-0 ${visual.color}`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs leading-snug line-clamp-1 ${!n.is_read ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                                {n.title}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                                {n.message}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-1">
                                                                {formatTimeAgo(n.createdAt)}
                                                            </p>
                                                        </div>
                                                        {!n.is_read && (
                                                            <div className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="p-3 border-t border-sky-100 text-center bg-sky-50/50">
                                    <button
                                        onClick={() => {
                                            setIsNotificationsOpen(false);
                                            navigate('/admin/notifications');
                                        }}
                                        className="text-xs font-semibold text-sky-600 hover:text-blue-700"
                                    >
                                        Open Notification Center →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 p-1.5 pr-2 rounded-2xl hover:bg-sky-50 transition-colors group"
                            aria-label="Profile menu"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center shadow-md shadow-sky-200 ring-2 ring-white">
                                <span className="text-white font-semibold text-sm">
                                    {user?.first_name?.[0] || 'A'}
                                </span>
                            </div>
                            <span className="hidden sm:inline text-sm font-semibold text-slate-700 max-w-[9rem] truncate">
                                {user?.first_name} {user?.last_name}
                            </span>
                            <FiChevronDown className={`hidden sm:block w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl shadow-sky-100 border border-sky-100 overflow-hidden z-50 animate-fadeIn">
                                <div className="px-4 py-3 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
                                    <p className="text-sm font-bold text-slate-800 truncate">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                                        {user?.user_type || user?.role?.roleName || 'Admin'}
                                    </span>
                                </div>
                                <div className="py-1.5">
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            navigate('/admin/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-blue-700 transition-colors"
                                    >
                                        <FiUser className="w-4 h-4 text-sky-500" />
                                        My Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            navigate('/admin/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-blue-700 transition-colors"
                                    >
                                        <FiSettings className="w-4 h-4 text-sky-500" />
                                        Settings
                                    </button>
                                    <div className="border-t border-sky-100 my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        <FiLogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </header>
    );
};

export default AdminHeader;
