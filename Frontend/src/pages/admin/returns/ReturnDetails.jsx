import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiRefreshCw, FiSave, FiUser, FiMapPin,
    FiPackage, FiCheckCircle, FiXCircle, FiClock, FiRotateCcw,
    FiDollarSign, FiCreditCard, FiCalendar, FiTruck, FiAlertCircle,
    FiFileText, FiTag, FiShoppingBag
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const ReturnDetails = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states for status update
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const fetchReturn = useCallback(async () => {
        if (!orderCode) {
            toast.error('Invalid order code');
            navigate('/admin/returns');
            return;
        }

        try {
            setLoading(true);
            const res = await ApiService.getReturnByOrderCode(orderCode);
            if (res.data.success && res.data.data) {
                const data = res.data.data;
                setOrder(data);
                setOrderStatus(data.order_status || 'returned');
                setPaymentStatus(data.payment_status || 'pending');
                setAdminNotes(data.admin_notes || data.notes || '');
            } else {
                toast.error('Return record not found');
                navigate('/admin/returns');
            }
        } catch (error) {
            console.error('Failed to load return details:', error);
            toast.error(error.response?.data?.message || 'Failed to load return details');
            navigate('/admin/returns');
        } finally {
            setLoading(false);
        }
    }, [orderCode, navigate]);

    useEffect(() => {
        fetchReturn();
    }, [fetchReturn]);

    // Update Status & Payment
    const handleUpdateStatus = async () => {
        setSaving(true);
        try {
            const payload = {
                order_status: orderStatus,
                payment_status: paymentStatus,
                notes: adminNotes || undefined
            };

            const res = await ApiService.updateReturnStatus(orderCode, payload);
            if (res.data.success) {
                toast.success('Return status and refund details updated successfully');
                fetchReturn();
            } else {
                throw new Error(res.data.message);
            }
        } catch (error) {
            console.error('Failed to update return status:', error);
            toast.error(error.response?.data?.message || 'Failed to update return status');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Badge helper for Order Status
    const getOrderBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'cancelled') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiXCircle className="w-3.5 h-3.5" /> Cancelled
                </span>
            );
        }
        if (s === 'returned') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <FiRotateCcw className="w-3.5 h-3.5" /> Returned
                </span>
            );
        }
        if (s === 'delivered') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FiCheckCircle className="w-3.5 h-3.5" /> Delivered
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {status}
            </span>
        );
    };

    // Badge helper for Payment Status
    const getPaymentBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'refunded') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FiCheckCircle className="w-3.5 h-3.5" /> Refunded
                </span>
            );
        }
        if (s === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <FiClock className="w-3.5 h-3.5" /> Pending
                </span>
            );
        }
        if (s === 'paid') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <FiCheckCircle className="w-3.5 h-3.5" /> Paid
                </span>
            );
        }
        if (s === 'failed') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiXCircle className="w-3.5 h-3.5" /> Failed
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {(status || 'N/A').replace(/_/g, ' ')}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading return details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-slate-500 font-medium">Return record not found</p>
                    <button
                        onClick={() => navigate('/admin/returns')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                        Back to Returns
                    </button>
                </div>
            </div>
        );
    }

    const shipping = order.shipping_address || {};
    const items = order.order_items || [];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Return & Cancellation Details"
                subtitle={`Order #${order.order_code || order.order_number}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/admin/returns')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Back to Returns
                        </button>
                        <button
                            onClick={fetchReturn}
                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-xs"
                            title="Refresh"
                        >
                            <FiRefreshCw className="w-4 h-4 text-blue-600" />
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">

                {/* ===== OVERVIEW HEADER CARD ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 ${
                                order.order_status === 'cancelled'
                                    ? 'bg-gradient-to-br from-rose-500 to-red-600'
                                    : 'bg-gradient-to-br from-amber-500 to-orange-600'
                            }`}>
                                {order.order_status === 'cancelled' ? (
                                    <FiXCircle className="w-7 h-7" />
                                ) : (
                                    <FiRotateCcw className="w-7 h-7" />
                                )}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                                        Order #{order.order_code}
                                    </h2>
                                    {getOrderBadge(order.order_status)}
                                    {getPaymentBadge(order.payment_status)}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                                    <span>
                                        Payment Method: <strong className="text-slate-700">{order.payment_method || 'COD'}</strong>
                                    </span>
                                    {order.seller_id?.business_name && (
                                        <>
                                            <span>•</span>
                                            <span>Seller: <strong className="text-slate-700">{order.seller_id.business_name}</strong></span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dates Section */}
                        <div className="flex flex-wrap gap-4 text-xs border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                                <FiCalendar className="text-blue-600 w-4 h-4" />
                                <div>
                                    <p className="text-[11px] text-slate-400">Order Placed</p>
                                    <p className="font-semibold text-slate-800">{formatDateTime(order.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                                <FiClock className="text-amber-600 w-4 h-4" />
                                <div>
                                    <p className="text-[11px] text-slate-400">Last Updated</p>
                                    <p className="font-semibold text-slate-800">{formatDateTime(order.updated_at || order.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== STATUS & REFUND MANAGEMENT CARD ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <FiPackage className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Return & Refund Processing</h3>
                                <p className="text-xs text-slate-500">Update return verification, order status, and refund payment settlement</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {/* Order Status */}
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                Order Lifecycle Status
                            </label>
                            <select
                                value={orderStatus}
                                onChange={(e) => setOrderStatus(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                            >
                                <option value="returned">Returned (Item received back)</option>
                                <option value="cancelled">Cancelled (Order terminated)</option>
                                <option value="pending">Pending (Under review)</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>

                        {/* Payment Status */}
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                Payment / Refund Status
                            </label>
                            <select
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                            >
                                <option value="pending">Pending Refund</option>
                                <option value="refunded">Refunded (Settlement complete)</option>
                                <option value="partially_refunded">Partially Refunded</option>
                                <option value="paid">Paid (Not yet refunded)</option>
                                <option value="failed">Failed Refund</option>
                            </select>
                        </div>

                        {/* Admin Notes */}
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                                Internal Resolution Note
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Refund approved via Razorpay / NEFT"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FiAlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Updating this record synchronizes status across customer tracking and order modules.</span>
                        </div>
                        <button
                            onClick={handleUpdateStatus}
                            disabled={saving}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <FiRefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-4 h-4" /> Save Status Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ===== 3-CARD DETAIL GRID ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* 1. Customer Details */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <FiUser className="w-4 h-4" />
                            </div>
                            <span>Customer Information</span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div>
                                <span className="text-slate-400 block text-[11px]">Full Name</span>
                                <span className="font-semibold text-slate-800 text-sm">
                                    {order.user_id?.first_name || shipping.full_name || 'Guest'} {order.user_id?.last_name || ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Email Address</span>
                                <span className="font-medium text-slate-700">{order.user_id?.email || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-[11px]">Mobile Number</span>
                                <span className="font-medium text-slate-700">{order.user_id?.mobile_number || shipping.mobile_number || 'N/A'}</span>
                            </div>
                            {order.user_id?._id && (
                                <div className="pt-2 border-t border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Account ID</span>
                                    <span className="font-mono text-slate-500 text-[11px]">{order.user_id._id}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Shipping / Pickup Address */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <FiMapPin className="w-4 h-4" />
                            </div>
                            <span>Return & Pickup Address</span>
                        </div>

                        <div className="space-y-2 text-xs">
                            <p className="font-semibold text-slate-800 text-sm">{shipping.full_name || 'Customer'}</p>
                            <p className="text-slate-600 leading-relaxed">
                                {[
                                    shipping.house_number,
                                    shipping.street,
                                    shipping.landmark,
                                    shipping.city,
                                    shipping.state,
                                    shipping.pincode
                                ].filter(Boolean).join(', ') || 'No shipping address specified'}
                            </p>
                            {shipping.mobile_number && (
                                <p className="text-slate-500 pt-1">
                                    Contact: <span className="font-medium text-slate-700">{shipping.mobile_number}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* 3. Financial & Refund Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <FiCreditCard className="w-4 h-4" />
                            </div>
                            <span>Financial & Refund Breakdown</span>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-slate-500">
                                <span>Items Subtotal</span>
                                <span className="font-medium text-slate-800">{formatCurrency(order.subtotal || order.total_amount)}</span>
                            </div>
                            {order.delivery_charge > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>Delivery Charge</span>
                                    <span className="font-medium text-slate-800">{formatCurrency(order.delivery_charge)}</span>
                                </div>
                            )}
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount Applied</span>
                                    <span className="font-medium">-{formatCurrency(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
                                <span>Total Order Amount</span>
                                <span className="text-blue-600">{formatCurrency(order.total_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-slate-500">Refund Settlement</span>
                                <span>{getPaymentBadge(order.payment_status)}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ===== RETURNED ITEMS BREAKDOWN ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FiShoppingBag className="w-4 h-4 text-blue-600" />
                            <h3 className="font-bold text-slate-900 text-sm">
                                Returned Items ({items.length || order.total_items || 1})
                            </h3>
                        </div>
                    </div>

                    {/* Desktop Items Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-5">Item</th>
                                    <th className="py-3 px-5">Price</th>
                                    <th className="py-3 px-5 text-center">Quantity</th>
                                    <th className="py-3 px-5">Item Status</th>
                                    <th className="py-3 px-5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {items.length > 0 ? (
                                    items.map((item, idx) => (
                                        <tr key={item._id || idx} className="hover:bg-slate-50/60 transition">
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    {item.product_image ? (
                                                        <img
                                                            src={item.product_image}
                                                            alt={item.product_name}
                                                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <FiPackage className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-slate-900 text-sm">{item.product_name}</p>
                                                        {item.product_code && (
                                                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                                                SKU: {item.product_code}
                                                            </p>
                                                        )}
                                                        {item.variant_name && (
                                                            <p className="text-[11px] text-blue-600 mt-0.5">
                                                                Variant: {item.variant_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 font-medium text-slate-700">
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="py-4 px-5 text-center font-bold text-slate-800">
                                                {item.quantity}
                                            </td>
                                            <td className="py-4 px-5">
                                                {getOrderBadge(item.item_status || order.order_status)}
                                            </td>
                                            <td className="py-4 px-5 text-right font-bold text-slate-900">
                                                {formatCurrency(item.total_price || (item.price * item.quantity))}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">
                                            No itemized details recorded for this order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Items Cards */}
                    <div className="sm:hidden divide-y divide-slate-100">
                        {items.length > 0 ? (
                            items.map((item, idx) => (
                                <div key={item._id || idx} className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        {item.product_image ? (
                                            <img
                                                src={item.product_image}
                                                alt={item.product_name}
                                                className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                <FiPackage className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 text-xs truncate">{item.product_name}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                Qty: {item.quantity} × {formatCurrency(item.price)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-slate-900 text-xs">
                                                {formatCurrency(item.total_price || (item.price * item.quantity))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] pt-1">
                                        <span className="text-slate-400">Item Status:</span>
                                        {getOrderBadge(item.item_status || order.order_status)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-slate-400 text-xs">
                                No item details available.
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== STATUS HISTORY AUDIT TIMELINE ===== */}
                {Array.isArray(order.status_history) && order.status_history.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                            <FiClock className="w-4 h-4 text-blue-600" />
                            <span>Audit & Status History Trail</span>
                        </div>

                        <div className="space-y-3">
                            {order.status_history.map((hist, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-1">
                                            <span className="font-semibold text-slate-800 capitalize">
                                                Status changed to {hist.status}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {formatDateTime(hist.timestamp)}
                                            </span>
                                        </div>
                                        {hist.notes && (
                                            <p className="text-slate-500 mt-0.5 italic text-[11px]">
                                                "{hist.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReturnDetails;