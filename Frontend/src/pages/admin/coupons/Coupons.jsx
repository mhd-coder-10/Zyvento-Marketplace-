import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch, FiEye, FiEdit2, FiTrash2, FiPlus, FiRefreshCw,
    FiTag, FiClock, FiCheckCircle, FiXCircle, FiPercent,
    FiCalendar, FiCopy, FiCheck, FiSliders, FiX, FiInfo,
    FiChevronLeft, FiChevronRight, FiUsers, FiDollarSign
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const TABS = [
    { id: 'all', label: 'All Coupons', icon: FiTag },
    { id: 'active', label: 'Active', icon: FiCheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'pending', label: 'Upcoming / Pending', icon: FiClock, color: 'text-amber-600 bg-amber-50' },
    { id: 'expired', label: 'Expired', icon: FiXCircle, color: 'text-rose-600 bg-rose-50' },
    { id: 'disabled', label: 'Disabled', icon: FiXCircle, color: 'text-slate-600 bg-slate-50' },
];

const Coupons = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Active tab directly from URL searchParams
    const activeTab = searchParams.get('tab') || 'all';

    const [allCoupons, setAllCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, code: null });
    const [copiedCode, setCopiedCode] = useState(null);

    // Debounce ONLY search input for smooth typing without lag
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 150);
        return () => clearTimeout(timer);
    }, [search]);

    // Dynamic, foolproof status evaluation
    const getCouponStatus = useCallback((coupon) => {
        if (!coupon) return 'active';
        if (coupon.status === 'disabled') return 'disabled';
        const now = new Date();
        const expiry = coupon.expiryDate || coupon.expiry_date;
        if (expiry && new Date(expiry) < now) return 'expired';
        const start = coupon.startDate || coupon.start_date;
        if (start && new Date(start) > now) return 'pending';
        return coupon.status || 'active';
    }, []);

    const isCouponExpired = useCallback((coupon) => {
        const expiry = coupon.expiryDate || coupon.expiry_date;
        return expiry ? new Date(expiry) < new Date() : false;
    }, []);

    // Fetch all coupons
    const fetchCoupons = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await ApiService.getAllCoupons({ limit: 100 });
            if (res.data?.success) {
                const data = res.data.data || [];
                setAllCoupons(data);
            }
        } catch (error) {
            console.error('Failed to load coupons', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons(true);
    }, [fetchCoupons]);

    // Handle tab change: 0ms instantaneous switch
    const handleTabChange = (tabId) => {
        setSearchParams(tabId === 'all' ? {} : { tab: tabId });
        setCurrentPage(1);
    };

    // Row click navigation
    const handleRowClick = (code) => {
        navigate(`/admin/coupons/${code}`);
    };

    // Action clicks
    const handleActionClick = (e, action, code) => {
        e.stopPropagation();
        if (action === 'view') navigate(`/admin/coupons/${code}`);
        else if (action === 'edit') navigate(`/admin/coupons/edit/${code}`);
        else if (action === 'delete') setDeleteConfirm({ open: true, code });
    };

    const handleCopyCode = (e, code) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.info(`Coupon code "${code}" copied!`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleDelete = async () => {
        if (!deleteConfirm.code) return;
        try {
            await ApiService.deleteCoupon(deleteConfirm.code);
            toast.success('Coupon deleted successfully');
            fetchCoupons(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete coupon');
        } finally {
            setDeleteConfirm({ open: false, code: null });
        }
    };

    // Calculate real-time stats from all coupons in memory
    const stats = useMemo(() => {
        const counts = { total: allCoupons.length, active: 0, expired: 0, pending: 0, disabled: 0 };
        allCoupons.forEach(c => {
            const st = getCouponStatus(c);
            if (counts[st] !== undefined) {
                counts[st]++;
            }
        });
        return counts;
    }, [allCoupons, getCouponStatus]);

    // Fast in-memory filter: Tab + Discount Type + Search (0ms instant response)
    const filteredCoupons = useMemo(() => {
        return allCoupons.filter(c => {
            // 1. Tab Status Filter
            const st = getCouponStatus(c);
            if (activeTab !== 'all' && st !== activeTab) {
                return false;
            }

            // 2. Discount Type Filter
            const type = c.discountType || c.discount_type;
            if (discountTypeFilter !== 'all' && type !== discountTypeFilter) {
                return false;
            }

            // 3. Search Filter
            if (debouncedSearch.trim()) {
                const q = debouncedSearch.trim().toLowerCase();
                const codeMatch = (c.code || c.coupon_code || '').toLowerCase().includes(q);
                const descMatch = (c.description || '').toLowerCase().includes(q);
                if (!codeMatch && !descMatch) return false;
            }

            return true;
        });
    }, [allCoupons, activeTab, discountTypeFilter, debouncedSearch, getCouponStatus]);

    // Pagination calculations
    const totalItems = filteredCoupons.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedCoupons = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCoupons.slice(start, start + pageSize);
    }, [filteredCoupons, currentPage, pageSize]);

    const getStatusBadge = (coupon) => {
        const status = getCouponStatus(coupon);

        const map = {
            active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            pending: { label: 'Upcoming', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
            expired: { label: 'Expired', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
            disabled: { label: 'Disabled', bg: 'bg-slate-100 text-slate-600 border-slate-200' }
        };

        const config = map[status] || map.disabled;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                    status === 'active' ? 'bg-emerald-500' :
                    status === 'pending' ? 'bg-amber-500' :
                    status === 'expired' ? 'bg-rose-500' : 'bg-slate-400'
                }`}></span>
                {config.label}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getTabCount = (tabId) => {
        switch (tabId) {
            case 'all': return stats.total || 0;
            case 'active': return stats.active || 0;
            case 'pending': return stats.pending || 0;
            case 'expired': return stats.expired || 0;
            case 'disabled': return stats.disabled || 0;
            default: return 0;
        }
    };

    const hasActiveFilters = search.trim() !== '' || discountTypeFilter !== 'all';

    const clearFilters = () => {
        setSearch('');
        setDiscountTypeFilter('all');
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Coupon Management"
                subtitle="Configure discount codes, promotional offers, and checkout redemption rules"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fetchCoupons(false)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                            title="Refresh coupons"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/coupons/create')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition"
                        >
                            <FiPlus className="w-4 h-4" /> Create Coupon
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6 px-4 md:px-6">

                {/* Zyvento Platform-Funded Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl shrink-0 text-blue-300">
                            <FiInfo className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm sm:text-base text-white">100% Zyvento Platform-Funded Promotions</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                    Seller Protected
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                All coupon discounts configured here are absorbed entirely by Zyvento as promotional expenses. Marketplace sellers receive settlement based on the original full listing price.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/reports?tab=coupons')}
                        className="self-start sm:self-auto shrink-0 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
                    >
                        <span>View Coupon Reports</span>
                        <FiChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Tabs Navigation (Instant 0ms latency) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                        {TABS.map((tab) => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const count = getTabCount(tab.id);

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4 shrink-0" />
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4 KPI Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <FiTag className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Total Coupons</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                <FiCheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.active || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Active Coupons</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                                <FiClock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.expired || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Expired Coupons</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.disabled || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Disabled / Other</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            {/* Search */}
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by coupon code or campaign description..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <FiX className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Discount Type Filter */}
                            <div className="w-full sm:w-48">
                                <select
                                    value={discountTypeFilter}
                                    onChange={(e) => setDiscountTypeFilter(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                                >
                                    <option value="all">All Discount Types</option>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                        </div>

                        {/* Reset Filters */}
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                            >
                                <FiX className="w-3.5 h-3.5" />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
                    {/* Subtle Loading Progress Bar */}
                    {isRefreshing && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-10">
                            <div className="w-full h-full bg-blue-600 animate-pulse"></div>
                        </div>
                    )}

                    {loading ? (
                        <div className="p-16 text-center">
                            <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-600">Loading coupons...</p>
                        </div>
                    ) : paginatedCoupons.length === 0 ? (
                        <div className="p-16 text-center">
                            <FiTag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-slate-800">No coupons found</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                {hasActiveFilters
                                    ? 'No coupons match your filter criteria. Try adjusting or clearing search filters.'
                                    : activeTab !== 'all'
                                    ? `No coupons currently match the "${TABS.find(t => t.id === activeTab)?.label}" status.`
                                    : 'No coupons have been created yet. Click "Create Coupon" to add your first voucher.'}
                            </p>
                            {hasActiveFilters ? (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                                >
                                    Clear Filters
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/admin/coupons/create')}
                                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                                >
                                    Create Coupon
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3.5">Coupon Code</th>
                                        <th className="px-5 py-3.5">Discount Offer</th>
                                        <th className="px-5 py-3.5">Usage & Limits</th>
                                        <th className="px-5 py-3.5">Validity Period</th>
                                        <th className="px-5 py-3.5 text-center">Status</th>
                                        <th className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {paginatedCoupons.map((coupon) => {
                                        const type = coupon.discountType || coupon.discount_type;
                                        const value = coupon.discountValue || coupon.discount_value;
                                        const minOrder = coupon.minOrderAmount || coupon.min_order_amount;
                                        const maxDiscount = coupon.maxDiscountAmount || coupon.max_discount_amount;
                                        const used = coupon.usedCount || coupon.used_count || 0;
                                        const limit = coupon.usageLimit || coupon.usage_limit;
                                        const perUser = coupon.perUserLimit || coupon.per_user_limit || 1;
                                        const expired = isCouponExpired(coupon);

                                        const usagePercent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

                                        return (
                                            <tr
                                                key={coupon._id || coupon.code || coupon.coupon_code}
                                                onClick={() => handleRowClick(coupon.code || coupon.coupon_code)}
                                                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                                            >
                                                {/* Coupon Code */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 font-mono font-bold text-blue-700 text-xs group-hover:border-blue-300">
                                                            <FiTag className="w-3.5 h-3.5 text-blue-500" />
                                                            <span>{coupon.code || coupon.coupon_code}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleCopyCode(e, coupon.code || coupon.coupon_code)}
                                                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                                                            title="Copy code"
                                                        >
                                                            {copiedCode === (coupon.code || coupon.coupon_code) ? (
                                                                <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <FiCopy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1 max-w-xs truncate" title={coupon.description}>
                                                        {coupon.description || 'General promotion coupon'}
                                                    </p>
                                                </td>

                                                {/* Discount Offer */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="font-bold text-slate-900 text-base">
                                                            {type === 'percentage' ? `${value}% OFF` : `₹${value} OFF`}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-slate-400 uppercase">
                                                            ({type === 'percentage' ? 'Percent' : 'Flat'})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                        <span>Min: ₹{minOrder || 0}</span>
                                                        {maxDiscount > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Max: ₹{maxDiscount}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Usage & Limits */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="font-semibold text-slate-800">
                                                            {used}
                                                        </span>
                                                        <span className="text-slate-400">
                                                            / {limit ? `${limit} total` : 'Unlimited'}
                                                        </span>
                                                    </div>
                                                    {limit > 0 && (
                                                        <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${
                                                                    usagePercent >= 90 ? 'bg-rose-500' :
                                                                    usagePercent >= 60 ? 'bg-amber-500' : 'bg-blue-500'
                                                                }`}
                                                                style={{ width: `${usagePercent}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        Max {perUser} per customer
                                                    </p>
                                                </td>

                                                {/* Validity Period */}
                                                <td className="px-5 py-4">
                                                    <div className="text-xs font-medium text-slate-800">
                                                        <span>{formatDate(coupon.startDate || coupon.start_date)}</span>
                                                        <span className="text-slate-400 mx-1">→</span>
                                                        <span className={expired ? 'text-rose-600 font-semibold' : 'text-slate-800'}>
                                                            {formatDate(coupon.expiryDate || coupon.expiry_date)}
                                                        </span>
                                                    </div>
                                                    {expired && (
                                                        <span className="text-[11px] font-semibold text-rose-500 mt-0.5 block">
                                                            Validity ended
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4 text-center">
                                                    {getStatusBadge(coupon)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleActionClick(e, 'view', coupon.code || coupon.coupon_code)}
                                                            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                                            title="View coupon details"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleActionClick(e, 'edit', coupon.code || coupon.coupon_code)}
                                                            className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                                                            title="Edit coupon"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleActionClick(e, 'delete', coupon.code || coupon.coupon_code)}
                                                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                                                            title="Delete coupon"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden space-y-3.5">
                    {loading ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                            <FiRefreshCw className="animate-spin text-blue-600 w-7 h-7 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600">Loading coupons...</p>
                        </div>
                    ) : paginatedCoupons.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                            <FiTag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <h3 className="text-sm font-bold text-slate-800">No coupons found</h3>
                            <p className="text-xs text-slate-400 mt-1">Adjust filters or create a new coupon voucher.</p>
                        </div>
                    ) : (
                        paginatedCoupons.map((coupon) => {
                            const code = coupon.code || coupon.coupon_code;
                            const type = coupon.discountType || coupon.discount_type;
                            const value = coupon.discountValue || coupon.discount_value;
                            const minOrder = coupon.minOrderAmount || coupon.min_order_amount;
                            const maxDiscount = coupon.maxDiscountAmount || coupon.max_discount_amount;
                            const used = coupon.usedCount || coupon.used_count || 0;
                            const limit = coupon.usageLimit || coupon.usage_limit;
                            const perUser = coupon.perUserLimit || coupon.per_user_limit || 1;
                            const expired = isCouponExpired(coupon);

                            return (
                                <div
                                    key={coupon._id || code}
                                    onClick={() => handleRowClick(code)}
                                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 active:scale-[0.99] transition cursor-pointer"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 font-mono font-bold text-blue-700 text-xs">
                                            <FiTag className="w-3.5 h-3.5 text-blue-500" />
                                            <span>{code}</span>
                                        </div>
                                        {getStatusBadge(coupon)}
                                    </div>

                                    <div className="flex items-baseline justify-between">
                                        <div>
                                            <span className="text-lg font-bold text-slate-900">
                                                {type === 'percentage' ? `${value}% OFF` : `₹${value} OFF`}
                                            </span>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Min Order: ₹{minOrder || 0} {maxDiscount > 0 ? `• Max: ₹${maxDiscount}` : ''}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleCopyCode(e, code)}
                                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1"
                                        >
                                            {copiedCode === code ? <FiCheck className="w-3 h-3 text-emerald-600" /> : <FiCopy className="w-3 h-3" />}
                                            <span>Copy</span>
                                        </button>
                                    </div>

                                    {coupon.description && (
                                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            {coupon.description}
                                        </p>
                                    )}

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <div>
                                            <span>Usage: <strong>{used}</strong> / {limit || '∞'}</span>
                                            <span className="block text-[11px] text-slate-400">Max {perUser}/customer</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[11px] text-slate-400">Expires:</span>
                                            <span className={`font-medium ${expired ? 'text-rose-600' : 'text-slate-700'}`}>
                                                {formatDate(coupon.expiryDate || coupon.expiry_date)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                                        <button
                                            type="button"
                                            onClick={(e) => handleActionClick(e, 'view', code)}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-100 transition"
                                        >
                                            <FiEye className="w-3.5 h-3.5" /> Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleActionClick(e, 'edit', code)}
                                            className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-100 transition"
                                        >
                                            <FiEdit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleActionClick(e, 'delete', code)}
                                            className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-100 transition"
                                        >
                                            <FiTrash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="text-slate-500 font-medium">
                            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total coupons in this view)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="flex items-center gap-1 px-3.5 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <FiChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-xl">
                                {currentPage}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="flex items-center gap-1 px-3.5 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Next <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, code: null })}
                onConfirm={handleDelete}
                title="Delete Discount Coupon"
                message={`Are you sure you want to permanently delete coupon "${deleteConfirm.code}"? Customers will no longer be able to redeem this code at checkout.`}
                confirmColor="bg-gradient-to-r from-rose-500 to-red-600"
            />
        </div>
    );
};

export default Coupons;