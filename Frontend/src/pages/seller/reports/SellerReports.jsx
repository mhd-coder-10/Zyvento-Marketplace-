import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiPieChart,
    FiRefreshCw,
    FiHome,
    FiDollarSign,
    FiShoppingCart,
    FiTrendingUp,
    FiPackage,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerReports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');
    const [reportData, setReportData] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        unitsSold: 0,
        topProducts: [],
    });

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchReports();
        return () => {
            mounted.current = false;
        };
    }, [period]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [salesRes, perfRes] = await Promise.allSettled([
                ApiService.getSellerSalesReport({ period }),
                ApiService.getSellerPerformanceReport({}),
            ]);

            let sales = {};
            let perf = {};

            if (salesRes.status === 'fulfilled' && salesRes.value?.data?.data) {
                sales = salesRes.value.data.data;
            }
            if (perfRes.status === 'fulfilled' && perfRes.value?.data?.data) {
                perf = perfRes.value.data.data;
            }

            if (mounted.current) {
                const totalRevenue = sales.totalRevenue || sales.revenue || sales.total_sales || 0;
                const totalOrders = sales.totalOrders || sales.orderCount || sales.total_orders || 0;
                const avgVal = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : (sales.averageOrderValue || 0);
                const unitsSold = perf.unitsSold || perf.total_units || 0;
                const topProducts = perf.topProducts || sales.topProducts || [];

                setReportData({
                    totalRevenue,
                    totalOrders,
                    averageOrderValue: avgVal,
                    unitsSold,
                    topProducts: Array.isArray(topProducts) ? topProducts : [],
                });
            }
        } catch (err) {
            console.error('Failed to load database reports:', err);
            toast.error('Failed to generate reports');
        } finally {
            if (mounted.current) setLoading(false);
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
                        Reports
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FiPieChart className="text-blue-600 w-7 h-7" />
                            <span>Sales & Performance Reports</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Analyze revenue metrics, sales trends, and catalog efficiency directly from database logs.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                            {['daily', 'weekly', 'monthly'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                                        period === p
                                            ? 'bg-white text-blue-700 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={fetchReports}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : formatCurrency(reportData.totalRevenue)}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FiDollarSign className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Orders Count</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : reportData.totalOrders}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FiShoppingCart className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Order Value</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : formatCurrency(reportData.averageOrderValue)}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FiTrendingUp className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Units Sold</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : reportData.unitsSold}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <FiPackage className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Top Selling Products Table */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden text-left">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Top Performing Products
                    </h2>
                    <span className="text-xs text-slate-400 capitalize">{period} Period</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Product Name</th>
                                <th className="py-3.5 px-4">Units Sold</th>
                                <th className="py-3.5 px-4 text-right">Gross Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="py-12 text-center text-slate-400">
                                        <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                        <span>Calculating report from database...</span>
                                    </td>
                                </tr>
                            ) : reportData.topProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="py-12 text-center text-slate-400">
                                        <FiPackage className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="font-bold text-slate-700 text-sm">No sales recorded in this period</p>
                                        <p className="text-xs text-slate-400 mt-1">Sales reports will populate dynamically as orders are placed.</p>
                                    </td>
                                </tr>
                            ) : (
                                reportData.topProducts.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-sky-50/30 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-800">
                                            {item.name || item.product_name}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                                {item.units || item.quantity || 0} units
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                                            {formatCurrency(item.revenue || item.total_amount || 0)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SellerReports;
