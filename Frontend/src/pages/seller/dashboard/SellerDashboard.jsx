import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiShoppingBag,
    FiPackage,
    FiDollarSign,
    FiClock,
    FiCheckCircle,
    FiTruck,
    FiXCircle,
    FiRefreshCw,
    FiArrowRight,
    FiPlusCircle,
    FiTrendingUp,
    FiAlertTriangle,
    FiEye,
    FiSettings,
    FiUsers,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import AdminTable from '../../../components/admin/AdminTable';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 ring-amber-200', icon: FiClock },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 ring-blue-200', icon: FiCheckCircle },
    packed: { label: 'Packed', bg: 'bg-indigo-50 text-indigo-700 ring-indigo-200', icon: FiPackage },
    shipped: { label: 'Shipped', bg: 'bg-cyan-50 text-cyan-700 ring-cyan-200', icon: FiTruck },
    delivered: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: FiCheckCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 ring-rose-200', icon: FiXCircle },
};

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [statsPeriod, setStatsPeriod] = useState('weekly');
    const [chartData, setChartData] = useState(null);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchDashboard();
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const [dashRes, statsRes] = await Promise.allSettled([
                ApiService.getSellerDashboard(),
                ApiService.getSellerDashboardStats({ period: statsPeriod }),
            ]);

            if (!mounted.current) return;

            if (dashRes.status === 'fulfilled' && dashRes.value?.data?.success) {
                setDashboardData(dashRes.value.data.data);
            }

            if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
                setChartData(statsRes.value.data.data);
            }
        } catch (error) {
            console.error('Seller dashboard load error:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const overview = dashboardData?.overview || dashboardData?.stats || {
        total_products: dashboardData?.total_products || 0,
        total_orders: dashboardData?.total_orders || 0,
        total_revenue: dashboardData?.total_revenue || 0,
        pending_orders: dashboardData?.pending_orders || 0,
    };

    const recentOrders = dashboardData?.recent_orders || dashboardData?.orders || [];
    const lowStockProducts = dashboardData?.low_stock_products || [];

    const statsCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(overview.total_revenue),
            icon: FiDollarSign,
            color: 'from-blue-600 to-indigo-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Total Orders',
            value: overview.total_orders || 0,
            icon: FiShoppingBag,
            color: 'from-sky-500 to-blue-600',
            textColor: 'text-sky-600',
            bgColor: 'bg-sky-50',
        },
        {
            title: 'Active Products',
            value: overview.total_products || 0,
            icon: FiPackage,
            color: 'from-emerald-500 to-teal-600',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            title: 'Pending Orders',
            value: overview.pending_orders || 0,
            icon: FiClock,
            color: 'from-amber-500 to-orange-600',
            textColor: 'text-amber-600',
            bgColor: 'bg-amber-50',
        },
    ];

    const orderColumns = [
        {
            key: 'order_number',
            label: 'Order',
            render: (value, row) => (
                <span className="font-semibold text-slate-800">
                    #{value || row.order_id || row._id?.slice(-6)?.toUpperCase() || '—'}
                </span>
            ),
        },
        {
            key: 'customer',
            label: 'Customer',
            render: (value, row) => (
                <div>
                    <p className="font-medium text-slate-800">
                        {row.customer_name || row.user?.first_name ? `${row.user?.first_name} ${row.user?.last_name || ''}` : 'Customer'}
                    </p>
                    <p className="text-xs text-slate-400">{row.customer_email || row.user?.email || '—'}</p>
                </div>
            ),
        },
        {
            key: 'total_amount',
            label: 'Amount',
            render: (value) => (
                <span className="font-bold text-blue-700">{formatCurrency(value)}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => {
                const s = row.order_status || value || 'pending';
                const meta = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
                const Icon = meta.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.bg}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                    </span>
                );
            },
        },
        {
            key: 'created_at',
            label: 'Date',
            render: (value) => (
                <span className="text-xs text-slate-500">
                    {value ? new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
            ),
        },
    ];

    const orderActions = [
        {
            label: 'View Order',
            icon: <FiEye className="h-4 w-4 text-blue-600" />,
            onClick: (row) => navigate(`/seller/orders/${row._id || row.id}`),
        },
    ];

    return (
        <div className="space-y-6">
            <AdminTopbar
                title={user?.business_name ? `${user.business_name} Dashboard` : 'Seller Dashboard'}
                subtitle={`Welcome back, ${user?.first_name || 'Seller'}! Monitor your sales, orders, and products.`}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchDashboard}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-50"
                        >
                            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={() => navigate('/seller/products/create')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-sky-600 hover:to-blue-700"
                        >
                            <FiPlusCircle className="h-4 w-4" />
                            <span>Add Product</span>
                        </button>
                    </div>
                }
            />

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((card, idx) => (
                    <div
                        key={idx}
                        className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</span>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgColor} ${card.textColor}`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-2xl font-extrabold text-slate-800">
                                {loading ? '...' : card.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Low Stock Alerts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Quick Navigation Panel */}
                <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
                        <FiTrendingUp className="text-sky-600" />
                        Quick Actions
                    </h3>
                    <div className="space-y-2.5">
                        <button
                            onClick={() => navigate('/seller/products')}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-white hover:border-blue-200 hover:shadow-sm transition text-left"
                        >
                            <div className="flex items-center gap-3">
                                <FiPackage className="text-sky-600" />
                                <span className="text-sm font-semibold text-slate-700">Manage Catalog</span>
                            </div>
                            <FiArrowRight className="text-slate-400" />
                        </button>
                        <button
                            onClick={() => navigate('/seller/orders')}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-white hover:border-blue-200 hover:shadow-sm transition text-left"
                        >
                            <div className="flex items-center gap-3">
                                <FiShoppingBag className="text-blue-600" />
                                <span className="text-sm font-semibold text-slate-700">Process Orders</span>
                            </div>
                            <FiArrowRight className="text-slate-400" />
                        </button>
                        <button
                            onClick={() => navigate('/seller/earnings')}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-white hover:border-blue-200 hover:shadow-sm transition text-left"
                        >
                            <div className="flex items-center gap-3">
                                <FiDollarSign className="text-emerald-600" />
                                <span className="text-sm font-semibold text-slate-700">Financial Reports</span>
                            </div>
                            <FiArrowRight className="text-slate-400" />
                        </button>
                        <button
                            onClick={() => navigate('/seller/settings')}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-white hover:border-blue-200 hover:shadow-sm transition text-left"
                        >
                            <div className="flex items-center gap-3">
                                <FiSettings className="text-slate-600" />
                                <span className="text-sm font-semibold text-slate-700">Store Settings & Docs</span>
                            </div>
                            <FiArrowRight className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Low Stock Warning or Top Products */}
                <div className="lg:col-span-2 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiAlertTriangle className="text-amber-500" />
                            Inventory Health & Alerts
                        </h3>
                        <button
                            onClick={() => navigate('/seller/products')}
                            className="text-xs font-bold text-blue-600 hover:underline"
                        >
                            View Products
                        </button>
                    </div>
                    {lowStockProducts.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {lowStockProducts.slice(0, 4).map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                                            {p.images?.[0] ? (
                                                <img src={p.images[0].url || p.images[0]} alt="" className="h-full w-full object-cover rounded-lg" />
                                            ) : (
                                                'IMG'
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 truncate max-w-xs">{p.product_name}</p>
                                            <p className="text-xs text-slate-400">SKU: {p.sku || '—'}</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                                        {p.stock ?? p.quantity ?? 0} in stock
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-slate-400">
                            <FiCheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                            <p className="text-sm font-medium">All products have healthy inventory levels!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-800">Recent Customer Orders</h3>
                    <button
                        onClick={() => navigate('/seller/orders')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                        View All Orders
                        <FiArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                <AdminTable
                    columns={orderColumns}
                    data={recentOrders}
                    loading={loading}
                    actions={orderActions}
                    emptyMessage="No recent orders received yet."
                />
            </div>
        </div>
    );
};

export default SellerDashboard;
