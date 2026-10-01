import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft,
    FiRefreshCw,
    FiTag,
    FiCalendar,
    FiUsers,
    FiDollarSign,
    FiPercent,
    FiShoppingBag,
    FiCheckCircle,
    FiAlertCircle,
    FiClock,
    FiEdit2,
    FiInfo,
    FiTrendingUp
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const CouponDetails = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [couponData, setCouponData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [code]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            // First try fetching the comprehensive coupon report detail
            try {
                const res = await ApiService.getCouponReportDetail(code);
                if (res.data?.success && res.data?.data) {
                    setCouponData(res.data.data);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn('Report detail endpoint not accessible, falling back to basic coupon info', err);
            }

            // Fallback to standard coupon lookup
            const basicRes = await ApiService.getCouponByCode(code);
            if (basicRes.data?.success && basicRes.data?.data) {
                const c = basicRes.data.data;
                setCouponData({
                    config: {
                        code: c.code,
                        description: c.description,
                        discount_type: c.discountType || c.discount_type,
                        discount_value: c.discountValue || c.discount_value,
                        max_discount_amount: c.maxDiscountAmount || c.max_discount_amount,
                        min_order_amount: c.minOrderAmount || c.min_order_amount,
                        start_date: c.startDate || c.start_date,
                        expiry_date: c.expiryDate || c.expiry_date,
                        usage_limit: c.usageLimit || c.usage_limit,
                        per_user_limit: c.perUserLimit || c.per_user_limit,
                        status: c.status,
                        created_at: c.createdAt
                    },
                    summary: {
                        total_usage: c.usedCount || c.used_count || 0,
                        orders_count: (c.usageHistory || []).length,
                        total_order_value: 0,
                        total_discount_provided: 0,
                        zyvento_cost_borne: 0
                    },
                    orders: (c.usageHistory || []).map((u, i) => ({
                        order_id: u.orderId || u.order_id || `ORD-${i + 1}`,
                        order_number: u.orderNumber || u.order_number || `ORD-${i + 1}`,
                        date: u.usedAt || u.used_at,
                        customer_name: u.userName || 'Customer',
                        customer_email: u.userEmail || '',
                        order_status: 'delivered',
                        payment_status: 'paid',
                        total_amount: u.orderAmount || 0,
                        coupon_discount: u.discountAmount || 0,
                        platform_coupon_cost: u.discountAmount || 0
                    })),
                    related_order_ids: (c.usageHistory || []).map(u => u.orderId || u.order_id).filter(Boolean),
                    daily_breakdown: []
                });
            } else {
                toast.error('Coupon not found');
                navigate('/admin/coupons');
            }
        } catch (error) {
            console.error('Failed to load coupon details', error);
            toast.error('Failed to load coupon details');
            navigate('/admin/coupons');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (val) => {
        return `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <FiRefreshCw className="animate-spin !text-blue-600 w-8 h-8" />
                    <span className="text-slate-500 font-medium">Loading coupon details...</span>
                </div>
            </div>
        );
    }

    if (!couponData || !couponData.config) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md">
                    <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Coupon Not Found</h2>
                    <p className="text-slate-500 mb-4">The coupon code "{code}" does not exist or has been removed.</p>
                    <button
                        onClick={() => navigate('/admin/coupons')}
                        className="px-5 py-2.5 bg-blue-600 !text-white rounded-xl font-semibold shadow hover:bg-blue-700"
                    >
                        Back to Coupons
                    </button>
                </div>
            </div>
        );
    }

    const { config, summary, orders = [], daily_breakdown = [], related_order_ids = [] } = couponData;
    const isExpired = new Date(config.expiry_date) < new Date();
    const effectiveStatus = isExpired ? 'expired' : config.status;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white overflow-x-hidden pb-12">
            <AdminTopbar
                title="Coupon Details & Performance"
                subtitle={`Overview for coupon code: ${config.code}`}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/coupons/edit/${config.code}`)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 !text-white rounded-xl shadow-sm text-sm font-semibold transition-all"
                        >
                            <FiEdit2 className="w-4 h-4" /> Edit Coupon
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/coupons')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm text-sm font-medium transition-all"
                        >
                            <FiArrowLeft className="w-4 h-4" /> Back to Coupons
                        </button>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
                {/* Platform-Funded Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md flex items-start gap-4">
                    <div className="p-2.5 bg-white/20 rounded-xl shrink-0 mt-0.5">
                        <FiInfo className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-base sm:text-lg">Zyvento Platform-Funded Coupon</span>
                            <span className="px-2.5 py-0.5 bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 rounded-full text-xs font-semibold uppercase tracking-wider">
                                100% Platform Borne
                            </span>
                        </div>
                        <p className="text-blue-100 text-xs sm:text-sm mt-1 leading-relaxed">
                            Sellers are paid on their full original product price. All discounts applied via <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">{config.code}</span> are borne entirely by Zyvento and recorded as a separate platform expense in Finance.
                        </p>
                    </div>
                </div>

                {/* 4 Summary Performance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Usage</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                {summary.total_usage || 0}
                                {config.usage_limit ? (
                                    <span className="text-xs font-medium text-slate-400 ml-1">/ {config.usage_limit}</span>
                                ) : (
                                    <span className="text-xs font-medium text-slate-400 ml-1">uses</span>
                                )}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Per-user limit: <strong className="text-slate-700">{config.per_user_limit || 1}</strong>
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FiUsers className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Order Value</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(summary.total_order_value)}</p>
                            <p className="text-xs text-emerald-600 font-medium mt-1">
                                Across {summary.orders_count || 0} orders
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <FiShoppingBag className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Discount Provided</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(summary.total_discount_provided)}</p>
                            <p className="text-xs text-slate-500 mt-1">Saved by customers</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <FiTag className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Zyvento Cost Borne</p>
                            <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(summary.zyvento_cost_borne)}</p>
                            <p className="text-xs text-slate-500 mt-1">Recorded in Finance GL</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <FiDollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Configuration and Validity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Discount Configuration */}
                    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <FiTag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Discount Configuration</h3>
                                    <p className="text-xs text-slate-500">Rules applied at checkout</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-lg text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                {config.code}
                            </span>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Discount Type</span>
                                <span className="font-semibold text-slate-800 capitalize">
                                    {config.discount_type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Discount Value</span>
                                <span className="font-bold text-blue-600">
                                    {config.discount_type === 'percentage' ? `${config.discount_value}% OFF` : `₹${config.discount_value} OFF`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Minimum Order Amount</span>
                                <span className="font-semibold text-slate-800">
                                    {config.min_order_amount ? `₹${config.min_order_amount}` : 'None (₹0)'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Maximum Discount Cap</span>
                                <span className="font-semibold text-slate-800">
                                    {config.max_discount_amount ? `₹${config.max_discount_amount}` : 'No cap'}
                                </span>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                                <p className="text-slate-600 text-xs italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    {config.description || 'No public description provided for this coupon.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Validity & Usage Limits */}
                    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                                    <FiCalendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Validity & Limits</h3>
                                    <p className="text-xs text-slate-500">Lifecycle and threshold controls</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                effectiveStatus === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : effectiveStatus === 'expired'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                                {effectiveStatus}
                            </span>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Start Date</span>
                                <span className="font-semibold text-slate-800">{formatDate(config.start_date)}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Expiry Date</span>
                                <span className={`font-semibold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {formatDate(config.expiry_date)} {isExpired && '(Expired)'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Total Usage Limit</span>
                                <span className="font-semibold text-slate-800">
                                    {config.usage_limit ? `${config.usage_limit} uses max` : 'Unlimited'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Per User Usage Limit</span>
                                <span className="font-semibold text-slate-800">
                                    {config.per_user_limit || 1} {config.per_user_limit === 1 ? 'time per customer' : 'times per customer'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">Created On</span>
                                <span className="font-semibold text-slate-800">{formatDate(config.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Usage Breakdown */}
                {daily_breakdown && daily_breakdown.length > 0 && (
                    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FiTrendingUp className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-900">Usage / Date-wise Breakdown</h3>
                            </div>
                            <span className="text-xs text-slate-500">{daily_breakdown.length} active day(s)</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-100">
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4 text-center">Orders Count</th>
                                        <th className="py-3 px-4 text-right">Gross Orders</th>
                                        <th className="py-3 px-4 text-right">Discount Provided</th>
                                        <th className="py-3 px-4 text-right">Zyvento Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {daily_breakdown.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-800">{row.date}</td>
                                            <td className="py-3 px-4 text-center font-semibold text-slate-700">{row.usage_count}</td>
                                            <td className="py-3 px-4 text-right font-medium text-slate-700">{formatCurrency(row.order_amount)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(row.discount_given)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-rose-600">{formatCurrency(row.coupon_cost)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Orders Using This Coupon */}
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <FiShoppingBag className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900">Orders Using This Coupon ({orders.length})</h3>
                        </div>
                        {related_order_ids.length > 0 && (
                            <div className="text-xs text-slate-500">
                                <span>Related IDs: </span>
                                <span className="font-mono font-medium text-slate-700">
                                    {related_order_ids.slice(0, 5).join(', ')}
                                    {related_order_ids.length > 5 ? ` +${related_order_ids.length - 5} more` : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                            <FiShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-slate-600">No orders have applied this coupon yet</p>
                            <p className="text-xs text-slate-400 mt-1">Once customers redeem this coupon at checkout, order records will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-100">
                                        <th className="py-3 px-4">Order #</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-center">Payment</th>
                                        <th className="py-3 px-4 text-right">Order Value</th>
                                        <th className="py-3 px-4 text-right">Platform Discount</th>
                                        <th className="py-3 px-4 text-right">Zyvento Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((ord, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                                                {ord.order_number || ord.order_id || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 text-xs">
                                                {formatDate(ord.date)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-800 text-xs">{ord.customer_name || 'Customer'}</div>
                                                {ord.customer_email && (
                                                    <div className="text-[11px] text-slate-400">{ord.customer_email}</div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                                    ord.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                                    ord.order_status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                                                    'bg-blue-50 text-blue-700'
                                                }`}>
                                                    {ord.order_status || 'placed'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                                    ord.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                                    ord.payment_status === 'refunded' ? 'bg-amber-50 text-amber-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {ord.payment_status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-slate-800">
                                                {formatCurrency(ord.total_amount)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-amber-600">
                                                -{formatCurrency(ord.coupon_discount)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-rose-600">
                                                {formatCurrency(ord.platform_coupon_cost || ord.coupon_discount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouponDetails;