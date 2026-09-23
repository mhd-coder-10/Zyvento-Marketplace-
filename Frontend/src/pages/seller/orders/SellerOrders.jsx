import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiShoppingCart,
    FiSearch,
    FiEye,
    FiRefreshCw,
    FiClock,
    FiCheckCircle,
    FiPackage,
    FiTruck,
    FiXCircle,
    FiChevronLeft,
    FiChevronRight,
    FiHome,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FiCheckCircle },
    packed: { label: 'Packed', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FiPackage },
    shipped: { label: 'Shipped', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: FiTruck },
    out_for_delivery: { label: 'Out for Delivery', bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: FiTruck },
    delivered: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FiCheckCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: FiXCircle },
    returned: { label: 'Returned', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: FiRefreshCw },
};

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerOrders = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        const queryStatus = searchParams.get('status');
        if (queryStatus !== null && queryStatus !== statusFilter) {
            setStatusFilter(queryStatus);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchOrders();
    }, [pagination.page, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerMyOrders({
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter || undefined,
                search: search || undefined,
            });

            if (!mounted.current) return;

            if (res?.data?.success) {
                const list = res.data.data?.orders || (Array.isArray(res.data.data) ? res.data.data : []);
                setOrders(list);
                const pag = res.data.pagination || res.data.data?.pagination;
                if (pag) {
                    setPagination((p) => ({
                        ...p,
                        total: pag.total || list.length,
                        totalPages: pag.totalPages || Math.ceil((pag.total || list.length) / p.limit) || 1,
                    }));
                }
            }
        } catch (err) {
            console.error('Orders fetch error:', err);
            toast.error('Failed to load orders');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((p) => ({ ...p, page: 1 }));
        fetchOrders();
    };

    const handleTabChange = (status) => {
        setStatusFilter(status);
        setPagination((p) => ({ ...p, page: 1 }));
        if (status) {
            setSearchParams({ status });
        } else {
            setSearchParams({});
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumb */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                    <button
                        onClick={() => navigate('/seller/dashboard')}
                        className="p-1 rounded-md hover:bg-sky-50 text-blue-600 transition-colors"
                    >
                        <FiHome className="w-4 h-4" />
                    </button>
                    <span>/</span>
                    <span className="bg-sky-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                        My Orders
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FiShoppingCart className="text-blue-600 w-7 h-7" />
                            <span>My Orders</span>
                            {pagination.total > 0 && (
                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
                                    {pagination.total} orders
                                </span>
                            )}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Track customer orders, manage fulfillment stages, and monitor shipping status.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchOrders}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                {/* Status Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-100 px-4 gap-2 pt-2 scrollbar-none">
                    {[
                        { key: '', label: 'All Orders' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'confirmed', label: 'Confirmed' },
                        { key: 'shipped', label: 'Shipped' },
                        { key: 'delivered', label: 'Delivered' },
                        { key: 'cancelled', label: 'Cancelled' },
                    ].map((tab) => {
                        const isActive = statusFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                                className={`whitespace-nowrap px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                                    isActive
                                        ? 'border-blue-600 text-blue-700 bg-sky-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-slate-50/50 flex items-center justify-between gap-4">
                    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by order ID or customer name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                        />
                    </form>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Order ID</th>
                                <th className="py-3.5 px-4">Customer</th>
                                <th className="py-3.5 px-4">Items</th>
                                <th className="py-3.5 px-4">Total Amount</th>
                                <th className="py-3.5 px-4">Payment</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Date</th>
                                <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-slate-400">
                                        <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                        <span>Loading orders...</span>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-slate-400">
                                        <FiShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="font-bold text-slate-700 text-sm">No orders found</p>
                                        <p className="text-xs text-slate-400 mt-1">There are no orders matching your selected filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const oId = order._id || order.id;
                                    const orderNum = order.order_number || oId?.slice(-8).toUpperCase();
                                    const customerName = order.user_id?.full_name || order.shipping_address?.full_name || 'Customer';
                                    const customerEmail = order.user_id?.email || order.shipping_address?.email || '';
                                    const itemsCount = order.items?.length || order.order_items?.length || 1;
                                    const statusKey = order.order_status?.toLowerCase() || 'pending';
                                    const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                                    const StatusIcon = statusConfig.icon;
                                    const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A';
                                    const paymentStatus = order.payment_status?.toLowerCase() || 'paid';

                                    return (
                                        <tr key={oId} className="hover:bg-sky-50/30 transition-colors">
                                            {/* Order Number */}
                                            <td className="py-3.5 px-4 font-bold text-slate-800">
                                                #{orderNum}
                                            </td>

                                            {/* Customer */}
                                            <td className="py-3.5 px-4">
                                                <p className="font-semibold text-slate-800">{customerName}</p>
                                                {customerEmail && (
                                                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{customerEmail}</p>
                                                )}
                                            </td>

                                            {/* Items */}
                                            <td className="py-3.5 px-4 font-medium text-slate-600">
                                                {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                                            </td>

                                            {/* Total */}
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                {formatCurrency(order.total_amount)}
                                            </td>

                                            {/* Payment */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                                                        paymentStatus === 'paid' || paymentStatus === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {paymentStatus}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusConfig.bg}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    <span>{statusConfig.label}</span>
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="py-3.5 px-4 text-slate-400">
                                                {dateStr}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/seller/orders/${oId}`)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-sky-50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                    <span className="font-semibold text-[11px]">View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page <= 1}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
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

export default SellerOrders;
