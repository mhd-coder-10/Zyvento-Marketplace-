import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    FiRefreshCw, FiSearch, FiDollarSign, FiCalendar,
    FiCheckCircle, FiClock, FiXCircle, FiTrendingUp,
    FiChevronLeft, FiChevronRight, FiUser, FiShoppingBag
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import MonthlyRevenueChart from '../../../components/admin/MonthlyRevenueChart';

const RevenueReport = ({ dateRange }) => {
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const hasLoadedOnce = useRef(false);

    const [summary, setSummary] = useState(null);
    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [monthlyRevenue, setMonthlyRevenue] = useState({ labels: [], values: [] });
    const [monthlyRevenueLoading, setMonthlyRevenueLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        seller_id: '',
        startDate: '',
        endDate: '',
    });

    // ========== FETCH 1: SUMMARY + CHART ==========
    const fetchSummaryAndChart = useCallback(async () => {
        if (!hasLoadedOnce.current) {
            setInitialLoading(true);
        } else {
            setMonthlyRevenueLoading(true);
        }
        try {
            const dateParams = {};
            if (dateRange?.startDate) dateParams.startDate = dateRange.startDate;
            if (dateRange?.endDate) dateParams.endDate = dateRange.endDate;

            const [revenueRes, monthlyRes] = await Promise.all([
                ApiService.getReportData('revenue', dateParams),
                ApiService.getReportData('monthly-revenue', dateParams),
            ]);

            if (revenueRes.data.success) {
                setSummary(revenueRes.data.data.summary);
            }

            if (monthlyRes.data.success) {
                const raw = monthlyRes.data.data;
                setMonthlyRevenue({ labels: raw.labels || [], values: raw.revenue || [] });
            }
        } catch (error) {
            console.error('Failed to fetch revenue summary/chart:', error);
            toast.error('Failed to load revenue summary');
        } finally {
            setMonthlyRevenueLoading(false);
        }
    }, [dateRange]);

    // ========== FETCH 2: RECORDS TABLE ==========
    const fetchRecords = useCallback(async (page = 1) => {
        if (!hasLoadedOnce.current) {
            setInitialLoading(true);
        } else {
            setTableLoading(true);
        }
        try {
            const params = {
                page,
                limit: pagination.limit,
                ...filters,
            };
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            if (dateRange?.startDate) params.startDate = dateRange.startDate;
            if (dateRange?.endDate) params.endDate = dateRange.endDate;

            const res = await ApiService.getReportData('revenue', params);
            if (res.data.success) {
                const data = res.data.data;
                setRecords(data.records || []);
                setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
            }
        } catch (error) {
            console.error('Failed to fetch revenue records:', error);
            toast.error('Failed to load revenue records');
        } finally {
            setInitialLoading(false);
            setTableLoading(false);
            hasLoadedOnce.current = true;
        }
    }, [filters, pagination.limit, dateRange]);

    useEffect(() => {
        fetchSummaryAndChart();
    }, [fetchSummaryAndChart]);

    useEffect(() => {
        fetchRecords(1);
    }, [fetchRecords]);

    // ========== HANDLERS ==========
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePageChange = (page) => {
        fetchRecords(page);
    };

    // ========== UTILITY ==========
    const formatCurrency = (value) => {
        if (!value && value !== 0) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'earned') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FiCheckCircle className="w-3 h-3" /> Earned
                </span>
            );
        }
        if (s === 'partially refunded' || s === 'partially_refunded') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <FiClock className="w-3 h-3" /> Partial Refund
                </span>
            );
        }
        if (s === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <FiClock className="w-3 h-3" /> Pending
                </span>
            );
        }
        if (s === 'refunded') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiXCircle className="w-3 h-3" /> Refunded
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {status || 'Earned'}
            </span>
        );
    };

    const formatRevenueId = (id) => {
        if (!id) return '—';
        return `REV-${id.slice(-6).toUpperCase()}`;
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-72 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
                <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8" />
                <p className="text-slate-500 font-medium text-sm">Loading Revenue Performance...</p>
            </div>
        );
    }

    const s = summary || {};

    return (
        <div className="w-full space-y-6">

            {/* ========== 6 SUMMARY KPI CARDS ========== */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-md"></div>
                    <div>
                        <span className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider">Total Revenue</span>
                        <p className="text-xl sm:text-2xl font-extrabold mt-1.5 truncate tracking-tight">{formatCurrency(s.totalRevenue)}</p>
                    </div>
                    <p className="text-[11px] text-blue-100 mt-2 pt-1.5 border-t border-white/20">
                        Commission: <strong className="text-white">{s.commissionRate || 10}%</strong>
                    </p>
                </div>

                {/* Today */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition">
                    <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today</span>
                        <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1.5 truncate">{formatCurrency(s.todayRevenue)}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">Live platform earnings</p>
                </div>

                {/* This Month */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition">
                    <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
                        <p className="text-lg sm:text-xl font-bold text-blue-600 mt-1.5 truncate">{formatCurrency(s.thisMonthRevenue)}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">Current calendar cycle</p>
                </div>

                {/* Last Month */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition">
                    <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Last Month</span>
                        <p className="text-lg sm:text-xl font-bold text-purple-600 mt-1.5 truncate">{formatCurrency(s.lastMonthRevenue)}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">Settled month total</p>
                </div>

                {/* Pending */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition">
                    <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
                        <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1.5 truncate">{formatCurrency(s.pendingRevenue)}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">Awaiting order delivery</p>
                </div>

                {/* Refunded */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition">
                    <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Refunded</span>
                        <p className="text-lg sm:text-xl font-bold text-rose-600 mt-1.5 truncate">{formatCurrency(s.refundedRevenue)}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">Reversed commissions</p>
                </div>
            </div>

            {/* ========== TREND CHART ========== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
                <MonthlyRevenueChart data={monthlyRevenue} loading={monthlyRevenueLoading} title="Revenue Performance Overview" />
            </div>

            {/* ========== FILTERS BAR ========== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Order Code, Revenue ID..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchRecords(1)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="w-full sm:w-auto">
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition"
                        >
                            <option value="">All Statuses</option>
                            <option value="Earned">Earned</option>
                            <option value="Partially Refunded">Partially Refunded</option>
                            <option value="Pending">Pending</option>
                            <option value="Refunded">Refunded</option>
                        </select>
                    </div>

                    <button
                        onClick={() => fetchRecords(pagination.page)}
                        disabled={tableLoading}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600 disabled:opacity-50"
                        title="Refresh Table"
                    >
                        <FiRefreshCw className={`w-4 h-4 text-blue-600 ${tableLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ========== REVENUE RECORDS (DESKTOP TABLE + MOBILE CARDS) ========== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
                {tableLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <FiRefreshCw className="animate-spin text-blue-600 w-6 h-6" />
                    </div>
                )}

                {/* Desktop Table View (md and up) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Revenue ID</th>
                                <th className="py-3 px-4">Order Code</th>
                                <th className="py-3 px-4">Seller</th>
                                <th className="py-3 px-4 text-right">Order Amount</th>
                                <th className="py-3 px-4 text-right">Product Amount</th>
                                <th className="py-3 px-4 text-center">Commission</th>
                                <th className="py-3 px-4 text-right">Net Revenue</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {records.length > 0 ? (
                                records.map((record) => (
                                    <tr key={record.order_id || record._id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                                            {formatRevenueId(record.order_id)}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-700">
                                            {record.order_code || record.order_number || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                                            {record.seller_name || 'Zyvento Direct'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                                            {formatCurrency(record.total_amount)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                                            {formatCurrency(record.product_amount)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                                                {record.commission_rate || summary?.commissionRate || 10}%
                                            </span>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                {formatCurrency(record.commission_amount)}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                                            {formatCurrency(record.net_revenue)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {getStatusBadge(record.status)}
                                        </td>
                                        <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                                            {record.created_at ? new Date(record.created_at).toLocaleDateString('en-IN') : '—'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="py-12 text-center text-slate-400">
                                        No revenue records found in this date period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View (below md) */}
                <div className="md:hidden divide-y divide-slate-100">
                    {records.length > 0 ? (
                        records.map((record) => (
                            <div key={record.order_id || record._id} className="p-4 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-xs text-blue-600">
                                        {formatRevenueId(record.order_id)}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                        {record.created_at ? new Date(record.created_at).toLocaleDateString('en-IN') : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Order: <strong className="text-slate-800 font-mono">{record.order_code || '—'}</strong></span>
                                    <span>{getStatusBadge(record.status)}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Seller:</span>
                                        <span className="font-medium text-slate-800">{record.seller_name || 'Zyvento Direct'}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Order Amount:</span>
                                        <span className="font-medium text-slate-800">{formatCurrency(record.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Commission ({record.commission_rate || 10}%):</span>
                                        <span className="font-medium text-blue-600">{formatCurrency(record.commission_amount)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200/60 text-slate-900">
                                        <span>Net Revenue:</span>
                                        <span className="text-emerald-600">{formatCurrency(record.net_revenue)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            No revenue records found.
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1 || tableLoading}
                                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 font-semibold text-slate-700">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages || tableLoading}
                                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RevenueReport;