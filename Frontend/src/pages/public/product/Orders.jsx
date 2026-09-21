import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiPackage,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiTruck,
    FiEye,
    FiChevronDown,
    FiChevronUp,
    FiSearch,
    FiFilter,
    FiArrowRight,
    FiRotateCcw,
    FiShoppingBag,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [cancellingId, setCancellingId] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });

    const statusBadgeStyles = {
        placed: 'bg-amber-50 text-amber-700 border-amber-200',
        processing: 'bg-blue-50 text-blue-700 border-blue-200',
        shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        returned: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const statusIcons = {
        placed: <FiClock className="w-3.5 h-3.5" />,
        processing: <FiClock className="w-3.5 h-3.5" />,
        shipped: <FiTruck className="w-3.5 h-3.5" />,
        delivered: <FiCheckCircle className="w-3.5 h-3.5" />,
        cancelled: <FiXCircle className="w-3.5 h-3.5" />,
        returned: <FiRotateCcw className="w-3.5 h-3.5" />,
    };

    useEffect(() => {
        loadOrders();
    }, [pagination.page, filter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getCustomerOrders({
                page: pagination.page,
                limit: pagination.limit,
                status: filter !== 'all' ? filter : undefined,
            });

            if (response.data.success) {
                const list = response.data.data.orders || response.data.data || [];
                setOrders(list);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || list.length,
                    pages: response.data.data.pages || Math.ceil((response.data.data.total || list.length) / prev.limit) || 1,
                }));
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            toast.error(error.response?.data?.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        setCancellingId(orderId);
        try {
            const response = await ApiService.cancelOrder(orderId, { reason: 'Customer requested cancellation' });
            if (response.data.success) {
                toast.success('Order cancelled successfully');
                loadOrders();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancellingId(null);
        }
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    const formatDate = (date) => {
        if (!date) return 'Recent';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const filteredOrders = orders.filter((order) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        const num = (order.order_number || order._id || '').toLowerCase();
        const hasItem = order.items?.some(i => (i.productName || i.name || '').toLowerCase().includes(q));
        return num.includes(q) || hasItem;
    });

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & HEADER ============ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5">
                            <Link to="/" className="hover:text-blue-600">Home</Link>
                            <span>/</span>
                            <span className="text-slate-800 font-bold">Orders</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Your Order History
                        </h1>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 self-start sm:self-auto"
                    >
                        Browse Store <FiArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* ============ STATUS TABS & SEARCH BAR ============ */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Status filter tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {['all', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                            <button
                                key={st}
                                onClick={() => { setFilter(st); setPagination(p => ({ ...p, page: 1 })); }}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                    filter === st
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                        : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    {/* Search inside orders */}
                    <div className="relative sm:w-72">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by ID or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                        />
                    </div>
                </div>

                {/* ============ ORDERS LIST ============ */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse space-y-4">
                                <div className="flex justify-between">
                                    <div className="h-5 bg-slate-200 rounded-xl w-40" />
                                    <div className="h-5 bg-slate-200 rounded-xl w-24" />
                                </div>
                                <div className="h-20 bg-slate-200 rounded-2xl w-full" />
                            </div>
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl font-bold mx-auto shadow-md shadow-blue-500/10">
                            <FiPackage />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">No Orders Found</h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                            {searchTerm || filter !== 'all'
                                ? 'No orders matched your active filters or search terms.'
                                : "You haven't placed any orders yet. Discover great deals today!"}
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 transition-all"
                        >
                            <FiShoppingBag className="w-4 h-4" />
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const oid = order._id || order.id;
                            const orderNum = order.order_number || oid;
                            const status = order.status || 'placed';
                            const isExpanded = expandedOrder === oid;

                            return (
                                <div
                                    key={oid}
                                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
                                >
                                    {/* Order Card Header */}
                                    <div className="p-5 sm:p-6 cursor-pointer" onClick={() => toggleOrderDetails(oid)}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                                    <FiPackage className="w-6 h-6" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                                                            Order #{orderNum}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        Placed on {formatDate(order.created_at || order.createdAt)} • {order.items?.length || 1} items
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xs text-slate-400 font-semibold">Total Amount</p>
                                                    <p className="text-base sm:text-lg font-black text-slate-900">
                                                        ₹{(Number(order.total_amount || 0)).toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                                        statusBadgeStyles[status] || 'bg-slate-50 text-slate-700 border-slate-200'
                                                    }`}>
                                                        {statusIcons[status]}
                                                        {status}
                                                    </span>

                                                    <div className="p-1 text-slate-400">
                                                        {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Drawer */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/50 space-y-4">
                                            {/* Order Items */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                    Order Items
                                                </h4>
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80">
                                                        <div className="w-14 h-14 rounded-xl bg-slate-50 p-1 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                                            <img
                                                                src={item.productImage || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                                                                alt={item.productName}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <Link to={`/products/${item.productId || item._id}`}>
                                                                <p className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 truncate">
                                                                    {item.productName || item.name}
                                                                </p>
                                                            </Link>
                                                            <p className="text-[11px] text-slate-500">
                                                                Qty: {item.quantity} × ₹{Number(item.price || item.finalPrice || 0).toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                                                            ₹{(Number(item.price || item.finalPrice || 0) * Number(item.quantity || 1)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Actions footer */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
                                                <Link
                                                    to={`/orders/${oid}`}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                    View Full Invoice & Tracking
                                                </Link>

                                                {status === 'placed' && (
                                                    <button
                                                        onClick={() => handleCancelOrder(oid)}
                                                        disabled={cancellingId === oid}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-all disabled:opacity-50"
                                                    >
                                                        <FiXCircle className="w-3.5 h-3.5" />
                                                        {cancellingId === oid ? 'Cancelling…' : 'Cancel Order'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-6">
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page <= 1}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40"
                                >
                                    <FiChevronLeft className="inline mr-1" /> Prev
                                </button>
                                <span className="text-xs font-bold text-slate-600 px-3">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page >= pagination.pages}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40"
                                >
                                    Next <FiChevronRight className="inline ml-1" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Orders;
