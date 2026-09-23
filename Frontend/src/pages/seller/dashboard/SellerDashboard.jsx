import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FiHome,
    FiRefreshCw,
    FiPackage,
    FiShoppingCart,
    FiDollarSign,
    FiTrendingUp,
    FiArrowRight,
    FiEye,
    FiCheckCircle,
    FiClock,
    FiTruck,
    FiXCircle,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const STATUS_BADGE = {
    pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
    confirmed: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FiCheckCircle },
    packed: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FiPackage },
    shipped: { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: FiTruck },
    out_for_delivery: { bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: FiTruck },
    delivered: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FiCheckCircle },
    cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: FiXCircle },
    returned: { bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: FiRefreshCw },
};

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(val || 0);
};

const SellerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        netEarnings: 0,
        deliveredOrders: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const mounted = useRef(true);

    const firstName = user?.first_name || user?.name?.split(' ')[0] || user?.business_name || 'Seller';

    useEffect(() => {
        mounted.current = true;
        loadDashboardData();
        return () => {
            mounted.current = false;
        };
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch Dashboard Data in parallel
            const [dashRes, ordersRes, productsRes] = await Promise.allSettled([
                ApiService.getSellerDashboard(),
                ApiService.getSellerMyOrders({ limit: 5 }),
                ApiService.getSellerMyProducts({ limit: 1 }),
            ]);

            let totalProducts = 0;
            let totalOrders = 0;
            let netEarnings = 0;
            let deliveredOrders = 0;
            let ordersList = [];

            if (dashRes.status === 'fulfilled' && dashRes.value?.data?.data) {
                const d = dashRes.value.data.data;
                totalProducts = d.totalProducts || d.products_count || d.total_products || 0;
                totalOrders = d.totalOrders || d.orders_count || d.total_orders || 0;
                netEarnings = d.netEarnings || d.totalEarnings || d.total_revenue || d.revenue || 0;
                deliveredOrders = d.deliveredOrders || d.completed_orders || d.delivered_count || 0;
            }

            if (ordersRes.status === 'fulfilled' && ordersRes.value?.data?.data) {
                const oData = ordersRes.value.data.data;
                ordersList = Array.isArray(oData) ? oData : (oData.orders || []);
                if (!totalOrders) {
                    totalOrders = ordersRes.value.data?.pagination?.total || ordersList.length;
                }
                if (!deliveredOrders) {
                    deliveredOrders = ordersList.filter(o => o.order_status === 'delivered').length;
                }
            }

            if (productsRes.status === 'fulfilled' && productsRes.value?.data?.data) {
                const pData = productsRes.value.data;
                const pTotal = pData.pagination?.total || (Array.isArray(pData.data) ? pData.data.length : pData.data?.products?.length);
                if (pTotal && !totalProducts) {
                    totalProducts = pTotal;
                }
            }

            if (mounted.current) {
                setStats({
                    totalProducts,
                    totalOrders,
                    netEarnings,
                    deliveredOrders,
                });
                setRecentOrders(ordersList);
            }
        } catch (err) {
            console.error('Failed to load seller dashboard data:', err);
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Breadcrumb & Welcome Banner */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4">
                    <button
                        onClick={() => navigate('/seller/dashboard')}
                        className="p-1 rounded-md hover:bg-sky-50 text-blue-600 transition-colors"
                    >
                        <FiHome className="w-4 h-4" />
                    </button>
                    <span>/</span>
                    <span className="bg-sky-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                        Dashboard
                    </span>
                </div>

                {/* Banner Content */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Welcome, {firstName}!
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Here's an overview of your store performance.
                        </p>
                    </div>

                    <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Products */}
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Products
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : stats.totalProducts}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner flex-shrink-0">
                        <FiPackage className="w-6 h-6" />
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Total Orders
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : stats.totalOrders}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner flex-shrink-0">
                        <FiShoppingCart className="w-6 h-6" />
                    </div>
                </div>

                {/* Net Earnings */}
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Net Earnings
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : formatCurrency(stats.netEarnings)}
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner flex-shrink-0">
                        <FiDollarSign className="w-6 h-6" />
                    </div>
                </div>

                {/* Delivered Orders */}
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Delivered
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : stats.deliveredOrders}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Completed orders
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-inner flex-shrink-0">
                        <FiTrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* 2-Column Section: Recent Orders & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* RECENT ORDERS (8 Cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <FiShoppingCart className="w-5 h-5 text-blue-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                Recent Orders
                            </h2>
                        </div>
                        <button
                            onClick={() => navigate('/seller/orders')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                        >
                            <span>View All</span>
                            <FiArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Order ID</th>
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Total</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-slate-400">
                                            <FiRefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                                            <span>Loading orders...</span>
                                        </td>
                                    </tr>
                                ) : recentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center text-slate-400">
                                            <FiShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="font-semibold text-slate-600">No recent orders yet</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">When customers order your products, they will show up here.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    recentOrders.map((order) => {
                                        const status = order.order_status?.toLowerCase() || 'pending';
                                        const badge = STATUS_BADGE[status] || STATUS_BADGE.pending;
                                        const StatusIcon = badge.icon;
                                        const customerName = order.user_id?.full_name || order.shipping_address?.full_name || 'Customer';
                                        const orderNumber = order.order_number || order._id?.slice(-8).toUpperCase();
                                        const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A';

                                        return (
                                            <tr key={order._id} className="hover:bg-sky-50/40 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-slate-800">
                                                    #{orderNumber}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600">
                                                    {customerName}
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-slate-900">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        <span className="capitalize">{status.replace('_', ' ')}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-400">
                                                    {dateStr}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/seller/orders/${order._id}`)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="View Details"
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
                </div>

                {/* QUICK ACTIONS (4 Cols - look at screenshot with blue top bar) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden border-t-4 border-t-blue-500">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-center">
                            Quick Actions
                        </h2>
                    </div>

                    <div className="p-5 space-y-3">
                        <button
                            onClick={() => navigate('/seller/products')}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all text-slate-700 hover:text-blue-700 group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                                    <FiPackage className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold">My Products</span>
                            </div>
                            <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                            onClick={() => navigate('/seller/orders')}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all text-slate-700 hover:text-blue-700 group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                                    <FiShoppingCart className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold">My Orders</span>
                            </div>
                            <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                            onClick={() => navigate('/seller/earnings')}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all text-slate-700 hover:text-blue-700 group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                                    <FiDollarSign className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold">My Earnings</span>
                            </div>
                            <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                            onClick={() => navigate('/seller/inventory')}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all text-slate-700 hover:text-blue-700 group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                                    <FiTrendingUp className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold">Inventory Manager</span>
                            </div>
                            <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
