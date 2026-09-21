import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    FiHome, FiPackage, FiPlusCircle, FiShoppingBag, FiDollarSign,
    FiUsers, FiSettings, FiExternalLink, FiChevronLeft, FiChevronRight,
    FiLayers, FiTruck, FiBox, FiHelpCircle, FiCheckCircle
} from 'react-icons/fi';

const SellerSidebar = ({ isOpen, setIsOpen, isMobile, user }) => {
    const location = useLocation();
    const [expandedModules, setExpandedModules] = useState({
        Products: true,
    });

    const toggleModule = (moduleName) => {
        setExpandedModules((prev) => ({
            ...prev,
            [moduleName]: !prev[moduleName],
        }));
    };

    const isChildActive = (item) => {
        return item.children?.some((child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/'));
    };

    // Navigation structure for Seller
    const navigation = [
        {
            name: 'Dashboard',
            icon: FiHome,
            path: '/seller/dashboard',
        },
        {
            name: 'Products',
            icon: FiPackage,
            children: [
                { name: 'All Products', path: '/seller/products', icon: FiLayers },
                { name: 'Add Product', path: '/seller/products/create', icon: FiPlusCircle },
            ],
        },
        {
            name: 'Orders',
            icon: FiShoppingBag,
            path: '/seller/orders',
        },
        {
            name: 'Earnings & Reports',
            icon: FiDollarSign,
            path: '/seller/earnings',
        },
        {
            name: 'Store Settings',
            icon: FiSettings,
            path: '/seller/settings',
        },
        {
            name: 'Visit Store',
            icon: FiExternalLink,
            path: '/',
            external: true,
        },
    ];

    const filteredNavigation = navigation;

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
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-200 ring-1 ring-white/60">
                            <span className="text-white font-extrabold text-sm">Z</span>
                        </div>
                        <div className="leading-tight text-left">
                            <span className="block text-base font-bold text-slate-800 !text-left">Seller Portal</span>
                            <span className="block text-[11px] font-medium text-sky-600 !text-left">Merchant Hub</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-colors lg:hidden"
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 !text-left">
                        Store Management
                    </p>
                    <ul className="space-y-1">
                        {filteredNavigation.map((item, index) => {
                            if (item.children) {
                                const isExpanded = expandedModules[item.name] || false;
                                const anyChildActive = isChildActive(item);
                                return (
                                    <li key={index}>
                                        <button
                                            onClick={() => toggleModule(item.name)}
                                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 !text-left ${
                                                isExpanded || anyChildActive
                                                    ? 'bg-sky-50 text-blue-700 font-semibold'
                                                    : 'text-slate-600 hover:bg-sky-50/70 hover:text-blue-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1 !text-left">
                                                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${anyChildActive ? 'text-blue-700' : ''}`} />
                                                <span className="truncate !text-left flex-1">{item.name}</span>
                                            </div>
                                            {isExpanded ? (
                                                <FiChevronRight className="w-4 h-4 rotate-90 transition-transform duration-200" />
                                            ) : (
                                                <FiChevronRight className="w-4 h-4 transition-transform duration-200" />
                                            )}
                                        </button>
                                        {isExpanded && (
                                            <ul className="ml-5 mt-1 space-y-1 border-l border-sky-100 pl-3">
                                                {item.children.map((child) => {
                                                    const ChildIcon = child.icon || FiChevronRight;
                                                    return (
                                                        <li key={child.path}>
                                                            <NavLink
                                                                to={child.path}
                                                                end={child.path === '/seller/products'}
                                                                className={({ isActive }) =>
                                                                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 !text-left ${
                                                                        isActive
                                                                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-md shadow-sky-200'
                                                                            : 'text-slate-500 hover:bg-sky-50 hover:text-blue-700'
                                                                    }`
                                                                }
                                                            >
                                                                <ChildIcon className="w-4 h-4 flex-shrink-0" />
                                                                <span className="!text-left flex-1">{child.name}</span>
                                                            </NavLink>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                );
                            }

                            return (
                                <li key={index}>
                                    <NavLink
                                        to={item.path}
                                        end={item.path === '/seller/dashboard' || item.path === '/'}
                                        className={({ isActive }) =>
                                            `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 !text-left ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-md shadow-sky-200'
                                                    : 'text-slate-600 hover:bg-sky-50/70 hover:text-blue-700'
                                            }`
                                        }
                                    >
                                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                        <span className="truncate !text-left flex-1">{item.name}</span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Seller Profile Footer */}
                <div className="sticky bottom-0 border-t border-sky-100 p-4 bg-gradient-to-r from-sky-50 to-white">
                    <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-sky-100">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-sky-600 rounded-full flex items-center justify-center shadow-md shadow-sky-200 flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                                {user?.business_name?.[0] || user?.first_name?.[0] || 'S'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 !text-left">
                            <p className="text-sm font-semibold text-slate-800 truncate !text-left">
                                {user?.business_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'My Store'}
                            </p>
                            <p className="text-[11px] text-sky-600 font-medium truncate capitalize !text-left">
                                Store Owner
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SellerSidebar;
