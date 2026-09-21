import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiLoader, FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle,
    FiUser, FiMapPin, FiCreditCard, FiSave,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const STATUS_CONFIG = {
    pending:          { label: 'Pending',          bg: 'bg-amber-50 text-amber-700 ring-amber-200',     icon: FiClock },
    confirmed:        { label: 'Confirmed',        bg: 'bg-blue-50 text-blue-700 ring-blue-200',         icon: FiCheckCircle },
    packed:           { label: 'Packed',           bg: 'bg-indigo-50 text-indigo-700 ring-indigo-200',   icon: FiPackage },
    shipped:          { label: 'Shipped',          bg: 'bg-cyan-50 text-cyan-700 ring-cyan-200',         icon: FiTruck },
    out_for_delivery: { label: 'Out for Delivery', bg: 'bg-teal-50 text-teal-700 ring-teal-200',         icon: FiTruck },
    delivered:        { label: 'Delivered',        bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: FiCheckCircle },
    cancelled:        { label: 'Cancelled',        bg: 'bg-rose-50 text-rose-700 ring-rose-200',         icon: FiXCircle },
    returned:         { label: 'Returned',         bg: 'bg-slate-100 text-slate-600 ring-slate-200',     icon: FiXCircle },
};

const formatCurrency = (v) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const SellerOrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [trackingId, setTrackingId] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => { fetchOrder(); }, [orderId]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerMyOrderDetails(orderId);
            if (res?.data?.success) {
                const o = res.data.data;
                setOrder(o);
                setNewStatus(o.order_status || o.status || 'pending');
            } else {
                toast.error('Order not found');
            }
        } catch (err) {
            console.error('Order details error:', err);
            toast.error('Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!newStatus) return;
        setUpdating(true);
        try {
            const payload = {
                status: newStatus,
                notes: statusNotes || undefined,
                tracking_id: trackingId || undefined,
            };
            const res = await ApiService.updateOrderStatusBySeller(orderId, payload);
            if (res?.data?.success) {
                toast.success(`Order status updated to ${newStatus}`);
                fetchOrder();
                setStatusNotes('');
                setTrackingId('');
            } else {
                toast.error(res?.data?.message || 'Update failed');
            }
        } catch (err) {
            console.error('Status update error:', err);
            toast.error(err?.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <FiLoader className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-500">Order not found.</p>
                <button onClick={() => navigate('/seller/orders')} className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
                    Back to Orders
                </button>
            </div>
        );
    }

    const currentStatus = order.order_status || order.status || 'pending';
    const currentIdx = STATUS_FLOW.indexOf(currentStatus);
    const isFinal = ['delivered', 'cancelled', 'returned'].includes(currentStatus);
    const availableStatuses = isFinal ? [] : STATUS_FLOW.slice(currentIdx + 1);

    const items = order.items || order.order_items || [];
    const customer = order.user || order.customer || {};
    const address = order.shipping_address || order.address || {};

    return (
        <div className="space-y-6">
            <AdminTopbar
                title={`Order #${order.order_number || order.order_id || order._id?.slice(-6)?.toUpperCase()}`}
                subtitle={`Placed on ${order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}`}
                actions={
                    <button onClick={() => navigate('/seller/orders')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                        <FiArrowLeft className="h-4 w-4" /><span>All Orders</span>
                    </button>
                }
            />

            {/* Status Timeline */}
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4">Order Progress</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {STATUS_FLOW.map((s, idx) => {
                        const meta = STATUS_CONFIG[s];
                        const Icon = meta.icon;
                        const isActive = idx <= currentIdx;
                        const isCurrent = s === currentStatus;
                        return (
                            <React.Fragment key={s}>
                                <div className={`flex flex-col items-center min-w-[80px] ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isCurrent ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md' : isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>{meta.label}</span>
                                </div>
                                {idx < STATUS_FLOW.length - 1 && (
                                    <div className={`flex-1 h-0.5 min-w-[20px] ${idx < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                {isFinal && (
                    <div className="mt-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${STATUS_CONFIG[currentStatus]?.bg}`}>
                            {STATUS_CONFIG[currentStatus]?.label}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Order Items */}
                <div className="lg:col-span-2 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Order Items</h3>
                    {items.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 py-3">
                                    <div className="h-14 w-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {item.product?.images?.[0]?.url || item.image ? (
                                            <img src={item.product?.images?.[0]?.url || item.image} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <FiPackage className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 truncate">{item.product_name || item.product?.product_name || item.name || 'Product'}</p>
                                        <p className="text-xs text-slate-400">Qty: {item.quantity || 1} × {formatCurrency(item.price || item.unit_price)}</p>
                                    </div>
                                    <span className="font-bold text-blue-700">{formatCurrency((item.quantity || 1) * (item.price || item.unit_price || 0))}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">No items found.</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">Order Total</span>
                        <span className="text-lg font-extrabold text-blue-700">{formatCurrency(order.total_amount || order.total)}</span>
                    </div>
                </div>

                {/* Sidebar: Customer, Address, Status Update */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FiUser className="text-sky-600" />Customer</h3>
                        <p className="text-sm font-medium text-slate-700">{customer.first_name} {customer.last_name}</p>
                        <p className="text-xs text-slate-400">{customer.email}</p>
                        <p className="text-xs text-slate-400">{customer.mobile_number || customer.phone || ''}</p>
                    </div>

                    {/* Address */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FiMapPin className="text-sky-600" />Shipping Address</h3>
                        <p className="text-sm text-slate-600">{address.address_line_1 || address.street || address.line1 || '—'}</p>
                        {address.address_line_2 && <p className="text-sm text-slate-600">{address.address_line_2}</p>}
                        <p className="text-sm text-slate-600">{address.city}{address.state ? `, ${address.state}` : ''} {address.postal_code || address.pincode || ''}</p>
                    </div>

                    {/* Payment */}
                    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FiCreditCard className="text-sky-600" />Payment</h3>
                        <p className="text-sm text-slate-600 capitalize">{order.payment_method || order.payment_type || 'COD'}</p>
                        <p className="text-xs text-slate-400 capitalize">Status: {order.payment_status || 'pending'}</p>
                    </div>

                    {/* Status Update */}
                    {!isFinal && availableStatuses.length > 0 && (
                        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-slate-800">Update Order Status</h3>
                            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none">
                                <option value={currentStatus}>{STATUS_CONFIG[currentStatus]?.label} (current)</option>
                                {availableStatuses.map((s) => (<option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>))}
                                <option value="cancelled">Cancelled</option>
                            </select>
                            {(newStatus === 'shipped' || newStatus === 'out_for_delivery') && (
                                <input type="text" placeholder="Tracking ID (optional)"
                                    value={trackingId} onChange={(e) => setTrackingId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none" />
                            )}
                            <textarea placeholder="Notes (optional)" rows={2}
                                value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none" />
                            <button onClick={handleStatusUpdate} disabled={updating || newStatus === currentStatus}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-sky-600 hover:to-blue-700 disabled:opacity-50">
                                <FiSave className="h-4 w-4" />{updating ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerOrderDetails;
