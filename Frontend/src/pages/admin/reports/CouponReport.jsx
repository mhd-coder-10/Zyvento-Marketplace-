import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
    FiTag, FiDollarSign, FiPercent, FiCalendar, FiClock, FiCheckCircle,
    FiXCircle, FiTrendingUp, FiShoppingBag, FiSearch, FiRefreshCw,
    FiEye, FiX, FiCopy, FiCheck, FiArrowRight, FiFilter, FiAward,
    FiActivity, FiLayers, FiHelpCircle, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const CouponReport = ({ dateRange }) => {
    // Report Data State
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
    const [activeGraphTab, setActiveGraphTab] = useState('usage'); // 'usage' | 'discount' | 'cost' | 'top'
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    // Modal / Details State
    const [selectedCouponCode, setSelectedCouponCode] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);

    // Fetch Report Data
    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange?.startDate,
                endDate: dateRange?.endDate,
                page: currentPage,
                limit,
                search: searchTerm.trim() || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                discountType: discountTypeFilter !== 'all' ? discountTypeFilter : undefined,
            };

            const res = await ApiService.getReportData('coupons', params);
            if (res.data?.success) {
                setReportData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load coupon report:', err);
            toast.error('Failed to load coupon report data');
        } finally {
            setLoading(false);
        }
    }, [dateRange, currentPage, searchTerm, statusFilter, discountTypeFilter]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Handle Reset Filters
    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDiscountTypeFilter('all');
        setCurrentPage(1);
    };

    // Open Details Modal
    const handleViewDetails = async (code) => {
        setSelectedCouponCode(code);
        setModalLoading(true);
        try {
            const res = await ApiService.getCouponReportDetail(code);
            if (res.data?.success) {
                setModalData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch coupon details:', err);
            toast.error('Failed to load coupon details');
        } finally {
            setModalLoading(false);
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success(`Copied "${code}" to clipboard!`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Formatters
    const formatCurrency = (val) => {
        if (!val && val !== 0) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(val);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'active') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                </span>
            );
        }
        if (s === 'expired') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiClock className="w-3 h-3" />
                    Expired
                </span>
            );
        }
        if (s === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Pending
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Disabled
            </span>
        );
    };

    // Summary data
    const summary = reportData?.summary || {};
    const records = reportData?.records || [];
    const trend = reportData?.trend || [];
    const topCoupons = reportData?.topCoupons || [];
    const pagination = reportData?.pagination || { page: 1, totalPages: 1, total: 0 };

    // Performance graph calculations
    const maxTrendUsage = useMemo(() => {
        if (!trend.length) return 1;
        return Math.max(...trend.map(t => t.usageCount || 0), 1);
    }, [trend]);

    const maxTrendDiscount = useMemo(() => {
        if (!trend.length) return 1;
        return Math.max(...trend.map(t => t.discountGiven || 0), 1);
    }, [trend]);

    const maxTopUsage = useMemo(() => {
        if (!topCoupons.length) return 1;
        return Math.max(...topCoupons.map(t => t.usageCount || 0), 1);
    }, [topCoupons]);

    if (loading && !reportData) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-80 bg-white rounded-2xl border border-blue-100 shadow-sm gap-3">
                <FiRefreshCw className="animate-spin text-blue-600 w-9 h-9" />
                <p className="text-slate-500 font-medium text-sm">Loading Coupon Performance Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ========================================================= */}
            {/* 1. SUMMARY CARDS (6 CARDS)                                */}
            {/* ========================================================= */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* Total Coupons */}
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">Total Coupons</span>
                            <div className="p-2 bg-white/15 rounded-xl">
                                <FiTag className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">{summary.totalCoupons || 0}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-100">
                        <span>Platform Funded</span>
                        <span className="font-semibold">100%</span>
                    </div>
                </div>

                {/* Active Coupons */}
                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</span>
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2 tracking-tight">
                            {summary.activeCoupons || 0}
                        </p>
                    </div>
                    <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        Available for checkout
                    </p>
                </div>

                {/* Expired Coupons */}
                <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expired</span>
                            <div className="p-2 bg-rose-50 rounded-xl">
                                <FiXCircle className="w-4 h-4 text-rose-600" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2 tracking-tight">
                            {summary.expiredCoupons || 0}
                        </p>
                    </div>
                    <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        Past validity date
                    </p>
                </div>

                {/* Total Coupon Usage */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Usage</span>
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <FiShoppingBag className="w-4 h-4 text-indigo-600" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2 tracking-tight">
                            {summary.totalCouponUsage || 0}
                        </p>
                    </div>
                    <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        Orders applied
                    </p>
                </div>

                {/* Total Discount Given */}
                <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount Given</span>
                            <div className="p-2 bg-amber-50 rounded-xl">
                                <FiPercent className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-2 truncate tracking-tight">
                            {formatCurrency(summary.totalDiscountGiven)}
                        </p>
                    </div>
                    <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        Savings to customers
                    </p>
                </div>

                {/* Total Coupon Cost to Zyvento */}
                <div className="bg-white rounded-2xl p-4 border border-sky-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-gradient-to-b from-sky-50/50 to-white">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Zyvento Cost</span>
                            <div className="p-2 bg-sky-100 rounded-xl">
                                <FiDollarSign className="w-4 h-4 text-sky-700" />
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl font-extrabold text-sky-700 mt-2 truncate tracking-tight">
                            {formatCurrency(summary.totalCouponCost)}
                        </p>
                    </div>
                    <p className="mt-3 pt-2 border-t border-sky-100 text-[11px] text-sky-600 font-medium">
                        Platform funded (GL Expense)
                    </p>
                </div>
            </div>

            {/* ========================================================= */}
            {/* 2. COUPON PERFORMANCE GRAPHS                              */}
            {/* ========================================================= */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FiActivity className="text-blue-600" />
                            Coupon Performance & Financial Trends
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real-time platform funding metrics & redemption patterns
                        </p>
                    </div>

                    {/* Graph Switcher Tabs */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveGraphTab('usage')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeGraphTab === 'usage'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Usage Trend
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveGraphTab('discount')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeGraphTab === 'discount'
                                ? 'bg-white text-amber-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Discount Given Trend
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveGraphTab('cost')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeGraphTab === 'cost'
                                ? 'bg-white text-sky-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Zyvento Cost Trend
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveGraphTab('top')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeGraphTab === 'top'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Top Used Coupons
                        </button>
                    </div>
                </div>

                {/* Graph Body */}
                <div className="pt-2">
                    {/* Trend Graph (Usage, Discount, or Cost) */}
                    {activeGraphTab !== 'top' && (
                        <div>
                            {trend.length === 0 ? (
                                <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-sm">
                                    <FiActivity className="w-8 h-8 text-slate-300 mb-2" />
                                    No coupon activity recorded for the selected period
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Stat Banner */}
                                    <div className="flex items-center gap-6 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded ${activeGraphTab === 'usage' ? 'bg-blue-600' : (activeGraphTab === 'discount' ? 'bg-amber-500' : 'bg-sky-500')}`}></span>
                                            <span className="font-semibold text-slate-800">
                                                {activeGraphTab === 'usage' ? 'Redemption Orders' : (activeGraphTab === 'discount' ? 'Total Discount' : 'Platform Cost')}
                                            </span>
                                        </div>
                                        <span className="text-slate-400">Period: {dateRange?.startDate} to {dateRange?.endDate}</span>
                                    </div>

                                    {/* Bar Chart Container */}
                                    <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-100">
                                        {trend.map((t, idx) => {
                                            const value = activeGraphTab === 'usage' ? t.usageCount : (activeGraphTab === 'discount' ? t.discountGiven : t.couponCost);
                                            const max = activeGraphTab === 'usage' ? maxTrendUsage : maxTrendDiscount;
                                            const heightPct = Math.max(8, Math.round((value / max) * 100));

                                            const barColor = activeGraphTab === 'usage'
                                                ? 'bg-gradient-to-t from-blue-600 to-sky-500 group-hover:from-blue-700 group-hover:to-sky-600'
                                                : activeGraphTab === 'discount'
                                                    ? 'bg-gradient-to-t from-amber-500 to-yellow-400 group-hover:from-amber-600 group-hover:to-yellow-500'
                                                    : 'bg-gradient-to-t from-sky-600 to-cyan-400 group-hover:from-sky-700 group-hover:to-cyan-500';

                                            return (
                                                <div key={idx} className="flex-1 min-w-[32px] sm:min-w-[40px] flex flex-col items-center gap-2 group relative">
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2.5 pointer-events-none whitespace-nowrap shadow-lg z-10 flex flex-col items-center">
                                                        <span className="font-bold">
                                                            {activeGraphTab === 'usage' ? `${value} Uses` : formatCurrency(value)}
                                                        </span>
                                                        <span className="text-[9px] text-slate-300">{t.date}</span>
                                                    </div>

                                                    {/* Bar */}
                                                    <div
                                                        style={{ height: `${heightPct}%` }}
                                                        className={`w-full max-w-[24px] rounded-t-lg transition-all duration-300 shadow-sm ${barColor}`}
                                                    ></div>

                                                    {/* Label */}
                                                    <span className="text-[10px] text-slate-400 rotate-45 sm:rotate-0 origin-left mt-1 whitespace-nowrap">
                                                        {t.date ? t.date.slice(5) : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top Used Coupons Graph / Rankings */}
                    {activeGraphTab === 'top' && (
                        <div>
                            {topCoupons.length === 0 ? (
                                <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-sm">
                                    <FiAward className="w-8 h-8 text-slate-300 mb-2" />
                                    No coupon redemptions found for the selected period
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {topCoupons.map((item, idx) => {
                                        const widthPct = Math.max(10, Math.round((item.usageCount / maxTopUsage) * 100));
                                        return (
                                            <div
                                                key={idx}
                                                className="bg-slate-50/70 hover:bg-blue-50/40 p-4 rounded-xl border border-slate-100 transition-all flex flex-col justify-between"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                                                            #{idx + 1}
                                                        </span>
                                                        <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                            {item.code}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                        {item.usageCount} Redemptions
                                                    </span>
                                                </div>

                                                <div className="mt-3">
                                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-600 to-sky-400 h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${widthPct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                                                    <span>Total Discount Given: <strong>{formatCurrency(item.discountGiven)}</strong></span>
                                                    <span>Order Volume: <strong>{formatCurrency(item.orderValue)}</strong></span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* 3. FILTERS CONTAINER                                      */}
            {/* ========================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search by Coupon Code */}
                    <div className="relative flex-1 min-w-[200px]">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search coupon code or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="disabled">Disabled</option>
                        <option value="pending">Pending</option>
                    </select>

                    {/* Discount Type Filter */}
                    <select
                        value={discountTypeFilter}
                        onChange={(e) => {
                            setDiscountTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
                    >
                        <option value="all">All Discount Types</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                </div>

                {/* Reset Filters CTA */}
                <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all shrink-0"
                >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    Reset Filters
                </button>
            </div>

            {/* ========================================================= */}
            {/* 4. COUPON REPORT TABLE                                    */}
            {/* ========================================================= */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h4 className="font-bold text-slate-900 text-base">Coupon Report Breakdown</h4>
                        <p className="text-xs text-slate-500">
                            Detailed platform funding analysis, order volumes, and redemptions per coupon
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
                        Total {pagination.total || records.length} Coupons
                    </span>
                </div>

                {records.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <FiTag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h5 className="font-bold text-slate-700 text-sm">No coupons found matching your criteria</h5>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Try adjusting your search terms, status, or discount type filters.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View (lg and above) */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-b border-blue-100">
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider">Coupon Code</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider">Discount Type</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider">Discount Value</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">Total Usage</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider text-right">Total Order Amount</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider text-right">Total Discount Given</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-sky-900 uppercase tracking-wider text-right bg-sky-100/40">Zyvento Cost</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider">Created Date</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-blue-900 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                    {records.map((c) => {
                                        const isPerc = c.discountType === 'percentage';
                                        return (
                                            <tr key={c.id || c.code} className="hover:bg-blue-50/40 transition-colors group">
                                                {/* Coupon Code */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900 bg-slate-100 group-hover:bg-white px-2 py-0.5 rounded border border-slate-200">
                                                            {c.code}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyCode(c.code)}
                                                            className="text-slate-400 hover:text-blue-600 p-1"
                                                            title="Copy Code"
                                                        >
                                                            {copiedCode === c.code ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Discount Type */}
                                                <td className="px-4 py-3.5 capitalize font-medium text-slate-700">
                                                    {isPerc ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                                                </td>

                                                {/* Discount Value */}
                                                <td className="px-4 py-3.5 font-bold text-slate-800">
                                                    {isPerc ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                                    {c.maxDiscountAmount ? (
                                                        <span className="block text-[10px] text-slate-400 font-normal">
                                                            Capped at ₹{c.maxDiscountAmount}
                                                        </span>
                                                    ) : null}
                                                </td>

                                                {/* Total Usage */}
                                                <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                                                    <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-full text-xs">
                                                        {c.totalUsage || 0}
                                                    </span>
                                                </td>

                                                {/* Total Order Amount */}
                                                <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                                                    {formatCurrency(c.totalOrderAmount)}
                                                </td>

                                                {/* Total Discount Given */}
                                                <td className="px-4 py-3.5 text-right font-bold text-amber-600">
                                                    {formatCurrency(c.totalDiscountGiven)}
                                                </td>

                                                {/* Zyvento Coupon Cost */}
                                                <td className="px-4 py-3.5 text-right font-extrabold text-sky-700 bg-sky-50/40">
                                                    {formatCurrency(c.zyventoCouponCost)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 text-center">
                                                    {getStatusBadge(c.status)}
                                                </td>

                                                {/* Created Date */}
                                                <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                                                    {formatDate(c.createdAt)}
                                                </td>

                                                {/* Action / View Details */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDetails(c.code)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 transition-all shadow-sm"
                                                    >
                                                        <FiEye className="w-3.5 h-3.5" />
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View (below lg) */}
                        <div className="lg:hidden divide-y divide-slate-100">
                            {records.map((c) => {
                                const isPerc = c.discountType === 'percentage';
                                return (
                                    <div key={c.id || c.code} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    {c.code}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCode(c.code)}
                                                    className="text-slate-400 hover:text-blue-600 p-1"
                                                >
                                                    {copiedCode === c.code ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            {getStatusBadge(c.status)}
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600">
                                            <div className="flex justify-between">
                                                <span>Discount:</span>
                                                <span className="font-bold text-slate-800">
                                                    {isPerc ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                                    {c.maxDiscountAmount ? ` (Cap ₹${c.maxDiscountAmount})` : ''}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Usage Count:</span>
                                                <span className="font-semibold text-slate-800">{c.totalUsage || 0} times</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total Orders:</span>
                                                <span className="font-semibold text-slate-800">{formatCurrency(c.totalOrderAmount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Discount Given:</span>
                                                <span className="font-bold text-amber-600">{formatCurrency(c.totalDiscountGiven)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold pt-1 border-t border-slate-200/60 text-slate-800">
                                                <span>Zyvento Cost:</span>
                                                <span className="text-sky-700">{formatCurrency(c.zyventoCouponCost)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[11px] text-slate-400">{formatDate(c.createdAt)}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleViewDetails(c.code)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 transition shadow-xs"
                                            >
                                                <FiEye className="w-3.5 h-3.5" /> View Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Pagination Footer */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                disabled={pagination.page <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="p-2 border rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                className="p-2 border rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* 5. COUPON DETAILS MODAL                                   */}
            {/* ========================================================= */}
            {selectedCouponCode && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6 sm:p-8 space-y-6">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedCouponCode(null);
                                setModalData(null);
                            }}
                            className="absolute right-5 top-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                        >
                            <FiX className="w-5 h-5" />
                        </button>

                        {modalLoading || !modalData ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8" />
                                <p className="text-xs text-slate-500">Fetching coupon details & order history...</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                            <FiTag className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-2xl font-black font-mono text-slate-900">{modalData.code}</h3>
                                                {getStatusBadge(modalData.status)}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{modalData.description || 'No description provided'}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyCode(modalData.code)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold w-fit transition-all"
                                    >
                                        <FiCopy className="w-3.5 h-3.5" />
                                        Copy Code
                                    </button>
                                </div>

                                {/* Financial Performance KPI Strip */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Usage</span>
                                        <p className="text-xl font-black text-slate-900 mt-1">{modalData.totalUsage || 0}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Order Value</span>
                                        <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(modalData.totalOrderValue)}</p>
                                    </div>
                                    <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
                                        <span className="text-[11px] font-semibold text-amber-700 uppercase">Total Discount Provided</span>
                                        <p className="text-xl font-black text-amber-700 mt-1">{formatCurrency(modalData.totalDiscountProvided)}</p>
                                    </div>
                                    <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-100">
                                        <span className="text-[11px] font-semibold text-sky-800 uppercase">Cost Borne by Zyvento</span>
                                        <p className="text-xl font-black text-sky-700 mt-1">{formatCurrency(modalData.totalCostBorne)}</p>
                                    </div>
                                </div>

                                {/* Configuration Grid */}
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiLayers className="text-blue-500" />
                                        Coupon Configuration
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                        <div>
                                            <span className="text-slate-400 block">Discount Rule</span>
                                            <span className="font-bold text-slate-800 capitalize">
                                                {modalData.discountType === 'percentage' ? `${modalData.discountValue}% Off` : `₹${modalData.discountValue} Flat Off`}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Min. Order Value</span>
                                            <span className="font-bold text-slate-800">
                                                ₹{modalData.minOrderAmount || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Max. Discount Cap</span>
                                            <span className="font-bold text-slate-800">
                                                {modalData.maxDiscountAmount ? `₹${modalData.maxDiscountAmount}` : 'No Limit'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Validity Window</span>
                                            <span className="font-bold text-slate-800">
                                                {formatDate(modalData.startDate)} - {formatDate(modalData.expiryDate)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Usage Limit</span>
                                            <span className="font-bold text-slate-800">
                                                {modalData.usageLimit ? `${modalData.usageLimit} uses` : 'Unlimited'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Per-User Limit</span>
                                            <span className="font-bold text-slate-800">
                                                {modalData.perUserLimit || 1} use per user
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Funding Source</span>
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                                                Platform Funded (Zyvento)
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block">Seller Impact</span>
                                            <span className="font-bold text-slate-700">
                                                0% Deduction to Seller
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Orders Using Coupon Table */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <FiShoppingBag className="text-blue-500" />
                                            Orders Using This Coupon ({modalData.orders?.length || 0})
                                        </h4>
                                    </div>

                                    {(!modalData.orders || modalData.orders.length === 0) ? (
                                        <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 text-xs">
                                            No completed customer orders recorded for this coupon yet.
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 sticky top-0 font-bold">
                                                    <tr>
                                                        <th className="px-3 py-2.5">Order #</th>
                                                        <th className="px-3 py-2.5">Customer</th>
                                                        <th className="px-3 py-2.5">Date</th>
                                                        <th className="px-3 py-2.5 text-right">Order Value</th>
                                                        <th className="px-3 py-2.5 text-right">Discount</th>
                                                        <th className="px-3 py-2.5 text-right">Customer Paid</th>
                                                        <th className="px-3 py-2.5 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {modalData.orders.map((ord, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/60">
                                                            <td className="px-3 py-2.5 font-mono font-bold text-blue-600">
                                                                #{ord.order_number}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-800 font-medium truncate max-w-[140px]">
                                                                {ord.customer_name}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                                                                {formatDate(ord.order_date)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                                                                {formatCurrency(ord.order_total)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-amber-600">
                                                                -{formatCurrency(ord.discount_applied)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                                                                {formatCurrency(ord.customer_paid)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                                                    {ord.order_status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Usage / Date-wise Breakdown */}
                                {modalData.dailyBreakdown && modalData.dailyBreakdown.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <FiCalendar className="text-blue-500" />
                                            Daily Redemption Breakdown
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto">
                                            {modalData.dailyBreakdown.map((d, i) => (
                                                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                                    <span className="font-semibold text-slate-800 block">{d.date}</span>
                                                    <div className="flex justify-between mt-1 text-[11px] text-slate-500">
                                                        <span>{d.count} uses</span>
                                                        <span className="font-bold text-amber-600">{formatCurrency(d.discount)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponReport;
