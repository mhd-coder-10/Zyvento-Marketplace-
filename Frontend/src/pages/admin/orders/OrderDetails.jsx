import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiRefreshCw, FiMapPin, FiUser, FiShoppingBag,
    FiCreditCard, FiCalendar, FiPackage, FiCheckCircle, FiClock,
    FiXCircle, FiTruck, FiExternalLink
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const OrderDetails = () => {
    const { orderCode } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // Inline Dropdown States
    const [orderStatus, setOrderStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [savingStatus, setSavingStatus] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!orderCode || orderCode === 'undefined') {
            toast.error('Invalid order code in URL');
            navigate('/admin/orders');
            return;
        }
        try {
            setLoading(true);
            const res = await ApiService.getOrderByCode(orderCode);
            if (res.data.success) {
                const data = res.data.data;
                setOrder(data);
                setOrderStatus(data.order_status);
                setPaymentStatus(data.payment_status);
                setPaymentMethod(data.payment_method || 'COD');
            } else {
                toast.error('Order not found');
                navigate('/admin/orders');
            }
        } catch (error) {
            toast.error('Failed to load order details');
            navigate('/admin/orders');
        } finally {
            setLoading(false);
        }
    }, [orderCode, navigate]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleStatusSave = async () => {
        setSavingStatus(true);
        try {
            await ApiService.updateOrderStatus(orderCode, {
                order_status: orderStatus,
                payment_status: paymentStatus,
                payment_method: paymentMethod
            });
            toast.success('Order status updated successfully');
            fetchOrder();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setSavingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-slate-500 font-medium">Order not found</p>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    const formatDateTime = (date) => {
        if (!date) return 'Not Yet';
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'delivered') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FiCheckCircle className="w-3.5 h-3.5" /> Delivered
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
        if (s === 'confirmed') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <FiCheckCircle className="w-3.5 h-3.5" /> Confirmed
                </span>
            );
        }
        if (s === 'shipped') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <FiTruck className="w-3.5 h-3.5" /> Shipped
                </span>
            );
        }
        if (s === 'cancelled') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <FiXCircle className="w-3.5 h-3.5" /> Cancelled
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                {s.replace(/_/g, ' ') || 'Unknown'}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Order Details"
                subtitle={`Order #${order.order_code || order.order_number}`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Back to Orders
                        </button>
                        <button
                            onClick={fetchOrder}
                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-xs"
                            title="Refresh"
                        >
                            <FiRefreshCw className="w-4 h-4 text-blue-600" />
                        </button>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* ====== ORDER SUMMARY HEADER CARD ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0">
                                <FiShoppingBag className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                                        Order #{order.order_code || order.order_number}
                                    </h2>
                                    {getStatusBadge(order.order_status)}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                                    <p>
                                        Order Code: <strong className="font-mono text-slate-700">{order.order_code}</strong>
                                    </p>
                                    {order.seller_id?.business_name && (
                                        <>
                                            <span>•</span>
                                            <p>Seller: <strong className="text-slate-700">{order.seller_id.business_name}</strong></p>
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
                                <FiTruck className="text-emerald-600 w-4 h-4" />
                                <div>
                                    <p className="text-[11px] text-slate-400">Delivery Status</p>
                                    <p className="font-semibold text-slate-800">
                                        {order.delivered_at ? `Delivered on ${formatDateTime(order.delivered_at)}` : 'In Progress'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== STATUS & PAYMENT MANAGEMENT ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FiPackage className="text-blue-600 w-4 h-4" /> Status & Payment Management
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Order Status */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Order Status</label>
                            <select
                                value={orderStatus}
                                onChange={(e) => setOrderStatus(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Payment Status */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Payment Status</label>
                            <select
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                                <option value="partially_refunded">Partially Refunded</option>
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="COD">COD (Cash on Delivery)</option>
                                <option value="UPI">UPI</option>
                                <option value="Wallet">Wallet</option>
                                <option value="Net_Banking">Net Banking</option>
                                <option value="Debit_Card">Debit Card</option>
                                <option value="Credit_Card">Credit Card</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleStatusSave}
                            disabled={savingStatus}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50 shadow-xs"
                        >
                            {savingStatus ? (
                                <>
                                    <FiRefreshCw className="animate-spin w-4 h-4" /> Saving...
                                </>
                            ) : (
                                'Save Status Changes'
                            )}
                        </button>
                    </div>
                </div>

                {/* ====== DETAILS 3-GRID ====== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <FiUser className="text-blue-600 w-4 h-4" /> Customer Information
                        </h3>
                        <div className="space-y-1 text-xs sm:text-sm">
                            <p className="font-semibold text-slate-900">
                                {order.user_id?.first_name} {order.user_id?.last_name || ''}
                            </p>
                            <p className="text-slate-500 font-mono">{order.user_id?.email || 'N/A'}</p>
                            <p className="text-slate-500">{order.user_id?.mobile_number || 'No phone number'}</p>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <FiMapPin className="text-blue-600 w-4 h-4" /> Shipping Address
                        </h3>
                        <div className="space-y-1 text-xs sm:text-sm">
                            <p className="font-semibold text-slate-900">{order.shipping_address?.full_name || 'N/A'}</p>
                            <p className="text-slate-600">
                                {[order.shipping_address?.house_number, order.shipping_address?.street].filter(Boolean).join(', ') || 'N/A'}
                            </p>
                            <p className="text-slate-600">
                                {[order.shipping_address?.city, order.shipping_address?.state].filter(Boolean).join(', ')}{' '}
                                {order.shipping_address?.pincode ? `- ${order.shipping_address.pincode}` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <FiCreditCard className="text-blue-600 w-4 h-4" /> Payment Summary
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.coupon_code && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Coupon ({order.coupon_code})</span>
                                    <span>-{formatCurrency(order.coupon_discount || order.platform_coupon_cost || 0)}</span>
                                </div>
                            )}
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>Delivery Fee</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(order.delivery_charge)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                                <span>Total Amount</span>
                                <span className="text-blue-600">{formatCurrency(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== ORDER ITEMS TABLE ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <FiPackage className="text-blue-600 w-4 h-4" /> Ordered Items ({order.order_items?.length || 0})
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="px-5 py-3.5 min-w-[260px]">Product</th>
                                    <th className="px-4 py-3.5 min-w-[140px]">Brand / Seller</th>
                                    <th className="px-4 py-3.5 min-w-[130px]">Product Code</th>
                                    <th className="px-4 py-3.5 text-center min-w-[80px]">Qty</th>
                                    <th className="px-4 py-3.5 text-right min-w-[110px]">Price</th>
                                    <th className="px-5 py-3.5 text-right min-w-[120px]">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {order.order_items?.length > 0 ? (
                                    order.order_items.map((item) => (
                                        <tr key={item._id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {item.product_image ? (
                                                        <img src={item.product_image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0" />
                                                    ) : item.product_id?.images?.[0] ? (
                                                        <img src={item.product_id.images[0]} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-semibold shrink-0">
                                                            No Img
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 max-w-sm">
                                                        <p className="font-semibold text-slate-900 truncate" title={item.product_name}>
                                                            {item.product_name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            {item.product_id?.category_id?.category_name || 'General Product'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 text-slate-700">
                                                {item.product_id?.brand || order.seller_id?.business_name || 'N/A'}
                                            </td>

                                            <td className="px-4 py-3.5">
                                                {item.product_id?.product_code ? (
                                                    <button
                                                        onClick={() => navigate(`/admin/products/${item.product_id.product_code}`)}
                                                        className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                                                    >
                                                        {item.product_id.product_code}
                                                        <FiExternalLink className="w-3 h-3" />
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400">N/A</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-center font-semibold text-slate-800">
                                                {item.quantity}
                                            </td>

                                            <td className="px-4 py-3.5 text-right font-medium text-slate-700">
                                                {formatCurrency(item.price)}
                                            </td>

                                            <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                                                {formatCurrency(item.total_price)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                                            No items recorded in this order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderDetails;