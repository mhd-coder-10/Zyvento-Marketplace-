import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiDollarSign,
    FiTrendingUp,
    FiRefreshCw,
    FiHome,
    FiCheckCircle,
    FiClock,
    FiCreditCard,
    FiAlertCircle,
    FiShoppingBag,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerEarnings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        netEarnings: 0,
        pendingPayout: 0,
        paidPayout: 0,
        avgOrderValue: 0,
        totalOrders: 0,
    });
    const [transactions, setTransactions] = useState([]);

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchEarnings();
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            // Fetch real summary & orders from database safely
            const [summaryRes, ordersRes] = await Promise.allSettled([
                typeof ApiService.getSellerEarnings === 'function' ? ApiService.getSellerEarnings() : Promise.reject('n/a'),
                typeof ApiService.getSellerMyOrders === 'function' ? ApiService.getSellerMyOrders({ limit: 50 }) : Promise.reject('n/a'),
            ]);

            let totalRevenue = 0;
            let paidAmount = 0;
            let pendingAmount = 0;
            let avgVal = 0;
            let orderCount = 0;
            let txList = [];

            // 1. Parse dedicated earnings endpoint response
            if (summaryRes.status === 'fulfilled' && summaryRes.value?.data?.data) {
                const s = summaryRes.value.data.data;
                totalRevenue = s.net_earnings ?? s.total_earnings ?? 0;
                paidAmount = s.paid_earnings ?? 0;
                pendingAmount = s.pending_earnings ?? Math.max(0, totalRevenue - paidAmount);
                avgVal = s.average_order_value ?? 0;
                orderCount = s.total_orders ?? 0;
                if (Array.isArray(s.transactions) && s.transactions.length > 0) {
                    txList = s.transactions;
                }
            }

            // 2. Parse orders if transactions list is still empty
            if (txList.length === 0 && ordersRes.status === 'fulfilled' && ordersRes.value?.data?.data) {
                const ordData = ordersRes.value.data.data;
                const oList = Array.isArray(ordData) ? ordData : (ordData.orders || []);
                if (!orderCount) orderCount = oList.length;

                if (!totalRevenue && oList.length > 0) {
                    totalRevenue = oList.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
                    pendingAmount = totalRevenue;
                    avgVal = Math.round(totalRevenue / oList.length);
                }

                txList = oList.map((ord) => {
                    const gross = Number(ord.total_amount) || 0;
                    const fee = Number(((gross * 10) / 100).toFixed(2));
                    const net = Number((gross - fee).toFixed(2));
                    return {
                        _id: ord._id,
                        transaction_id: ord.order_number || ord.order_code || (typeof ord._id === 'string' ? ord._id.slice(-8).toUpperCase() : 'ORD'),
                        payout_id: `PAY-${typeof ord._id === 'string' ? ord._id.slice(-6).toUpperCase() : '001'}`,
                        created_at: ord.created_at,
                        gross_amount: gross,
                        commission_amount: fee,
                        net_amount: net,
                        status: ord.order_status === 'delivered' ? 'paid' : 'pending',
                    };
                });
            }

            if (mounted.current) {
                setStats({
                    netEarnings: totalRevenue,
                    paidPayout: paidAmount,
                    pendingPayout: pendingAmount,
                    avgOrderValue: avgVal,
                    totalOrders: orderCount,
                });
                setTransactions(txList);
            }
        } catch (err) {
            console.error('Failed to load earnings from database:', err);
            toast.error('Failed to load earnings data');
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
                        My Earnings
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FiDollarSign className="text-emerald-600 w-7 h-7" />
                            <span>My Earnings & Payouts</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Review settled sales, deduction breakdowns, and upcoming bank disbursements.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchEarnings}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* 4 Financial Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Store Revenue</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : formatCurrency(stats.netEarnings)}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FiDollarSign className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid Disbursements</p>
                        <h3 className="text-2xl font-extrabold text-blue-600 mt-1">
                            {loading ? '—' : formatCurrency(stats.paidPayout)}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FiCheckCircle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Payout</p>
                        <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
                            {loading ? '—' : formatCurrency(stats.pendingPayout)}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FiClock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Order Value</p>
                        <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
                            {loading ? '—' : formatCurrency(stats.avgOrderValue)}
                        </h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <FiTrendingUp className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Payout History Table */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden text-left">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Disbursement & Settlement History
                    </h2>
                    <span className="text-xs text-slate-400">Direct to registered bank</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Payout ID</th>
                                <th className="py-3.5 px-4">Cycle Date</th>
                                <th className="py-3.5 px-4">Gross Sales</th>
                                <th className="py-3.5 px-4">Marketplace Fee</th>
                                <th className="py-3.5 px-4 font-bold">Net Payout</th>
                                <th className="py-3.5 px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                        <span>Loading earnings from database...</span>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <FiShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="font-bold text-slate-700 text-sm">No disbursement records yet</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            As customer orders are delivered, settlement records will be generated and displayed here.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx._id || tx.id} className="hover:bg-sky-50/30 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                            #{tx.transaction_id || tx.payout_id || tx._id?.slice(-8).toUpperCase()}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500">
                                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700">
                                            {formatCurrency(tx.gross_amount || tx.amount || 0)}
                                        </td>
                                        <td className="py-3.5 px-4 text-rose-600 font-medium">
                                            -{formatCurrency(tx.commission_amount || tx.fee || 0)}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                            {formatCurrency(tx.net_amount || tx.payout_amount || 0)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                                    tx.status === 'completed' || tx.status === 'paid'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}
                                            >
                                                {tx.status === 'completed' || tx.status === 'paid' ? (
                                                    <FiCheckCircle className="w-3 h-3" />
                                                ) : (
                                                    <FiClock className="w-3 h-3" />
                                                )}
                                                <span className="capitalize">{tx.status || 'pending'}</span>
                                            </span>
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

export default SellerEarnings;
