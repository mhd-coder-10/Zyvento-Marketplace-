import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
    FiMenu,
    FiUser,
    FiLogOut,
    FiSettings,
    FiChevronDown,
    FiX,
    FiExternalLink
} from 'react-icons/fi';
import NotificationBell from '../common/NotificationBell';

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
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
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
                    {/* Live Seller Notifications Dropdown */}
                    <NotificationBell variant="seller" />

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
