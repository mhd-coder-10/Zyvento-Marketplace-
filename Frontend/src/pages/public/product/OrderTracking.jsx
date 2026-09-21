import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiSearch,
    FiCheckCircle,
    FiClock,
    FiPackage,
    FiTruck,
    FiAlertCircle,
    FiChevronRight,
    FiMail,
    FiMapPin,
    FiShield,
    FiHelpCircle
} from 'react-icons/fi';

const OrderTracking = () => {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [error, setError] = useState('');

    const handleTrackOrder = (e) => {
        e.preventDefault();
        if (!orderId.trim()) {
            setError('Please enter your order ID');
            return;
        }
        setLoading(true);
        setError('');
        setOrderStatus(null);

        setTimeout(() => {
            setOrderStatus({
                orderId: orderId,
                status: 'shipped',
                placedDate: '2024-08-10',
                estimatedDelivery: '2024-08-15',
                items: [
                    { name: 'Wireless Noise Cancelling Headphones', quantity: 1, image: '🎧' },
                    { name: 'USB-C Charging Cable (2-Pack)', quantity: 2, image: '🔌' },
                ],
                tracking: [
                    { date: 'Aug 10', time: '10:30 AM', status: 'placed', location: 'Order Confirmed', description: 'Your order has been confirmed and payment verified successfully.' },
                    { date: 'Aug 11', time: '02:15 PM', status: 'processing', location: 'Zyvento Warehouse, Mumbai', description: 'Items packed securely with tamper-evident seals.' },
                    { date: 'Aug 12', time: '09:00 AM', status: 'shipped', location: 'Dispatched via BlueDart', description: 'Shipment AWB #BD7829341 — in transit to regional hub.' },
                    { date: 'Aug 13', time: '11:30 AM', status: 'intransit', location: 'Transit Hub, Delhi NCR', description: 'Package arrived at Delhi sorting facility. Out for local delivery soon.' },
                ],
                deliveryAddress: '42, Sector 15, Noida, Uttar Pradesh – 201301',
                courier: 'BlueDart Express',
                awb: 'BD7829341',
            });
            setLoading(false);
        }, 1500);
    };

    const statusSteps = ['placed', 'processing', 'shipped', 'intransit', 'delivered'];
    const statusLabels = { placed: 'Placed', processing: 'Packed', shipped: 'Shipped', intransit: 'In Transit', delivered: 'Delivered' };

    const getActiveIndex = (status) => {
        const map = { placed: 0, processing: 1, shipped: 2, intransit: 3, delivered: 4 };
        return map[status] ?? 0;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiTruck className="text-sm text-indigo-400" />
                        Real-Time Shipment Tracker
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Track Your Order
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
                        Enter your order ID to get live courier updates, estimated delivery date, and milestone history.
                    </p>
                </div>
            </section>

            {/* ============ TRACKING FORM ============ */}
            <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                    <form onSubmit={handleTrackOrder} className="space-y-4">
                        <label htmlFor="orderId" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Order ID or AWB Number
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                                <input
                                    type="text"
                                    id="orderId"
                                    placeholder="e.g. ORD-123456 or AWB BD7829341"
                                    value={orderId}
                                    onChange={(e) => { setOrderId(e.target.value); setError(''); }}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-60 whitespace-nowrap flex items-center gap-2"
                            >
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Tracking...</>
                                ) : (
                                    <><FiSearch /> Track</>
                                )}
                            </button>
                        </div>
                        {error && (
                            <p className="text-rose-500 text-xs font-medium flex items-center gap-1.5 mt-1">
                                <FiAlertCircle className="text-sm" /> {error}
                            </p>
                        )}
                    </form>

                    <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <FiHelpCircle className="text-indigo-500 text-lg mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-slate-500">
                            <span className="font-bold text-slate-700">Where to find your Order ID?</span>
                            <br />
                            Check your order confirmation email, SMS, or go to <Link to="/orders" className="text-indigo-600 font-semibold hover:underline">My Orders</Link> in your account.
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ ORDER STATUS RESULTS ============ */}
            {orderStatus && (
                <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-6">

                    {/* Progress Bar */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Order ID</p>
                                <p className="text-xl font-extrabold text-slate-900 font-mono">{orderStatus.orderId}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Carrier</p>
                                    <p className="text-xs font-bold text-slate-900">{orderStatus.courier}</p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Est. Delivery</p>
                                    <p className="text-xs font-bold text-emerald-700">{orderStatus.estimatedDelivery}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Step Bar */}
                        <div className="relative">
                            <div className="flex items-center justify-between relative z-10">
                                {statusSteps.map((step, idx) => {
                                    const active = idx <= getActiveIndex(orderStatus.status);
                                    const current = idx === getActiveIndex(orderStatus.status);
                                    return (
                                        <div key={step} className="flex flex-col items-center flex-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                                                current ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' :
                                                active ? 'bg-indigo-600 border-indigo-600 text-white' :
                                                'bg-slate-100 border-slate-200 text-slate-400'
                                            }`}>
                                                {active ? <FiCheckCircle /> : <FiClock />}
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${
                                                active ? 'text-indigo-600' : 'text-slate-400'
                                            }`}>
                                                {statusLabels[step]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Connecting Line */}
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 z-0">
                                <div
                                    className="h-full bg-indigo-600 transition-all duration-700"
                                    style={{ width: `${(getActiveIndex(orderStatus.status) / (statusSteps.length - 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timeline & Items */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Timeline */}
                        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Shipment Timeline</h3>
                            <div className="space-y-0">
                                {orderStatus.tracking.map((event, index) => (
                                    <div key={index} className="flex gap-4">
                                        {/* Timeline Dot & Line */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                                index === 0 ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white border-slate-300'
                                            }`} />
                                            {index < orderStatus.tracking.length - 1 && (
                                                <div className="w-0.5 h-full min-h-[48px] bg-slate-200" />
                                            )}
                                        </div>
                                        {/* Content */}
                                        <div className="pb-6">
                                            <p className="font-bold text-slate-900 text-sm">{event.description}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{event.location}</p>
                                            <p className="text-[11px] text-slate-400 mt-1 font-mono">{event.date} • {event.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar: Items + Address */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Items Ordered */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Items in this Shipment</h4>
                                <div className="space-y-3">
                                    {orderStatus.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <span className="text-2xl">{item.image}</span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{item.name}</p>
                                                <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FiMapPin className="text-indigo-600" /> Delivery Address
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{orderStatus.deliveryAddress}</p>
                            </div>

                            {/* Need Help */}
                            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-900/40">
                                <h4 className="text-sm font-bold text-white mb-2">Need help with this delivery?</h4>
                                <p className="text-xs text-slate-300 mb-4">Our logistics team can resolve issues fast.</p>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all"
                                >
                                    <FiMail /> Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ============ HELP BANNER ============ */}
            {!orderStatus && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-10">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0">
                                    <FiPackage />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Real-Time Updates</h4>
                                    <p className="text-xs text-slate-500 mt-1">Get milestone-by-milestone tracking from warehouse to your door.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
                                    <FiShield />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Safe & Secure Delivery</h4>
                                    <p className="text-xs text-slate-500 mt-1">OTP-verified handover and tamper-evident packaging.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
                                    <FiClock />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">On-Time Guarantee</h4>
                                    <p className="text-xs text-slate-500 mt-1">Delivery within estimated window or shipping fee reimbursed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default OrderTracking;
