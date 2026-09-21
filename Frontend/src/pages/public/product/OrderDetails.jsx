import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiPackage,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiTruck,
    FiMapPin,
    FiCreditCard,
    FiCalendar,
    FiArrowLeft,
    FiPrinter,
    FiDownload,
    FiRefreshCw,
    FiShoppingBag,
    FiAlertCircle,
    FiPhone,
    FiMail,
    FiTag,
    FiFileText,
    FiHelpCircle,
    FiCheck
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [returning, setReturning] = useState(false);

    useEffect(() => {
        if (orderId) {
            loadOrderDetails();
        }
    }, [orderId]);

    const loadOrderDetails = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getCustomerOrderDetails(orderId);
            if (response.data.success) {
                setOrder(response.data.data.order || response.data.data);
            } else {
                toast.error('Order not found');
                navigate('/orders');
            }
        } catch (error) {
            console.error('Failed to load order details:', error);
            toast.error(error.response?.data?.message || 'Failed to load order details');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        setCancelling(true);
        try {
            const response = await ApiService.cancelOrder(orderId, {
                reason: 'Customer requested cancellation'
            });

            if (response.data.success) {
                toast.success('Order cancelled successfully');
                loadOrderDetails();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setCancelling(false);
        }
    };

    const handleRequestReturn = async () => {
        if (!window.confirm('Request a return for this delivered order?')) return;

        setReturning(true);
        try {
            const response = await ApiService.requestReturn(orderId, {
                reason: 'Customer requested return'
            });

            if (response.data.success) {
                toast.success('Return request submitted!');
                loadOrderDetails();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request return');
        } finally {
            setReturning(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusBadgeStyles = {
        placed: 'bg-amber-50 text-amber-700 border-amber-200',
        processing: 'bg-blue-50 text-blue-700 border-blue-200',
        shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
        returned: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const steps = ['placed', 'processing', 'shipped', 'delivered'];
    const currentStatus = order?.status || 'placed';
    const isCancelled = currentStatus === 'cancelled';
    const isReturned = currentStatus === 'returned';

    const getStepIndex = () => {
        if (currentStatus === 'placed') return 0;
        if (currentStatus === 'processing') return 1;
        if (currentStatus === 'shipped') return 2;
        if (currentStatus === 'delivered') return 3;
        return 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded-2xl w-48" />
                    <div className="h-48 bg-slate-200 rounded-3xl" />
                    <div className="h-64 bg-slate-200 rounded-3xl" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-16 px-4 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl font-bold">
                    <FiAlertCircle />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Order Not Found</h2>
                <Link
                    to="/orders"
                    className="px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl"
                >
                    Back to Orders
                </Link>
            </div>
        );
    }

    const orderNum = order.order_number || order._id;
    const shippingAddr = order.shipping_address || {};

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & ACTIONS ============ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/orders"
                            className="p-2.5 bg-white rounded-2xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5">
                                <Link to="/orders" className="hover:text-blue-600">My Orders</Link>
                                <span>/</span>
                                <span className="text-slate-800 font-bold">#{orderNum}</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                                Order Details
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                            <FiPrinter className="w-3.5 h-3.5 text-blue-600" />
                            Print Receipt
                        </button>
                    </div>
                </div>

                {/* ============ ORDER STATUS CARD ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-lg font-black text-slate-900">
                                    Order #{orderNum}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                    statusBadgeStyles[currentStatus] || 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                    {currentStatus}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Placed on {formatDate(order.created_at || order.createdAt)}
                            </p>
                        </div>

                        {/* Order Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {currentStatus === 'placed' && (
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={cancelling}
                                    className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50"
                                >
                                    {cancelling ? 'Cancelling…' : 'Cancel Order'}
                                </button>
                            )}
                            {currentStatus === 'delivered' && (
                                <button
                                    onClick={handleRequestReturn}
                                    disabled={returning}
                                    className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-600 font-bold text-xs rounded-xl hover:bg-purple-100 transition-all disabled:opacity-50"
                                >
                                    {returning ? 'Submitting…' : 'Request Return'}
                                </button>
                            )}
                            <Link
                                to="/help-center"
                                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Need Help?
                            </Link>
                        </div>
                    </div>

                    {/* Progress Stepper (if not cancelled/returned) */}
                    {!isCancelled && !isReturned && (
                        <div className="py-2">
                            <div className="grid grid-cols-4 gap-2 relative">
                                {steps.map((st, idx) => {
                                    const activeIdx = getStepIndex();
                                    const isDone = idx <= activeIdx;
                                    const isCurrent = idx === activeIdx;

                                    return (
                                        <div key={st} className="flex flex-col items-center text-center space-y-2">
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                                                isDone
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                                    : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {isDone ? <FiCheck className="w-4 h-4" /> : idx + 1}
                                            </div>
                                            <span className={`text-[11px] sm:text-xs font-bold capitalize ${
                                                isCurrent ? 'text-blue-600' : isDone ? 'text-slate-900' : 'text-slate-400'
                                            }`}>
                                                {st}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {isCancelled && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-semibold">
                            <FiXCircle className="w-5 h-5 flex-shrink-0" />
                            <span>This order was cancelled. If you were charged, a full refund will be initiated to your source account.</span>
                        </div>
                    )}
                </div>

                {/* ============ ORDER ITEMS ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
                    <h3 className="text-base font-black text-slate-900">
                        Itemized Package Breakdown
                    </h3>

                    <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-100 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                                        <img
                                            src={item.productImage || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160'}
                                            alt={item.productName}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <Link to={`/products/${item.productId || item._id}`}>
                                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600 line-clamp-1">
                                                {item.productName || item.name}
                                            </h4>
                                        </Link>
                                        <p className="text-xs text-slate-500">
                                            Qty: <span className="font-bold text-slate-700">{item.quantity}</span> × ₹{Number(item.price || item.finalPrice || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right sm:self-center self-end">
                                    <span className="text-sm sm:text-base font-black text-slate-900">
                                        ₹{(Number(item.price || item.finalPrice || 0) * Number(item.quantity || 1)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ============ ADDRESS, PAYMENT & SUMMARY GRID ============ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Shipping Address */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                            <FiMapPin className="text-blue-600 w-4 h-4" />
                            <h3 className="font-bold text-sm text-slate-900">Shipping Address</h3>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
                            <p className="font-black text-slate-900">{typeof shippingAddr === 'string' ? shippingAddr : shippingAddr.full_name || user?.first_name || 'Customer'}</p>
                            {typeof shippingAddr !== 'string' && (
                                <>
                                    <p>{shippingAddr.address_line1} {shippingAddr.address_line2}</p>
                                    <p>{shippingAddr.city}, {shippingAddr.state} - {shippingAddr.pincode}</p>
                                    <p className="text-slate-500 pt-1">📞 {shippingAddr.phone || user?.mobile_number}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Order Financials Summary */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-3">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                            <FiFileText className="text-blue-600 w-4 h-4" />
                            <h3 className="font-bold text-sm text-slate-900">Payment & Pricing Breakdown</h3>
                        </div>
                        <div className="space-y-2 text-xs font-semibold text-slate-600">
                            <div className="flex justify-between">
                                <span>Payment Method:</span>
                                <span className="font-bold text-slate-900 uppercase">{order.payment_method || 'COD'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payment Status:</span>
                                <span className="font-bold text-emerald-600 capitalize">{order.payment_status || 'Completed'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-bold text-slate-900">₹{Number(order.subtotal || order.total_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Charges:</span>
                                <span className="font-bold text-emerald-600">FREE</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline text-slate-900">
                                <span className="font-black text-sm">Total Paid</span>
                                <span className="text-xl font-black text-blue-600">
                                    ₹{Number(order.total_amount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default OrderDetails;
