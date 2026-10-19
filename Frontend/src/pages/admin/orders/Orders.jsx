import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiEye, FiRefreshCw, FiSearch, FiChevronLeft, FiChevronRight,
    FiCheckCircle, FiXCircle, FiClock, FiPackage, FiTruck,
    FiLayers, FiDollarSign, FiX, FiDownload, FiShoppingBag
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const TABS = [
    { id: 'overview', label: 'Overview', icon: FiLayers },
    { id: 'pending', label: 'Pending', icon: FiClock, color: 'text-amber-600 bg-amber-50' },
    { id: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, color: 'text-blue-600 bg-blue-50' },
    { id: 'shipped', label: 'Shipped', icon: FiTruck, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'delivered', label: 'Delivered', icon: FiCheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'cancelled', label: 'Cancelled', icon: FiXCircle, color: 'text-rose-600 bg-rose-50' },
    { id: 'all_orders', label: 'All Orders', icon: FiPackage },
];

const Orders = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');

    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    });

    // Sync tab with URL
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

    // Fetch Orders
    const fetchOrders = useCallback(async () => {
        setIsRefreshing(true);
        try {
            let queryStatus;
            if (activeTab === 'overview' || activeTab === 'all_orders') {
                queryStatus = statusFilter !== 'all' ? statusFilter : undefined;
            } else {
                queryStatus = activeTab;
            }

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery.trim() || undefined,
                status: queryStatus,
                paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined
            };

            const res = await ApiService.getAllOrders(params);
            if (res.data.success) {
                const orderData = res.data.data || [];
                setOrders(Array.isArray(orderData) ? orderData : []);
                const pag = res.data.pagination || {
                    total: res.data.total || orderData.length,
                    totalPages: res.data.totalPages || 1
                };
                setPagination(prev => ({
                    ...prev,
                    total: pag.total || orderData.length,
                    totalPages: pag.totalPages || 1
                }));
                if (res.data.stats) {
                    setStats(prev => ({ ...prev, ...res.data.stats }));
                }
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            toast.error(error.response?.data?.message || 'Failed to load orders');
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [activeTab, pagination.page, pagination.limit, searchQuery, statusFilter, paymentFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    const handleNavigate = (order) => {
        const orderCode = order?.order_code || order?.order_number || order?._id;
        if (orderCode) {
            navigate(`/admin/orders/${orderCode}`);
        } else {
            toast.error('Invalid order code');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'delivered') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Delivered
                </span>
            );
        }
        if (s === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <FiClock className="w-3.5 h-3.5 text-amber-600" /> Pending
                </span>
            );
        }
        if (s === 'confirmed') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <FiCheckCircle className="w-3.5 h-3.5 text-blue-600" /> Confirmed
                </span>
            );
        }
        if (s === 'shipped') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <FiTruck className="w-3.5 h-3.5 text-indigo-600" /> Shipped
                </span>
            );
        }
        if (s === 'cancelled') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiXCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelled
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {s.replace(/_/g, ' ') || 'Unknown'}
            </span>
        );
    };

    const getPaymentBadge = (status) => {
        const p = (status || '').toLowerCase();
        if (p === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Paid
                </span>
            );
        }
        if (p === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending
                </span>
            );
        }
        if (p === 'failed') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Failed
                </span>
            );
        }
        if (p === 'refunded' || p === 'partially_refunded') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {p.replace(/_/g, ' ')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                {p || 'Unpaid'}
            </span>
        );
    };

    const getTabCount = (tabId) => {
        switch (tabId) {
            case 'pending': return stats.pending || 0;
            case 'confirmed': return stats.confirmed || 0;
            case 'shipped': return stats.shipped || 0;
            case 'delivered': return stats.delivered || 0;
            case 'cancelled': return stats.cancelled || 0;
            case 'all_orders':
            case 'overview': return stats.total || 0;
            default: return 0;
        }
    };

    const handleExport = () => {
        if (!orders.length) {
            toast.info('No orders to export');
            return;
        }
        const headers = ['Order Code', 'Customer Name', 'Email', 'Items Count', 'Total Amount', 'Payment Status', 'Order Status', 'Date'];
        const rows = orders.map(o => [
            o.order_code || o.order_number || '',
            `${o.user_id?.first_name || ''} ${o.user_id?.last_name || ''}`.trim(),
            o.user_id?.email || '',
            o.order_items?.length || 0,
            o.total_amount || 0,
            o.payment_status || '',
            o.order_status || '',
            o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : ''
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading && !isRefreshing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Order Management"
                subtitle="Track, inspect, and manage marketplace customer orders & fulfillment"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                        >
                            <FiDownload className="w-4 h-4 text-blue-600" /> Export
                        </button>
                        <button
                            onClick={() => fetchOrders()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                            title="Refresh data"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">

                {/* ====== TABS NAVIGATION ====== */}
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
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4 shrink-0" />
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isActive
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

                {/* ====== 4 STAT CARDS ====== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <FiShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                <FiClock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.pending || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Pending Orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                <FiCheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.delivered || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Delivered Orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.cancelled || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Cancelled Orders</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== SEARCH & FILTERS BAR ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                placeholder="Search by Order Code, Order #, or Email..."
                                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Order Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                disabled={activeTab !== 'overview' && activeTab !== 'all_orders'}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700 disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                            >
                                <option value="all">
                                    {activeTab === 'overview' || activeTab === 'all_orders' ? 'All Order Statuses' : `Status: ${activeTab}`}
                                </option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Payment Status Filter */}
                        <div>
                            <select
                                value={paymentFilter}
                                onChange={(e) => {
                                    setPaymentFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700 cursor-pointer"
                            >
                                <option value="all">All Payment Statuses</option>
                                <option value="pending">Payment Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                                <option value="partially_refunded">Partially Refunded</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ====== ORDERS TABLE & MOBILE VIEW ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="relative">
                        {isRefreshing && (
                            <div className="absolute top-0 left-0 right-0 bg-blue-500/10 backdrop-blur-[1px] z-10 flex justify-center py-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white px-3 py-1 rounded-full shadow-sm">
                                    <FiRefreshCw className="animate-spin w-3.5 h-3.5 text-blue-600" />
                                    Updating...
                                </div>
                            </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto scrollbar-thin">
                            <table className="w-full min-w-[1000px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-5 py-4 min-w-[180px]">Order Info</th>
                                        <th className="px-4 py-4 min-w-[200px]">Customer</th>
                                        <th className="px-4 py-4 min-w-[100px] text-center">Items</th>
                                        <th className="px-4 py-4 min-w-[130px]">Amount</th>
                                        <th className="px-4 py-4 min-w-[130px] text-center">Payment Status</th>
                                        <th className="px-4 py-4 min-w-[130px]">Order Status</th>
                                        <th className="px-4 py-4 min-w-[120px]">Date</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap min-w-[110px]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-16 text-center">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                                                    <FiPackage className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">No orders found</p>
                                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                                    {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                                                        ? 'No orders match your filter criteria. Try resetting filters.'
                                                        : 'There are currently no customer orders in the system.'}
                                                </p>
                                                {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearchQuery('');
                                                            setStatusFilter('all');
                                                            setPaymentFilter('all');
                                                        }}
                                                        className="mt-3 text-xs text-blue-600 font-semibold hover:underline"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => {
                                            const orderCode = order.order_code || order.order_number || order._id;
                                            return (
                                                <tr
                                                    key={order._id}
                                                    onClick={() => handleNavigate(order)}
                                                    className="transition-colors hover:bg-slate-50/80 cursor-pointer group"
                                                >
                                                    {/* Order Info */}
                                                    <td className="px-5 py-3.5 min-w-[180px]">
                                                        <div>
                                                            <span className="font-mono font-bold text-blue-600 group-hover:text-blue-700 text-xs sm:text-sm">
                                                                {orderCode}
                                                            </span>
                                                            {order.seller_id?.business_name && (
                                                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                                    Seller: {order.seller_id.business_name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Customer */}
                                                    <td className="px-4 py-3.5 min-w-[200px]">
                                                        <div>
                                                            <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                                                                {order.user_id?.first_name} {order.user_id?.last_name || ''}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                                                {order.user_id?.email || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* Items */}
                                                    <td className="px-4 py-3.5 text-center min-w-[100px]">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                                                            <FiPackage className="w-3.5 h-3.5 text-slate-500" />
                                                            {order.order_items?.length || 0}
                                                        </span>
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="px-4 py-3.5 min-w-[130px]">
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {formatCurrency(order.total_amount)}
                                                        </span>
                                                    </td>

                                                    {/* Payment Status */}
                                                    <td className="px-4 py-3.5 text-center min-w-[130px]">
                                                        {getPaymentBadge(order.payment_status)}
                                                    </td>

                                                    {/* Order Status */}
                                                    <td className="px-4 py-3.5 min-w-[130px]">
                                                        {getStatusBadge(order.order_status)}
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-4 py-3.5 text-slate-600 text-xs min-w-[120px]">
                                                        {formatDate(order.created_at)}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-3.5 text-right whitespace-nowrap min-w-[110px]" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleNavigate(order)}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-all shadow-2xs"
                                                            title="View Order Details"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile & Tablet Card View */}
                        <div className="lg:hidden divide-y divide-slate-100 p-4 space-y-4">
                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-xs">
                                    No orders found.
                                </div>
                            ) : (
                                orders.map((order) => {
                                    const orderCode = order.order_code || order.order_number || order._id;
                                    return (
                                        <div
                                            key={order._id}
                                            onClick={() => handleNavigate(order)}
                                            className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white shadow-xs cursor-pointer hover:border-blue-200 transition"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono font-bold text-blue-600 text-xs sm:text-sm">
                                                        {orderCode}
                                                    </span>
                                                    <p className="font-semibold text-slate-900 text-sm mt-0.5">
                                                        {order.user_id?.first_name} {order.user_id?.last_name || ''}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono">{order.user_id?.email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    {getStatusBadge(order.order_status)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-2.5">
                                                <div>
                                                    <span className="text-slate-400">Total Amount:</span>{' '}
                                                    <span className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Items:</span>{' '}
                                                    <span className="font-semibold text-slate-700">{order.order_items?.length || 0} items</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Payment:</span>{' '}
                                                    <span>{getPaymentBadge(order.payment_status)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">Date:</span>{' '}
                                                    <span className="font-medium text-slate-600">{formatDate(order.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleNavigate(order)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                                                >
                                                    <FiEye className="w-3.5 h-3.5 text-blue-600" /> View Order Details
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* ====== PAGINATION ====== */}
                        {pagination.totalPages > 1 && (
                            <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                                <div>
                                    Showing <span className="font-semibold text-slate-700">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                                    <span className="font-semibold text-slate-700">
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                                    </span>{' '}
                                    of <span className="font-semibold text-slate-700">{pagination.total}</span> orders
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                        disabled={pagination.page <= 1}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-2xs"
                                    >
                                        <FiChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-3 py-1 font-semibold text-slate-700">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-2xs"
                                    >
                                        <FiChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Orders;