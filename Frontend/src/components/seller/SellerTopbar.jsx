import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
    FiMenu, FiSearch, FiBell, FiHelpCircle, FiSettings, FiMail,
    FiShield, FiLogOut, FiExternalLink, FiChevronDown, FiX,
    FiCheckCircle, FiUser, FiBox, FiShoppingBag, FiTruck, FiDollarSign
} from 'react-icons/fi';
import UserAvatar from '../common/UserAvatar';

const MARKETPLACES = [
    { code: 'IN', name: 'Zyvento India', domain: 'zyvento.in', flag: '🇮🇳' },
    { code: 'US', name: 'Zyvento US', domain: 'zyvento.com', flag: '🇺🇸' },
    { code: 'AE', name: 'Zyvento UAE', domain: 'zyvento.ae', flag: '🇦🇪' },
];

const SellerTopbar = ({ sidebarOpen, setSidebarOpen, user }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [selectedMarketplace, setSelectedMarketplace] = useState(MARKETPLACES[0]);
    const [marketplaceDropdownOpen, setMarketplaceDropdownOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [messagesOpen, setMessagesOpen] = useState(false);

    const searchInputRef = useRef(null);

    // Keyboard shortcut '/' to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape') {
                setMarketplaceDropdownOpen(false);
                setProfileDropdownOpen(false);
                setSettingsDropdownOpen(false);
                setNotificationsOpen(false);
                setHelpOpen(false);
                setMessagesOpen(false);
                searchInputRef.current?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        const q = searchQuery.trim().toLowerCase();
        if (q.startsWith('#') || q.startsWith('ord') || /^\d+$/.test(q)) {
            navigate(`/seller/orders?search=${encodeURIComponent(q)}`);
        } else {
            navigate(`/seller/products?search=${encodeURIComponent(q)}`);
        }
        searchInputRef.current?.blur();
    };

    const businessName =
        user?.seller?.business_name ||
        user?.business_name ||
        (user?.first_name ? `${user.first_name}'s Store` : 'Merchant Store');

    const merchantCode = user?.seller?.seller_code || user?.seller_code || user?._id?.slice(-8)?.toUpperCase() || 'M-94821';

    return (
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between bg-[#131921] px-3 sm:px-5 text-white shadow-md select-none border-b border-[#232f3e]">
            {/* Left section: Hamburger, Brand, Marketplace Selector */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <button
                    type="button"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle Navigation"
                    className="flex h-9 w-9 items-center justify-center rounded text-slate-300 hover:bg-[#232f3e] hover:text-white transition-colors"
                >
                    <FiMenu size={20} />
                </button>

                {/* Amazon Seller Central Brand Badge */}
                <div
                    onClick={() => navigate('/seller/dashboard')}
                    className="flex items-center gap-2 cursor-pointer group pr-2"
                >
                    <div className="flex items-center">
                        <span className="font-black text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors">
                            Zyvento
                        </span>
                        <span className="ml-1.5 hidden md:inline-block rounded bg-[#ff9900] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
                            Seller Central
                        </span>
                    </div>
                </div>

                {/* Marketplace Switcher */}
                <div className="relative hidden lg:block">
                    <button
                        type="button"
                        onClick={() => setMarketplaceDropdownOpen(!marketplaceDropdownOpen)}
                        className="flex items-center gap-1.5 rounded border border-transparent px-2 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:bg-[#232f3e] transition"
                    >
                        <span>{selectedMarketplace.flag}</span>
                        <span className="text-slate-300">{selectedMarketplace.domain}</span>
                        <FiChevronDown size={13} className="text-slate-400" />
                    </button>

                    {marketplaceDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setMarketplaceDropdownOpen(false)} />
                            <div className="absolute left-0 mt-1 w-52 rounded-md border border-slate-700 bg-[#1f2937] p-1.5 shadow-2xl z-50 text-xs">
                                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Target Marketplace
                                </p>
                                {MARKETPLACES.map((m) => (
                                    <button
                                        key={m.code}
                                        type="button"
                                        onClick={() => {
                                            setSelectedMarketplace(m);
                                            setMarketplaceDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between rounded px-2.5 py-2 text-left transition ${
                                            selectedMarketplace.code === m.code
                                                ? 'bg-[#374151] font-bold text-amber-400'
                                                : 'text-slate-200 hover:bg-[#374151]/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{m.flag}</span>
                                            <span>{m.name}</span>
                                        </div>
                                        {selectedMarketplace.code === m.code && <FiCheckCircle size={13} className="text-amber-400" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Store Identifier Badge */}
                <div className="hidden xl:flex items-center gap-2 rounded border border-slate-700/80 bg-[#1a222d] px-2.5 py-1 text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Store is Active" />
                    <span className="font-bold text-slate-200 truncate max-w-[130px]" title={businessName}>
                        {businessName}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                        {merchantCode}
                    </span>
                </div>
            </div>

            {/* Center section: Global Search Bar */}
            <div className="flex-1 max-w-xl mx-2 sm:mx-6">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <div className="relative flex items-center">
                        <div className="absolute left-3 text-slate-400 pointer-events-none">
                            <FiSearch size={15} />
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                            placeholder="Search Seller Central: ASIN, SKU, Order ID, Help..."
                            className="w-full rounded-md border border-slate-700 bg-[#0f141b] pl-9 pr-14 py-1.5 text-xs text-white placeholder-slate-400 focus:border-[#ff9900] focus:bg-[#000] focus:ring-1 focus:ring-[#ff9900] outline-none transition"
                        />
                        <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none">
                            <kbd className="hidden sm:inline-block rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                                /
                            </kbd>
                        </div>
                    </div>

                    {/* Quick search suggestions popup */}
                    {searchFocused && (
                        <div className="absolute left-0 right-0 mt-1 rounded-md border border-slate-700 bg-[#1f2937] p-2 shadow-2xl z-50 text-xs">
                            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Search Suggestions & Shortcuts
                            </p>
                            <div className="space-y-0.5">
                                <button
                                    type="button"
                                    onMouseDown={() => navigate('/seller/orders')}
                                    className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-slate-200 hover:bg-[#374151] transition"
                                >
                                    <FiShoppingBag className="text-amber-400" size={14} />
                                    <span>Search by Order ID or Buyer Name</span>
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={() => navigate('/seller/products')}
                                    className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-slate-200 hover:bg-[#374151] transition"
                                >
                                    <FiBox className="text-blue-400" size={14} />
                                    <span>Search Catalog by SKU, ASIN or Title</span>
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={() => navigate('/seller/products/create')}
                                    className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-slate-200 hover:bg-[#374151] transition"
                                >
                                    <span className="text-emerald-400 font-bold">+</span>
                                    <span>Add a New Product Listing</span>
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Right section: Quick action icons & Profile */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Account Health Quick Pill */}
                <NavLink
                    to="/seller/dashboard#account-health"
                    className="hidden md:flex items-center gap-1.5 rounded px-2 py-1 text-xs font-bold text-emerald-400 hover:bg-[#232f3e] transition"
                    title="Account Health: Healthy (Score 248)"
                >
                    <FiShield size={14} className="text-emerald-400" />
                    <span className="text-[11px] font-semibold text-slate-200">AHR:</span>
                    <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[10px] text-emerald-300 font-bold">
                        Healthy
                    </span>
                </NavLink>

                {/* Buyer Messages (with Amazon 24h SLA) */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMessagesOpen(!messagesOpen)}
                        className="relative flex h-8 w-8 items-center justify-center rounded text-slate-300 hover:bg-[#232f3e] hover:text-white transition"
                        title="Buyer-Seller Messages (<24h SLA)"
                    >
                        <FiMail size={16} />
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white">
                            0
                        </span>
                    </button>

                    {messagesOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setMessagesOpen(false)} />
                            <div className="absolute right-0 mt-1 w-72 rounded-md border border-slate-700 bg-[#1f2937] p-3 shadow-2xl z-50 text-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                                        <FiMail className="text-amber-400" /> Buyer Messages
                                    </p>
                                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                                        100% On-Time SLA
                                    </span>
                                </div>
                                <div className="py-4 text-center text-slate-400">
                                    <FiCheckCircle className="mx-auto h-6 w-6 text-emerald-400 mb-1" />
                                    <p className="font-semibold text-slate-200">All messages answered</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">0 customer inquiries pending response</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative flex h-8 w-8 items-center justify-center rounded text-slate-300 hover:bg-[#232f3e] hover:text-white transition"
                        title="Seller Notifications & Policy Alerts"
                    >
                        <FiBell size={16} />
                    </button>

                    {notificationsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                            <div className="absolute right-0 mt-1 w-80 rounded-md border border-slate-700 bg-[#1f2937] p-3 shadow-2xl z-50 text-xs">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                                    <p className="font-bold text-slate-100 flex items-center gap-1.5">
                                        <FiBell className="text-amber-400" /> Notifications & Alerts
                                    </p>
                                    <span className="text-[10px] text-slate-400">Live Feed</span>
                                </div>
                                <div className="divide-y divide-slate-700/60 py-1">
                                    <div className="py-2">
                                        <p className="font-bold text-slate-200">Merchant Account Active</p>
                                        <p className="text-[11px] text-slate-400">Your store is approved and active on Zyvento Marketplace.</p>
                                    </div>
                                    <div className="py-2">
                                        <p className="font-bold text-amber-400">Fulfillment Cut-off</p>
                                        <p className="text-[11px] text-slate-400">Remember to confirm dispatch on all open standard orders by 4:00 PM today.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Help Flyout */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setHelpOpen(!helpOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-300 hover:bg-[#232f3e] hover:text-white transition"
                        title="Help & Seller Central Documentation"
                    >
                        <FiHelpCircle size={16} />
                    </button>

                    {helpOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)} />
                            <div className="absolute right-0 mt-1 w-64 rounded-md border border-slate-700 bg-[#1f2937] p-3 shadow-2xl z-50 text-xs">
                                <p className="font-bold text-slate-100 pb-2 border-b border-slate-700 flex items-center gap-1.5">
                                    <FiHelpCircle className="text-amber-400" /> Seller Help & Support
                                </p>
                                <div className="py-2 space-y-1">
                                    <a
                                        href="/help-center"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded px-2 py-1.5 text-slate-300 hover:bg-[#374151] hover:text-white"
                                    >
                                        <span>Seller Central Help Guide</span>
                                        <FiExternalLink size={12} />
                                    </a>
                                    <a
                                        href="/faqs"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded px-2 py-1.5 text-slate-300 hover:bg-[#374151] hover:text-white"
                                    >
                                        <span>Packaging & Shipping Policy</span>
                                        <FiExternalLink size={12} />
                                    </a>
                                    <a
                                        href="/contact"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded px-2 py-1.5 text-slate-300 hover:bg-[#374151] hover:text-white"
                                    >
                                        <span>Contact Merchant Support</span>
                                        <FiExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Settings Gear Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded text-slate-300 hover:bg-[#232f3e] hover:text-white transition"
                        title="Seller Central Settings"
                    >
                        <FiSettings size={16} />
                    </button>

                    {settingsDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setSettingsDropdownOpen(false)} />
                            <div className="absolute right-0 mt-1 w-56 rounded-md border border-slate-700 bg-[#1f2937] p-2 shadow-2xl z-50 text-xs">
                                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700 pb-1.5">
                                    Seller Settings
                                </p>
                                <div className="py-1 space-y-0.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigate('/seller/profile');
                                            setSettingsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-slate-200 hover:bg-[#374151] transition"
                                    >
                                        <FiUser size={13} className="text-amber-400" />
                                        <span>Account Info & Tax (GST/PAN)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigate('/seller/settings');
                                            setSettingsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-slate-200 hover:bg-[#374151] transition"
                                    >
                                        <FiTruck size={13} className="text-cyan-400" />
                                        <span>Shipping & Fulfillment Settings</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigate('/seller/earnings');
                                            setSettingsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-slate-200 hover:bg-[#374151] transition"
                                    >
                                        <FiDollarSign size={13} className="text-emerald-400" />
                                        <span>Bank Account & Payouts</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigate('/seller/settings');
                                            setSettingsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 rounded px-2.5 py-1.5 text-left text-slate-200 hover:bg-[#374151] transition"
                                    >
                                        <FiSettings size={13} className="text-slate-400" />
                                        <span>Holiday / Vacation Mode</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="h-5 w-[1px] bg-slate-700 mx-1 hidden sm:block" />

                {/* Profile & Logout Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2 rounded border border-transparent p-1 hover:border-slate-600 hover:bg-[#232f3e] transition"
                    >
                        <UserAvatar
                            src={user?.profile_image || user?.profileImage}
                            name={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Seller'}
                            size="sm"
                            shape="square"
                            className="h-7 w-7 text-[11px] font-bold rounded ring-1 ring-amber-400/50"
                        />
                        <div className="hidden text-left xl:block pr-0.5">
                            <p className="text-[11px] font-bold text-slate-100 leading-tight">
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Store Owner'}
                            </p>
                            <p className="text-[10px] text-amber-400 font-medium">Merchant Account</p>
                        </div>
                        <FiChevronDown size={12} className="text-slate-400 hidden sm:block" />
                    </button>

                    {profileDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                            <div className="absolute right-0 mt-1 w-56 rounded-md border border-slate-700 bg-[#1f2937] p-2 shadow-2xl z-50 text-xs">
                                <div className="border-b border-slate-700 px-2 py-1.5">
                                    <p className="font-bold text-slate-100">{user?.first_name} {user?.last_name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span className="rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 uppercase">
                                            Store Owner
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">{merchantCode}</span>
                                    </div>
                                </div>

                                <div className="py-1">
                                    <NavLink
                                        to="/seller/profile"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-2 rounded px-2.5 py-1.5 text-slate-200 hover:bg-[#374151] transition"
                                    >
                                        <FiUser size={14} className="text-slate-400" />
                                        <span>Account Info</span>
                                    </NavLink>
                                    <NavLink
                                        to="/"
                                        target="_blank"
                                        onClick={() => setProfileDropdownOpen(false)}
                                        className="flex items-center gap-2 rounded px-2.5 py-1.5 text-slate-200 hover:bg-[#374151] transition"
                                    >
                                        <FiExternalLink size={14} className="text-slate-400" />
                                        <span>View Public Marketplace</span>
                                    </NavLink>
                                </div>

                                <div className="border-t border-slate-700 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 font-bold text-rose-400 hover:bg-rose-950/40 transition"
                                    >
                                        <FiLogOut size={14} />
                                        <span>Sign Out of Seller Central</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SellerTopbar;
