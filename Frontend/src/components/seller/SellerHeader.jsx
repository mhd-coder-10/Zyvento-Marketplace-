import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
    FiMenu,
    FiBell,
    FiUser,
    FiLogOut,
    FiSettings,
    FiChevronDown,
    FiX,
    FiExternalLink,
    FiShoppingBag,
    FiAlertTriangle,
    FiStar,
} from 'react-icons/fi';

const SellerHeader = ({
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
    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New order received', time: '10 min ago', read: false, type: 'order' },
        { id: 2, title: 'Stock low on top product', time: '1 hour ago', read: false, type: 'stock' },
        { id: 3, title: 'Customer left a 5-star review', time: 'Yesterday', read: true, type: 'review' },
    ]);

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

    const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || user?.business_name || 'Seller';
    const initial = (user?.first_name?.[0] || user?.business_name?.[0] || 'S').toUpperCase();

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const toggleNotificationRead = (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    return (
        <header
            className={`fixed top-0 right-0 z-40 h-16 transition-all duration-300 ease-in-out bg-white/90 backdrop-blur-xl border-b border-sky-100 shadow-[0_4px_20px_-14px_rgba(2,132,199,0.4)] ${
                isExpanded && !isMobile ? 'left-0 lg:left-64' : 'left-0'
            }`}
        >
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
                {/* Left side: Hamburger Toggle */}
                <div className="flex items-center gap-3">
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
                </div>

                {/* Right side: Notifications & Profile Dropdown */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={`relative p-2.5 rounded-xl transition-all active:scale-95 ${
                                isNotificationsOpen
                                    ? 'bg-sky-100/70 text-sky-600 ring-2 ring-sky-300'
                                    : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                            }`}
                            aria-label="Notifications"
                        >
                            <FiBell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                            )}
                        </button>

                        {/* Mobile Backdrop to catch outside clicks nicely */}
                        {isNotificationsOpen && (
                            <div
                                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] sm:hidden"
                                onClick={() => setIsNotificationsOpen(false)}
                            />
                        )}

                        {isNotificationsOpen && (
                            <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[4.25rem] sm:top-full sm:mt-2 max-w-sm sm:w-80 md:w-88 mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/50 to-white">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="text-[11px] font-bold text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded-full">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllAsRead}
                                                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsNotificationsOpen(false)}
                                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 sm:hidden"
                                            aria-label="Close"
                                        >
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[65vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs">
                                            No notifications right now
                                        </div>
                                    ) : (
                                        notifications.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleNotificationRead(item.id)}
                                                className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                                                    !item.read ? 'bg-sky-50/40' : 'bg-white'
                                                }`}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {item.type === 'order' ? (
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                            <FiShoppingBag className="w-3.5 h-3.5" />
                                                        </div>
                                                    ) : item.type === 'stock' ? (
                                                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                                            <FiAlertTriangle className="w-3.5 h-3.5" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                                                            <FiStar className="w-3.5 h-3.5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs leading-snug ${!item.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                                                </div>
                                                {!item.read && (
                                                    <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-2xl hover:bg-sky-50/60 transition-all text-left"
                        >
                            {user?.profile_image ? (
                                <img
                                    src={user.profile_image}
                                    alt={fullName}
                                    className="w-9 h-9 rounded-full object-cover border border-sky-100 shadow-md shadow-sky-200"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-200">
                                    {initial}
                                </div>
                            )}
                            <div className="hidden sm:block text-left">
                                <span className="block text-sm font-semibold text-slate-800 leading-tight">
                                    {fullName}
                                </span>
                                <span className="block text-[11px] font-medium text-sky-600 capitalize">
                                    {user?.user_type || 'Seller'}
                                </span>
                            </div>
                            <FiChevronDown
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                                    isProfileOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {/* Mobile Backdrop for Profile */}
                        {isProfileOpen && (
                            <div
                                className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px] sm:hidden"
                                onClick={() => setIsProfileOpen(false)}
                            />
                        )}

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-sky-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>

                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            navigate('/seller/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors text-left"
                                    >
                                        <FiUser className="w-4 h-4 text-slate-400" />
                                        <span>My Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            navigate('/seller/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors text-left"
                                    >
                                        <FiSettings className="w-4 h-4 text-slate-400" />
                                        <span>Settings</span>
                                    </button>

                                    <a
                                        href="/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors text-left"
                                    >
                                        <FiExternalLink className="w-4 h-4 text-slate-400" />
                                        <span>Visit Store</span>
                                    </a>
                                </div>

                                <div className="pt-1 border-t border-slate-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                                    >
                                        <FiLogOut className="w-4 h-4 text-rose-500" />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default SellerHeader;
