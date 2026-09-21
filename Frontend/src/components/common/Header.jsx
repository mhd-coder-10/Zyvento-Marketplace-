import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
    FiSearch, FiShoppingBag, FiHeart, FiShoppingCart, FiUser, FiMenu,
    FiX, FiChevronDown, FiChevronRight, FiGrid, FiPackage, FiMapPin,
    FiSettings, FiHelpCircle, FiLogOut, FiLogIn, FiSliders, FiTrendingUp,
    FiClock, FiShield, FiBriefcase, FiLayers
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';
import UserAvatar from './UserAvatar';
import { useSystemSettings } from '../../context/SettingsContext';

const Header = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { settings } = useSystemSettings();

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    const accountRef = useRef(null);
    const searchRef = useRef(null);
    const categoryRef = useRef(null);

    // Scroll listener for glassmorphism
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('zv_recent_searches');
            if (raw) setRecentSearches(JSON.parse(raw).slice(0, 5));
        } catch { }
    }, []);

    // Load active categories
    useEffect(() => {
        let isMounted = true;
        ApiService.getActiveCategories()
            .then((res) => {
                if (!isMounted) return;
                const d = res?.data?.data || res?.data?.categories || res?.data || [];
                const list = Array.isArray(d) ? d : [];
                setCategories(list.slice(0, 12));
            })
            .catch(() => { });
        return () => { isMounted = false; };
    }, []);

    // Load cart & wishlist counts
    useEffect(() => {
        if (!isAuthenticated) {
            setCartCount(0);
            setWishlistCount(0);
            return;
        }
        let isMounted = true;
        ApiService.getCartCount()
            .then((res) => {
                if (!isMounted) return;
                const count = res?.data?.data?.count ?? res?.data?.data?.totalItems ?? res?.data?.count ?? 0;
                setCartCount(count);
            })
            .catch(() => { });

        ApiService.getWishlist({ page: 1, limit: 1 })
            .then((res) => {
                if (!isMounted) return;
                const count = res?.data?.data?.total ?? res?.data?.pagination?.total ?? res?.data?.count ?? 0;
                setWishlistCount(count);
            })
            .catch(() => { });

        return () => { isMounted = false; };
    }, [isAuthenticated, location.pathname]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) {
                setAccountMenuOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchFocused(false);
            }
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setCategoryMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setAccountMenuOpen(false);
        setCategoryMenuOpen(false);
        setSearchFocused(false);
    }, [location.pathname]);

    // Debounced search suggestions
    useEffect(() => {
        const term = searchQuery.trim();
        if (term.length < 2) {
            setSuggestions([]);
            setSearchLoading(false);
            return;
        }

        let isMounted = true;
        setSearchLoading(true);
        const timer = setTimeout(() => {
            ApiService.getAllProducts({ search: term, page: 1, limit: 6 })
                .then((res) => {
                    if (!isMounted) return;
                    const d = res?.data?.data?.products || res?.data?.data || [];
                    setSuggestions(Array.isArray(d) ? d : []);
                })
                .catch(() => {
                    if (isMounted) setSuggestions([]);
                })
                .finally(() => {
                    if (isMounted) setSearchLoading(false);
                });
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const term = searchQuery.trim();
        if (!term) return;

        // Save to recent searches
        try {
            const updated = [term, ...recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
            setRecentSearches(updated);
            localStorage.setItem('zv_recent_searches', JSON.stringify(updated));
        } catch { }

        setSearchFocused(false);
        navigate(`/search-results?q=${encodeURIComponent(term)}`);
    };

    const handleLogout = async () => {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
        await dispatch(logoutUser());
        navigate('/login', { replace: true });
    };

    const userType = user?.user_type || user?.role?.role_type || 'customer';
    const isSuperOrSubAdmin = ['super_admin', 'sub_admin'].includes(userType);
    const isSeller = ['seller', 'seller_employee'].includes(userType);

    const formatCurrency = (v) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(2,132,199,0.12)] border-b border-sky-100'
                    : 'bg-white border-b border-slate-100 shadow-sm'
            }`}
        >
            {/* Top Bar / Announcement (Desktop only) */}
            <div className="hidden lg:block bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white text-[12px] font-medium py-1.5 px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            ⚡ Flash Deals
                        </span>
                        <span>{settings?.announcement_text || 'Free Shipping on prepaid orders above ₹499 | Express 48h Delivery'}</span>
                    </div>
                    <div className="flex items-center gap-5 text-sky-100">
                        {!isSeller && (
                            <Link to="/become-seller" className="hover:text-white transition flex items-center gap-1">
                                <FiBriefcase className="h-3.5 w-3.5" /> Sell on {settings?.site_name || 'Zyvento'}
                            </Link>
                        )}
                        <Link to="/help-center" className="hover:text-white transition flex items-center gap-1">
                            <FiHelpCircle className="h-3.5 w-3.5" /> Help & Support
                        </Link>
                        <Link to="/order-tracking" className="hover:text-white transition flex items-center gap-1">
                            <FiPackage className="h-3.5 w-3.5" /> Track Order
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Header Container */}
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
                    
                    {/* Left: Mobile Drawer Trigger + Brand Logo */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition"
                            aria-label="Open menu"
                        >
                            <FiMenu className="h-6 w-6" />
                        </button>

                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <FiShoppingBag className="h-5 w-5" />
                            </div>
                            <div className="leading-tight">
                                <span className="block text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                                    Zyvento
                                </span>
                                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                                    Marketplace
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Middle: Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 max-w-2xl relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="w-full relative">
                            <div className="relative flex items-center">
                                <FiSearch className="absolute left-4 text-slate-400 h-5 w-5 pointer-events-none" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    placeholder="Search 10,000+ products, brands, categories..."
                                    className="w-full h-11 pl-11 pr-24 rounded-2xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none transition-all shadow-inner"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-20 p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        <FiX className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="absolute right-1.5 h-8 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold hover:from-sky-600 hover:to-blue-700 shadow-sm transition flex items-center justify-center"
                                >
                                    Search
                                </button>
                            </div>
                        </form>

                        {/* Search Suggestions Dropdown */}
                        {searchFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-sky-100 shadow-2xl overflow-hidden z-50 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                                {searchLoading ? (
                                    <div className="p-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                                        Searching products...
                                    </div>
                                ) : searchQuery.trim().length >= 2 ? (
                                    <div>
                                        <div className="p-3 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            Product Matches
                                        </div>
                                        {suggestions.length > 0 ? (
                                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                                {suggestions.map((p) => {
                                                    const img = p.images?.[0]?.url || p.images?.[0] || p.image;
                                                    const title = p.product_name || p.name;
                                                    const price = p.final_price || p.finalPrice || p.price;
                                                    return (
                                                        <Link
                                                            key={p._id || p.id}
                                                            to={`/products/${p._id || p.id}`}
                                                            onClick={() => setSearchFocused(false)}
                                                            className="flex items-center gap-3.5 p-3 hover:bg-sky-50/60 transition group"
                                                        >
                                                            <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                {img ? (
                                                                    <img src={img} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                                                ) : (
                                                                    <FiShoppingBag className="text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                                    {title}
                                                                </p>
                                                                <p className="text-xs text-slate-400">
                                                                    {p.brand ? `${p.brand} • ` : ''}
                                                                    <span className="font-bold text-blue-700">{formatCurrency(price)}</span>
                                                                </p>
                                                            </div>
                                                            <FiChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center text-sm text-slate-400">
                                                No products found for "{searchQuery}". Try a different keyword.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-4">
                                        {recentSearches.length > 0 && (
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                    <FiClock className="h-3.5 w-3.5" /> Recent Searches
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {recentSearches.map((term) => (
                                                        <button
                                                            key={term}
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchQuery(term);
                                                                navigate(`/search-results?q=${encodeURIComponent(term)}`);
                                                                setSearchFocused(false);
                                                            }}
                                                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-blue-700 text-xs font-medium text-slate-700 transition"
                                                        >
                                                            {term}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                <FiTrendingUp className="h-3.5 w-3.5 text-rose-500" /> Trending Searches
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {['Wireless Earbuds', 'Smart Watches', 'Sneakers', 'Laptops', 'Gaming Consoles', 'Organic Cotton T-Shirts'].map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => {
                                                            setSearchQuery(t);
                                                            navigate(`/search-results?q=${encodeURIComponent(t)}`);
                                                            setSearchFocused(false);
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-blue-700 text-xs font-medium text-slate-700 transition"
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions (Account, Wishlist, Cart) */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        
                        {/* Account Menu Dropdown */}
                        <div className="relative" ref={accountRef}>
                            {isAuthenticated ? (
                                <button
                                    type="button"
                                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                                    className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl border transition-all ${
                                        accountMenuOpen
                                            ? 'border-sky-400 bg-sky-50/70 text-blue-700 shadow-sm'
                                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <UserAvatar
                                        src={user?.profile_image}
                                        name={user?.first_name || 'User'}
                                        size="sm"
                                        shape="square"
                                        className="rounded-xl shadow-sm"
                                    />
                                    <div className="hidden lg:block text-left leading-tight">
                                        <p className="text-xs text-slate-400 font-medium">Hello,</p>
                                        <p className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                                            {user?.first_name || 'Account'}
                                        </p>
                                    </div>
                                    <FiChevronDown className={`h-4 w-4 text-slate-400 transition-transform hidden sm:block ${accountMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-blue-700 text-xs sm:text-sm font-semibold transition"
                                >
                                    <FiLogIn className="h-4 w-4 text-sky-600" />
                                    <span>Sign In</span>
                                </Link>
                            )}

                            {/* Account Dropdown Modal */}
                            {accountMenuOpen && isAuthenticated && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-sky-100 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {/* User Greeting & Badges */}
                                    <div className="p-3 bg-gradient-to-br from-sky-50 to-blue-50/50 rounded-xl mb-2">
                                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">
                                            {user?.first_name} {user?.last_name}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white text-blue-700 shadow-sm border border-sky-100">
                                            {userType.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {/* === ROLE DASHBOARD PROMINENT BUTTON === */}
                                    {isSuperOrSubAdmin && (
                                        <Link
                                            to="/admin/dashboard"
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-blue-500/25 hover:from-sky-600 hover:to-blue-700 transition group mb-2"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FiShield className="h-5 w-5" />
                                                <div className="text-left">
                                                    <p className="text-xs font-bold leading-tight">Admin Command Center</p>
                                                    <p className="text-[10px] text-sky-100">Manage Platform & Users</p>
                                                </div>
                                            </div>
                                            <FiChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    )}

                                    {isSeller && (
                                        <Link
                                            to="/seller/dashboard"
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-emerald-600 hover:to-teal-700 transition group mb-2"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FiBriefcase className="h-5 w-5" />
                                                <div className="text-left">
                                                    <p className="text-xs font-bold leading-tight">Seller Merchant Hub</p>
                                                    <p className="text-[10px] text-emerald-100">Products, Orders & Sales</p>
                                                </div>
                                            </div>
                                            <FiChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    )}

                                    {/* Menu Items */}
                                    <div className="space-y-1 text-sm font-medium text-slate-700">
                                        <Link
                                            to={isSuperOrSubAdmin ? "/admin/profile" : isSeller ? "/seller/profile" : "/profile"}
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-blue-700 transition"
                                        >
                                            <FiUser className="h-4 w-4 text-sky-600" />
                                            <span>My Profile</span>
                                        </Link>
                                        <Link
                                            to="/orders"
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-blue-700 transition"
                                        >
                                            <FiPackage className="h-4 w-4 text-sky-600" />
                                            <span>My Orders</span>
                                        </Link>
                                        <Link
                                            to="/wishlist"
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-blue-700 transition"
                                        >
                                            <FiHeart className="h-4 w-4 text-rose-500" />
                                            <span>My Wishlist</span>
                                        </Link>
                                        <Link
                                            to="/addresses"
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-blue-700 transition"
                                        >
                                            <FiMapPin className="h-4 w-4 text-sky-600" />
                                            <span>Saved Addresses</span>
                                        </Link>
                                        <Link
                                            to="/settings"
                                            onClick={() => setAccountMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sky-50 hover:text-blue-700 transition"
                                        >
                                            <FiSettings className="h-4 w-4 text-slate-500" />
                                            <span>Account Settings</span>
                                        </Link>
                                        {!isSeller && !isSuperOrSubAdmin && (
                                            <Link
                                                to="/become-seller"
                                                onClick={() => setAccountMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition font-semibold text-emerald-600"
                                            >
                                                <FiBriefcase className="h-4 w-4" />
                                                <span>Become a Seller</span>
                                            </Link>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100 my-1 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-sm font-semibold transition"
                                        >
                                            <FiLogOut className="h-4 w-4" />
                                            <span>Log Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Wishlist Icon */}
                        <Link
                            to="/wishlist"
                            className="relative p-2.5 sm:px-3 sm:py-2 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-700 hover:text-rose-600 transition flex items-center gap-1.5"
                            aria-label="Wishlist"
                        >
                            <FiHeart className="h-5 w-5" />
                            <span className="hidden lg:inline text-xs font-semibold">Wishlist</span>
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 sm:top-1 sm:right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
                                    {wishlistCount > 99 ? '99+' : wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart Button */}
                        <Link
                            to="/cart"
                            className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition active:scale-95"
                            aria-label="Shopping Cart"
                        >
                            <FiShoppingCart className="h-5 w-5" />
                            <span className="hidden sm:inline">Cart</span>
                            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-white text-blue-700 text-xs font-extrabold flex items-center justify-center">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Mobile Search Bar (under logo on small screens) */}
                <div className="md:hidden pb-3 pt-1">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products, brands..."
                            className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* Bottom Category Bar (Desktop) */}
            <nav className="hidden lg:block border-t border-slate-100 bg-slate-50/70 px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
                        {/* All Categories Dropdown Trigger */}
                        <div className="relative" ref={categoryRef}>
                            <button
                                type="button"
                                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    categoryMenuOpen
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-800 hover:border-sky-300 hover:bg-sky-50 hover:text-blue-700'
                                }`}
                            >
                                <FiGrid className="h-3.5 w-3.5" />
                                <span>All Categories</span>
                                <FiChevronDown className={`h-3 w-3 transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Categories Mega Dropdown */}
                            {categoryMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl border border-sky-100 shadow-2xl p-2 z-50 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="p-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Shop by Department
                                    </div>
                                    <div className="max-h-96 overflow-y-auto py-1">
                                        <Link
                                            to="/products"
                                            onClick={() => setCategoryMenuOpen(false)}
                                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 hover:bg-sky-50 transition"
                                        >
                                            <span>🔥 All Marketplace Products</span>
                                            <FiChevronRight className="h-3.5 w-3.5" />
                                        </Link>
                                        {categories.map((cat) => (
                                            <Link
                                                key={cat._id || cat.id || cat.name}
                                                to={`/products?category=${encodeURIComponent(cat._id || cat.id || cat.name)}`}
                                                onClick={() => setCategoryMenuOpen(false)}
                                                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-blue-700 transition"
                                            >
                                                <span>{cat.name || cat.title}</span>
                                                <FiChevronRight className="h-3.5 w-3.5 text-slate-300" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Top Category Direct Links */}
                        {categories.slice(0, 7).map((cat) => (
                            <Link
                                key={cat._id || cat.id || cat.name}
                                to={`/products?category=${encodeURIComponent(cat._id || cat.id || cat.name)}`}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-white transition whitespace-nowrap"
                            >
                                {cat.name || cat.title}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600 py-2">
                        <Link to="/products" className="hover:text-blue-600 transition flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Top Offers
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-4 z-10 animate-in slide-in-from-left duration-200">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                        <FiShoppingBag />
                                    </div>
                                    <span className="font-extrabold text-base text-slate-900">Zyvento</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                                >
                                    <FiX className="h-5 w-5" />
                                </button>
                            </div>

                            {/* User Account Quick Card in Drawer */}
                            <div className="my-4 p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                                {isAuthenticated ? (
                                    <div>
                                        <p className="text-xs text-slate-400">Welcome,</p>
                                        <p className="text-sm font-bold text-slate-900">{user?.first_name} {user?.last_name}</p>
                                        <p className="text-xs text-slate-500">{user?.email}</p>

                                        {isSuperOrSubAdmin && (
                                            <Link
                                                to="/admin/dashboard"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                                            >
                                                <FiShield className="h-4 w-4" /> Admin Dashboard
                                            </Link>
                                        )}

                                        {isSeller && (
                                            <Link
                                                to="/seller/dashboard"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-sm"
                                            >
                                                <FiBriefcase className="h-4 w-4" /> Seller Dashboard
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Link
                                            to="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex-1 text-center py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex-1 text-center py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Links */}
                            <div className="space-y-1 text-sm font-semibold text-slate-700">
                                {isAuthenticated && (
                                    <Link
                                        to={isSuperOrSubAdmin ? "/admin/profile" : isSeller ? "/seller/profile" : "/profile"}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-50 hover:text-blue-700"
                                    >
                                        <FiUser className="h-4 w-4 text-sky-600" />
                                        <span>My Profile</span>
                                    </Link>
                                )}
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-50 hover:text-blue-700"
                                >
                                    <span>Home</span>
                                </Link>
                                <Link
                                    to="/products"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-50 hover:text-blue-700"
                                >
                                    <span>All Products</span>
                                </Link>
                                <Link
                                    to="/orders"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-50 hover:text-blue-700"
                                >
                                    <span>My Orders</span>
                                </Link>
                                <Link
                                    to="/wishlist"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-50 hover:text-blue-700"
                                >
                                    <span>Wishlist ({wishlistCount})</span>
                                </Link>
                                <Link
                                    to="/cart"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-50 hover:text-blue-700"
                                >
                                    <span>Cart ({cartCount})</span>
                                </Link>
                                {!isSeller && !isSuperOrSubAdmin && (
                                    <Link
                                        to="/become-seller"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 p-2.5 rounded-xl text-emerald-600 font-bold hover:bg-emerald-50"
                                    >
                                        <FiBriefcase className="h-4 w-4" /> Become a Seller
                                    </Link>
                                )}
                            </div>

                            {/* Categories List */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Categories
                                </p>
                                <div className="space-y-1">
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat._id || cat.id || cat.name}
                                            to={`/products?category=${encodeURIComponent(cat._id || cat.id || cat.name)}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-3 py-1.5 text-xs text-slate-600 hover:text-blue-700 rounded-lg hover:bg-slate-50"
                                        >
                                            {cat.name || cat.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {isAuthenticated && (
                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition"
                                >
                                    <FiLogOut className="h-4 w-4" /> Log Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
