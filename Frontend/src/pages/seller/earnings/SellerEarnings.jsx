import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    FiDollarSign, FiTrendingUp, FiBarChart2, FiRefreshCw, FiCalendar,
    FiArrowUpRight, FiArrowDownRight,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const formatCurrency = (v) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const SellerEarnings = () => {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');
    const [dashboard, setDashboard] = useState(null);
    const [salesReport, setSalesReport] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const mounted = useRef(true);

    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => { fetchData(); }, [period]);

    const fetchData = async () => {
        setLoading(true);
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        const startDate = new Date(now.getFullYear(), now.getMonth() - (period === 'yearly' ? 12 : period === 'monthly' ? 1 : 0), period === 'weekly' ? now.getDate() - 7 : 1).toISOString().split('T')[0];

        try {
            const [dashRes, salesRes, analyticsRes] = await Promise.allSettled([
                ApiService.getSellerDashboard(),
                ApiService.getSellerSalesReport({ start_date: startDate, end_date: endDate, period: 'daily' }),
                ApiService.getSellerAnalytics({ period }),
            ]);

            if (!mounted.current) return;

            if (dashRes.status === 'fulfilled' && dashRes.value?.data?.success) {
                setDashboard(dashRes.value.data.data);
            }
            if (salesRes.status === 'fulfilled' && salesRes.value?.data?.success) {
                setSalesReport(salesRes.value.data.data);
            }
            if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data?.success) {
                setAnalytics(analyticsRes.value.data.data);
            }
        } catch (err) {
            console.error('Earnings data error:', err);
            toast.error('Failed to load earnings data');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const overview = dashboard?.overview || dashboard?.stats || dashboard || {};
    const totalRevenue = overview.total_revenue || 0;
    const totalOrders = overview.total_orders || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const dailySales = salesReport?.daily_sales || salesReport?.sales || [];

    return (
        <div className="space-y-6">
            <AdminTopbar
                title="Earnings & Reports"
                subtitle="Track your store revenue, sales trends, and financial performance"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="inline-flex rounded-xl bg-sky-50 p-1 ring-1 ring-sky-100">
                            {['weekly', 'monthly', 'yearly'].map((p) => (
                                <button key={p} onClick={() => setPeriod(p)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${period === p ? 'bg-white text-blue-700 shadow-sm' : 'text-sky-600 hover:text-blue-700'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button onClick={fetchData} disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-50">
                            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                }
            />

            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: FiDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'Total Orders', value: totalOrders, icon: FiBarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { title: 'Avg Order Value', value: formatCurrency(avgOrderValue), icon: FiTrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { title: 'Period', value: period.charAt(0).toUpperCase() + period.slice(1), icon: FiCalendar, color: 'text-sky-600', bg: 'bg-sky-50' },
                ].map((card, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</span>
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <h3 className="mt-3 text-2xl font-extrabold text-slate-800">{loading ? '...' : card.value}</h3>
                    </div>
                ))}
            </div>

            {/* Sales Breakdown Table */}
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiBarChart2 className="text-sky-600" />
                    Sales Breakdown
                </h3>
                {loading ? (
                    <div className="py-12 text-center text-slate-400">
                        <FiRefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Loading sales data...</p>
                    </div>
                ) : dailySales.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Orders</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Revenue</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Avg Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dailySales.map((day, idx) => (
                                    <tr key={idx} className="hover:bg-sky-50/30 transition">
                                        <td className="py-3 px-4 font-medium text-slate-700">{day._id || day.date || `Day ${idx + 1}`}</td>
                                        <td className="py-3 px-4 text-slate-600">{day.count || day.orders || 0}</td>
                                        <td className="py-3 px-4 font-bold text-blue-700">{formatCurrency(day.total || day.revenue)}</td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {formatCurrency((day.count || day.orders) > 0 ? (day.total || day.revenue) / (day.count || day.orders) : 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center text-slate-400">
                        <FiDollarSign className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-medium">No sales data available for this period.</p>
                        <p className="text-xs mt-1">Sales data will appear once orders are fulfilled.</p>
                    </div>
                )}
            </div>

            {/* Analytics Summary */}
            {analytics && (
                <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiTrendingUp className="text-emerald-600" />
                        Analytics Overview
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[
                            { label: 'Total Views', value: analytics.total_views || analytics.views || 0 },
                            { label: 'Conversion Rate', value: `${(analytics.conversion_rate || 0).toFixed(1)}%` },
                            { label: 'Return Rate', value: `${(analytics.return_rate || 0).toFixed(1)}%` },
                        ].map((item, idx) => (
                            <div key={idx} className="rounded-xl bg-slate-50 p-4 text-center">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                                <p className="mt-2 text-xl font-extrabold text-slate-800">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerEarnings;
