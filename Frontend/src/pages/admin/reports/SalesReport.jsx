import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiDollarSign, FiCheckCircle, FiXCircle, FiShoppingBag,
    FiRefreshCw, FiSearch, FiArrowUp, FiArrowDown, FiCreditCard,
    FiPackage, FiUser, FiCalendar, FiChevronRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import MonthlySalesChart from '../../../components/admin/MonthlySalesChart';

// Rank-based bar colors for "Sales by Category"
const CATEGORY_BAR_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];

const SalesReport = ({ dateRange }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getReportData('sales', dateRange);
            if (res.data.success) setData(res.data.data);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [dateRange]);

    // ==================== FORMATTERS ====================
    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    };

    const formatPercent = (value) => {
        if (value === null || value === undefined || isNaN(value)) return '0%';
        return `${value > 0 ? '+' : ''}${value}%`;
    };

    const GrowthBadge = ({ value, size = 'sm' }) => {
        const numeric = Number(value) || 0;
        const isPositive = numeric >= 0;
        const Icon = isPositive ? FiArrowUp : FiArrowDown;
        const colorClass = isPositive ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200';
        return (
            <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border text-xs ${colorClass}`}>
                <Icon className="w-3 h-3 shrink-0" />
                {formatPercent(numeric)}
            </span>
        );
    };

    // ==================== RECENT ORDERS FILTERING ====================
    const filteredOrders = useMemo(() => {
        return (data?.recentOrders || []).filter((order) => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                order.product_name?.toLowerCase().includes(term) ||
                order.order_code?.toLowerCase().includes(term) ||
                order.customer_name?.toLowerCase().includes(term);
            const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [data, searchTerm, statusFilter]);

    // ==================== GAUGE ====================
    const salesGrowth = Number(data?.salesGrowth) || 0;
    const gaugePercent = Math.min(100, Math.max(0, salesGrowth));
    const GAUGE_RADIUS = 80;
    const GAUGE_CIRCUMFERENCE = Math.PI * GAUGE_RADIUS;
    const gaugeDashOffset = GAUGE_CIRCUMFERENCE - (gaugePercent / 100) * GAUGE_CIRCUMFERENCE;

    // ==================== SALES BY CATEGORY ====================
    const categoryData = data?.categoryData || [];
    const maxCategoryRevenue = categoryData.length ? Math.max(...categoryData.map((c) => c.revenue || 0)) : 0;

    // ==================== PAYMENT METHODS ====================
    const paymentMethods = data?.paymentMethods || [];

    // ==================== TOP PRODUCTS BY SALES ====================
    const topProducts = data?.topProducts || [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-72 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
                <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8" />
                <p className="text-slate-500 font-medium text-sm">Loading Sales Performance Data...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">

            {/* ==================== 4 SUMMARY CARDS ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Sales */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Sales</span>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <FiDollarSign className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold mt-2 truncate tracking-tight">{formatCurrency(data?.totalSales)}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
                        <span>Growth: <strong>{formatPercent(data?.salesGrowth)}</strong></span>
                        <span className="text-[11px] opacity-80">vs last month</span>
                    </div>
                </div>

                {/* Number of Sales */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders Count</span>
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiShoppingBag className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{data?.totalOrders || 0}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <GrowthBadge value={data?.orderGrowth} />
                        <span className="text-[11px] text-slate-400">Past: {data?.lastMonthOrders || 0}</span>
                    </div>
                </div>

                {/* Successfully Completed */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Successful Sales</span>
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiCheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{data?.successfulSalesCount || 0}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Revenue: <strong className="text-slate-800">{formatCurrency(data?.successfulSalesRevenue)}</strong></span>
                        <span className="text-[11px] text-emerald-600 font-semibold">Delivered</span>
                    </div>
                </div>

                {/* Cancelled / Returns */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-rose-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Returns & Cancelled</span>
                            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">{data?.returnCancelSalesCount || 0}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Lost: <strong className="text-rose-600">{formatCurrency(data?.returnCancelSalesRevenue)}</strong></span>
                        <GrowthBadge value={data?.returnRate ? -Math.abs(data.returnRate) : 0} />
                    </div>
                </div>
            </div>

            {/* ==================== CHARTS SECTION ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Performance Chart */}
                <div className="lg:col-span-2">
                    <MonthlySalesChart title="Sales Performance Velocity" />
                </div>

                {/* Sales Overview Gauge */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Sales Target Velocity</h3>
                    </div>

                    <div className="flex justify-center my-4">
                        <div className="relative w-full max-w-[200px] aspect-[2/1.15]">
                            <svg viewBox="0 0 200 115" className="w-full h-full">
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="url(#gaugeGradientSales)"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    strokeDasharray={GAUGE_CIRCUMFERENCE}
                                    strokeDashoffset={gaugeDashOffset}
                                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                                />
                                <defs>
                                    <linearGradient id="gaugeGradientSales" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#60a5fa" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{Math.round(gaugePercent)}%</span>
                                <span className="text-[11px] text-slate-400 font-medium">Growth Rate</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-3">
                            <span className="text-[11px] text-slate-400">Total Volume</span>
                            <p className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">{data?.totalOrders || 0}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <span className="text-[11px] text-slate-400">Gross Sales</span>
                            <p className="text-base sm:text-lg font-bold text-blue-600 mt-0.5 truncate">{formatCurrency(data?.totalSales)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== SALES BY CATEGORY + PAYMENT METHODS ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Sales by Category */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Sales by Category</h3>

                    {categoryData.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">No category data recorded for this period</p>
                    ) : (
                        <div className="space-y-4">
                            {categoryData.map((cat, idx) => {
                                const widthPercent = maxCategoryRevenue > 0 ? (cat.revenue / maxCategoryRevenue) * 100 : 0;
                                const barColor = CATEGORY_BAR_COLORS[idx % CATEGORY_BAR_COLORS.length];
                                return (
                                    <div key={cat.category || idx}>
                                        <div className="flex items-center justify-between mb-1.5 text-xs">
                                            <span className="font-semibold text-slate-800 truncate pr-2">{cat.category}</span>
                                            <span className="font-bold text-slate-900 shrink-0">{formatCurrency(cat.revenue)}</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                style={{ width: `${Math.max(widthPercent, 3)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Payment Methods */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Revenue by Payment Gateway</h3>

                    {paymentMethods.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">No payment gateway data available</p>
                    ) : (
                        <div className="space-y-3">
                            {paymentMethods.map((pm, idx) => (
                                <div
                                    key={pm.method || idx}
                                    className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                                            <FiCreditCard className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{pm.method}</span>
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0">{formatCurrency(pm.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== RECENT ORDERS TABLE (RESPONSIVE) ==================== */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Live transactions matching selected criteria</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search product, order code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-60 pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table View (md and up) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Product Info</th>
                                <th className="py-3 px-4">Order Code</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Customer</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3 px-4 font-semibold text-slate-800">{order.product_name || 'Multiple Items'}</td>
                                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{order.order_code}</td>
                                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                                        <td className="py-3 px-4 text-slate-700">{order.customer_name || 'Guest'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                order.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                order.order_status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                order.order_status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                                {order.order_status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">{formatCurrency(order.total_amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">No orders matching current filters</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View (below md) */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order, idx) => (
                            <div key={idx} className="py-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono font-bold text-blue-600">#{order.order_code}</span>
                                    <span className="text-[11px] text-slate-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div className="text-xs font-semibold text-slate-800">{order.product_name || 'Multiple Items'}</div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                                    <span className="text-slate-500">{order.customer_name || 'Guest'}</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center text-slate-400 text-xs">No orders found</div>
                    )}
                </div>

                {data?.recentOrders?.length > 10 && (
                    <div className="pt-2 text-center">
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                        >
                            View All Orders in Orders Module <FiChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesReport;