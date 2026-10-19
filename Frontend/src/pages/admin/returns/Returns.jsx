import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch, FiEye, FiDownload, FiRefreshCw, FiChevronLeft, FiChevronRight,
    FiRotateCcw, FiXCircle, FiCheckCircle, FiClock, FiPackage, FiLayers,
    FiX, FiExternalLink, FiDollarSign, FiUser, FiCalendar
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const TABS = [
    { id: 'overview', label: 'Overview', icon: FiLayers },
    { id: 'returned', label: 'Returned', icon: FiRotateCcw, badgeColor: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'cancelled', label: 'Cancelled', icon: FiXCircle, badgeColor: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'pending_refund', label: 'Pending Refund', icon: FiClock, badgeColor: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'refunded', label: 'Refunded', icon: FiCheckCircle, badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { id: 'all_returns', label: 'All Records', icon: FiPackage }
];

const Returns = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [returns, setReturns] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        returned: 0,
        cancelled: 0,
        pending: 0,
        paid: 0,
        refunded: 0
    });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    // Sync active tab with URL query parameter
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && TABS.some(t => t.id === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const fetchReturns = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // Determine filter based on tab or manual selection
            let queryOrderStatus = orderStatusFilter !== 'all' ? orderStatusFilter : undefined;
            let queryPaymentStatus = paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined;

            if (activeTab === 'returned') {
                queryOrderStatus = 'returned';
            } else if (activeTab === 'cancelled') {
                queryOrderStatus = 'cancelled';
            } else if (activeTab === 'pending_refund') {
                queryPaymentStatus = 'pending';
            } else if (activeTab === 'refunded') {
                queryPaymentStatus = 'refunded';
            }

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery.trim() || undefined,
                orderStatus: queryOrderStatus,
                paymentStatus: queryPaymentStatus
            };

            const res = await ApiService.getAllReturns(params);
            if (res.data.success) {
                const data = res.data.data || [];
                setReturns(Array.isArray(data) ? data : []);
                setStats(res.data.stats || {
                    total: 0,
                    returned: 0,
                    cancelled: 0,
                    pending: 0,
                    paid: 0,
                    refunded: 0
                });
                const pag = res.data.pagination || {
                    total: data.length,
                    totalPages: 1
                };
                setPagination(prev => ({
                    ...prev,
                    total: pag.total || data.length,
                    totalPages: pag.totalPages || 1
                }));
            }
        } catch (error) {
            console.error('Failed to load returns:', error);
            toast.error(error.response?.data?.message || 'Failed to load returns');
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, searchQuery, orderStatusFilter, paymentStatusFilter, activeTab]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const handleExportPDF = async () => {
        try {
            toast.info('Generating Returns report PDF...');
            const res = await ApiService.exportReturnsPDF();
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `returns-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('PDF report downloaded successfully');
        } catch (error) {
            toast.error('Failed to export PDF report');
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setOrderStatusFilter('all');
        setPaymentStatusFilter('all');
        setActiveTab('overview');
        setSearchParams({});
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Badge helper for Order Status
    const getOrderBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'cancelled') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiXCircle className="w-3 h-3" /> Cancelled
                </span>
            );
        }
        if (s === 'returned') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <FiRotateCcw className="w-3 h-3" /> Returned
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {status}
            </span>
        );
    };

    // Badge helper for Payment Status
    const getPaymentBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'refunded') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FiCheckCircle className="w-3 h-3" /> Refunded
                </span>
            );
        }
        if (s === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <FiClock className="w-3 h-3" /> Pending
                </span>
            );
        }
        if (s === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <FiCheckCircle className="w-3 h-3" /> Paid
                </span>
            );
        }
        if (s === 'failed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiXCircle className="w-3 h-3" /> Failed
                </span>
            );
        }
        if (s === 'partially_refunded') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <FiRotateCcw className="w-3 h-3" /> Partial Refund
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {(status || 'N/A').replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Return & Cancellation Management"
                subtitle="Track returned shipments, cancellations, and customer refunds"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchReturns}
                            disabled={isRefreshing}
                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
                            title="Refresh returns"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiDownload className="w-4 h-4" /> Export Report
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">

                {/* ===== NAVIGATION TABS ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1.5 min-w-max">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            let count = null;
                            if (tab.id === 'overview' || tab.id === 'all_returns') count = stats.total;
                            else if (tab.id === 'returned') count = stats.returned;
                            else if (tab.id === 'cancelled') count = stats.cancelled;
                            else if (tab.id === 'pending_refund') count = stats.pending;
                            else if (tab.id === 'refunded') count = stats.refunded;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{tab.label}</span>
                                    {count !== null && (
                                        <span
                                            className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ml-0.5 ${
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

                {/* ===== 4 EXECUTIVE KPI CARDS ===== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Returns */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Claims</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FiPackage className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.total || 0}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-blue-600">All</span> cancelled & returned
                        </p>
                    </div>

                    {/* Returned Packages */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Returned</span>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <FiRotateCcw className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.returned || 0}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-amber-600">Items</span> received back
                        </p>
                    </div>

                    {/* Cancelled Orders */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancelled</span>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.cancelled || 0}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-rose-600">Cancelled</span> before dispatch
                        </p>
                    </div>

                    {/* Refunds Processed */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Refunded</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <FiCheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.refunded || 0}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-emerald-600">Settled</span> customer refunds
                        </p>
                    </div>
                </div>

                {/* ===== SEARCH & FILTER TOOLBAR ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search Input */}
                        <div className="relative sm:col-span-2">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by Order Code or Customer Email..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Order Status Filter */}
                        <div>
                            <select
                                value={orderStatusFilter}
                                onChange={(e) => {
                                    setOrderStatusFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                            >
                                <option value="all">All Order Status</option>
                                <option value="returned">Returned</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Payment Status Filter */}
                        <div>
                            <select
                                value={paymentStatusFilter}
                                onChange={(e) => {
                                    setPaymentStatusFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                            >
                                <option value="all">All Payment Status</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="refunded">Refunded</option>
                                <option value="partially_refunded">Partially Refunded</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Clear Bar */}
                    {(searchQuery || orderStatusFilter !== 'all' || paymentStatusFilter !== 'all' || activeTab !== 'overview') && (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                            <span className="text-slate-500">
                                Filtering results by active criteria
                            </span>
                            <button
                                onClick={handleClearFilters}
                                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                            >
                                <FiX className="w-3.5 h-3.5" /> Reset All Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* ===== DESKTOP TABLE VIEW (Visible on lg and above) ===== */}
                <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {loading ? (
                        <div className="py-20 text-center">
                            <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-600">Loading returns and cancellations...</p>
                        </div>
                    ) : returns.length === 0 ? (
                        <div className="py-20 text-center px-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                                <FiRotateCcw className="w-8 h-8" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">No returns or cancellations found</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                No records match your selected filters. Try searching with different terms or reset your filters.
                            </p>
                            <button
                                onClick={handleClearFilters}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="py-3.5 px-5">Order Code & Date</th>
                                        <th className="py-3.5 px-5">Customer</th>
                                        <th className="py-3.5 px-5">Items Info</th>
                                        <th className="py-3.5 px-5">Order Status</th>
                                        <th className="py-3.5 px-5">Payment & Refund</th>
                                        <th className="py-3.5 px-5 text-right">Order Value</th>
                                        <th className="py-3.5 px-5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {returns.map((item) => (
                                        <tr
                                            key={item._id}
                                            onClick={() => navigate(`/admin/returns/${item.order_code}`)}
                                            className="hover:bg-blue-50/30 cursor-pointer transition group"
                                        >
                                            {/* Order Code & Date */}
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-blue-600 group-hover:text-blue-700 font-mono flex items-center gap-1.5">
                                                    <span>{item.order_code}</span>
                                                    <FiExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3" />
                                                    <span>{formatDateTime(item.created_at)}</span>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="py-4 px-5">
                                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                                    <FiUser className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>
                                                        {item.user_id?.first_name || item.shipping_address?.full_name || 'Guest'} {item.user_id?.last_name || ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {item.user_id?.email || item.shipping_address?.mobile_number || 'N/A'}
                                                </p>
                                            </td>

                                            {/* Items Info */}
                                            <td className="py-4 px-5">
                                                <div className="text-xs text-slate-700 font-medium line-clamp-1">
                                                    {item.order_items && item.order_items.length > 0
                                                        ? item.order_items[0].product_name
                                                        : 'Order items'}
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {item.total_items || item.order_items?.length || 1} item(s) total
                                                </p>
                                            </td>

                                            {/* Order Status */}
                                            <td className="py-4 px-5">
                                                {getOrderBadge(item.order_status)}
                                            </td>

                                            {/* Payment & Refund */}
                                            <td className="py-4 px-5">
                                                {getPaymentBadge(item.payment_status)}
                                            </td>

                                            {/* Order Amount */}
                                            <td className="py-4 px-5 text-right font-extrabold text-slate-900">
                                                {formatCurrency(item.total_amount)}
                                            </td>

                                            {/* Action Button */}
                                            <td className="py-4 px-5 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/returns/${item.order_code}`);
                                                    }}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition inline-flex items-center justify-center"
                                                    title="View Details"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ===== MOBILE / TABLET CARD VIEW (Visible below lg) ===== */}
                <div className="lg:hidden space-y-3">
                    {loading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                            <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-600">Loading returns...</p>
                        </div>
                    ) : returns.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                            <FiRotateCcw className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-800">No returns found</p>
                            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        returns.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => navigate(`/admin/returns/${item.order_code}`)}
                                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 active:scale-[0.99] transition cursor-pointer"
                            >
                                {/* Header: Order Code & Amount */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm font-mono font-bold text-blue-600">
                                            #{item.order_code}
                                        </span>
                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                            <FiCalendar className="w-3 h-3" />
                                            <span>{formatDateTime(item.created_at)}</span>
                                        </p>
                                    </div>
                                    <span className="text-base font-extrabold text-slate-900">
                                        {formatCurrency(item.total_amount)}
                                    </span>
                                </div>

                                {/* Customer Info */}
                                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl space-y-0.5">
                                    <p className="font-semibold text-slate-900">
                                        {item.user_id?.first_name || item.shipping_address?.full_name || 'Guest'} {item.user_id?.last_name || ''}
                                    </p>
                                    <p className="text-slate-500 text-[11px]">
                                        {item.user_id?.email || item.shipping_address?.mobile_number || 'N/A'}
                                    </p>
                                    {item.order_items && item.order_items.length > 0 && (
                                        <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-medium">
                                            📦 {item.order_items[0].product_name}
                                            {item.order_items.length > 1 && ` + ${item.order_items.length - 1} more`}
                                        </p>
                                    )}
                                </div>

                                {/* Status Badges */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {getOrderBadge(item.order_status)}
                                        {getPaymentBadge(item.payment_status)}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/admin/returns/${item.order_code}`);
                                        }}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        Details <FiChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ===== PAGINATION CONTROLS ===== */}
                {returns.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                            Showing <span className="font-semibold text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                            <span className="font-semibold text-slate-800">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span> of <span className="font-semibold text-slate-800">{pagination.total}</span> returns
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Page Limit Selector */}
                            <select
                                value={pagination.limit}
                                onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
                            >
                                <option value="10">10 / page</option>
                                <option value="20">20 / page</option>
                                <option value="50">50 / page</option>
                            </select>

                            {/* Previous Page */}
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page <= 1}
                                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                title="Previous Page"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>

                            <span className="text-xs font-semibold text-slate-700 px-2">
                                Page {pagination.page} of {pagination.totalPages || 1}
                            </span>

                            {/* Next Page */}
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                title="Next Page"
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

export default Returns;