import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiShoppingBag, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw,
    FiSearch, FiChevronRight, FiCalendar, FiUser
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import MonthlyOrdersChart from '../../../components/admin/MonthlyOrdersChart';

const OrderReport = ({ dateRange }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getReportData('orders', dateRange);
            if (res.data.success) setData(res.data.data);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [dateRange]);

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    };

    const filteredOrders = useMemo(() => {
        return (data?.recentOrders || []).filter(order => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                order.product_name?.toLowerCase().includes(term) ||
                order.order_code?.toLowerCase().includes(term) ||
                order.customer_name?.toLowerCase().includes(term);
            const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [data, searchTerm, statusFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-72 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
                <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8" />
                <p className="text-slate-500 font-medium text-sm">Loading Order Analytics...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">

            {/* 4 SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Orders */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Orders</span>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <FiShoppingBag className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">{data?.totalOrders || 0}</p>
                    </div>
                    <p className="text-xs text-blue-100 mt-4 pt-2 border-t border-white/20">All placements in period</p>
                </div>

                {/* In Progress */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiClock className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">{data?.inProgressOrders || 0}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-100">Pending, packed & shipped</p>
                </div>

                {/* Delivered */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered</span>
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiCheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{data?.deliveredOrders || 0}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-100">Successfully completed</p>
                </div>

                {/* Cancelled / Returned */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-rose-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancelled / Returns</span>
                            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">
                            {(data?.cancelledOrders || 0) + (data?.returnedOrders || 0)}
                        </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-100">Cancelled or returned shipments</p>
                </div>
            </div>

            {/* CHART & STATUS BREAKDOWN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MonthlyOrdersChart title="Order Volume Velocity" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
                    <div className="pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Lifecycle Breakdown</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Distribution across order milestones</p>
                    </div>

                    <div className="space-y-4 py-4">
                        {[
                            { label: 'Pending', value: data?.pendingOrders || 0, color: 'bg-amber-500' },
                            { label: 'Confirmed', value: data?.confirmedOrders || 0, color: 'bg-blue-500' },
                            { label: 'Shipped', value: data?.shippedOrders || 0, color: 'bg-indigo-500' },
                            { label: 'Delivered', value: data?.deliveredOrders || 0, color: 'bg-emerald-500' },
                            { label: 'Cancelled', value: data?.cancelledOrders || 0, color: 'bg-rose-500' },
                        ].map((status) => {
                            const total = data?.totalOrders || 1;
                            const percent = Math.round((status.value / total) * 100);
                            return (
                                <div key={status.label}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-medium text-slate-700">{status.label}</span>
                                        <span className="font-bold text-slate-900">{status.value} ({percent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className={`${status.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                        Calculated from all order records within the selected date window.
                    </div>
                </div>
            </div>

            {/* RECENT ORDERS TABLE (RESPONSIVE) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Recent Order Activity</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Latest order entries with real-time tracking statuses</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products, order code..."
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
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returned">Returned</option>
                        </select>
                    </div>
                </div>

                {/* Desktop Table View */}
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
                                    <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">No orders matching current criteria</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
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

export default OrderReport;