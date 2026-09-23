import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    FiHome,
    FiPackage,
    FiShoppingCart,
    FiBox,
    FiDollarSign,
    FiPieChart,
    FiStar,
    FiUsers,
    FiUser,
    FiSettings,
    FiExternalLink,
    FiChevronLeft,
} from 'react-icons/fi';

const SELLER_NAV_ITEMS = [
    { name: 'Dashboard', icon: FiHome, path: '/seller/dashboard' },
    { name: 'My Products', icon: FiPackage, path: '/seller/products' },
    { name: 'My Orders', icon: FiShoppingCart, path: '/seller/orders' },
    { name: 'Inventory', icon: FiBox, path: '/seller/inventory' },
    { name: 'My Earnings', icon: FiDollarSign, path: '/seller/earnings' },
    { name: 'Reports', icon: FiPieChart, path: '/seller/reports' },
    { name: 'Reviews', icon: FiStar, path: '/seller/reviews' },
    { name: 'My Profile', icon: FiUser, path: '/seller/profile' },
    { name: 'Settings', icon: FiSettings, path: '/seller/settings' },
    { name: 'Visit Store', icon: FiExternalLink, path: '/', external: true },
];

const SellerSidebar = ({ isOpen, setIsOpen, isMobile, user }) => {
    const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || user?.business_name || 'Seller';
    const initial = (user?.first_name?.[0] || user?.business_name?.[0] || 'S').toUpperCase();

    return (
        <>
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 h-full z-50 bg-white border-r border-sky-100 shadow-[4px_0_24px_-12px_rgba(2,132,199,0.25)] transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } ${isMobile ? 'w-[17rem]' : 'w-64'} lg:translate-x-0 flex flex-col`}
                style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style>{`
                    aside::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
                    aside { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                `}</style>

                {/* Brand Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b border-sky-100 bg-white/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200 ring-1 ring-white/60 flex-shrink-0">
                            <span className="text-white font-extrabold text-sm">Z</span>
                        </div>
                        <div className="leading-tight text-left">
                            <span className="block text-base font-bold text-slate-800">Seller Panel</span>
                            <span className="block text-[11px] font-medium text-sky-600">Vendor Dashboard</span>
                        </div>
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors lg:hidden"
                        >
                            <FiChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {SELLER_NAV_ITEMS.map((item) => {
                            if (item.external) {
                                return (
                                    <li key={item.name}>
                                        <a
                                            href={item.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-sky-50/70 hover:text-blue-700 transition-all duration-200"
                                        >
                                            <item.icon className="w-[18px] h-[18px] flex-shrink-0 text-slate-500 group-hover:text-blue-600" />
                                            <span className="truncate flex-1 text-left">{item.name}</span>
                                        </a>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.path}
                                        onClick={() => {
                                            if (isMobile) setIsOpen(false);
                                        }}
                                        className={({ isActive }) =>
                                            `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-md shadow-sky-200'
                                                    : 'text-slate-600 hover:bg-sky-50/70 hover:text-blue-700 font-medium'
                                            }`
                                        }
                                    >
                                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                        <span className="truncate flex-1 text-left">{item.name}</span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Bottom User Card */}
                <div className="sticky bottom-0 border-t border-sky-100 p-3.5 bg-gradient-to-r from-sky-50/60 to-white">
                    <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-xs ring-1 ring-sky-100">
                        {user?.profile_image ? (
                            <img
                                src={user.profile_image}
                                alt={fullName}
                                className="w-9 h-9 rounded-full object-cover border border-sky-100 shadow-md shadow-sky-200 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center shadow-md shadow-sky-200 flex-shrink-0">
                                <span className="text-white font-bold text-sm">{initial}</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-slate-800 truncate">{fullName}</p>
                            <p className="text-[11px] text-sky-600 font-medium truncate capitalize">
                                {user?.user_type || 'Seller'}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SellerSidebar;
