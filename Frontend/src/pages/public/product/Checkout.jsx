import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiMapPin,
    FiPlus,
    FiCheck,
    FiX,
    FiCreditCard,
    FiTruck,
    FiShoppingBag,
    FiArrowLeft,
    FiEdit2,
    FiTrash2,
    FiDollarSign,
    FiShield,
    FiHome,
    FiBriefcase,
    FiRadio,
    FiCheckCircle,
    FiLock
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const Checkout = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [cart, setCart] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [editingAddress, setEditingAddress] = useState(null);

    const [addressForm, setAddressForm] = useState({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        address_type: 'home',
        is_default: false,
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }
        loadCheckoutData();
    }, [isAuthenticated]);

    const loadCheckoutData = async () => {
        setLoading(true);
        try {
            // Load cart
            const cartResponse = await ApiService.getCart();
            if (cartResponse.data.success) {
                const cData = cartResponse.data.data;
                setCart(cData);
                if (!cData.items || cData.items.length === 0) {
                    toast.warning('Your cart is empty');
                    navigate('/cart');
                    return;
                }
            }

            // Load addresses
            const addressResponse = await ApiService.getAddresses();
            if (addressResponse.data.success) {
                const addrList = addressResponse.data.data || [];
                setAddresses(addrList);
                const defaultAddr = addrList.find((a) => a.is_default);
                if (defaultAddr) {
                    setSelectedAddress(defaultAddr);
                } else if (addrList.length > 0) {
                    setSelectedAddress(addrList[0]);
                }
            }
        } catch (error) {
            console.error('Failed to load checkout data:', error);
            toast.error(error.response?.data?.message || 'Failed to load checkout data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response;
            if (editingAddress) {
                response = await ApiService.updateAddress(editingAddress._id, addressForm);
                toast.success('Address updated!');
            } else {
                response = await ApiService.createAddress(addressForm);
                toast.success('Address added!');
            }

            if (response.data.success) {
                loadCheckoutData();
                resetAddressForm();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setAddressForm({
            full_name: address.full_name || '',
            phone: address.phone || '',
            address_line1: address.address_line1 || '',
            address_line2: address.address_line2 || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            country: address.country || 'India',
            address_type: address.address_type || 'home',
            is_default: address.is_default || false,
        });
        setShowAddressForm(true);
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Delete this address?')) return;

        try {
            const response = await ApiService.deleteAddress(addressId);
            if (response.data.success) {
                toast.success('Address deleted');
                loadCheckoutData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete address');
        }
    };

    const resetAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
            full_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
            phone: user?.mobile_number || '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
            address_type: 'home',
            is_default: false,
        });
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error('Please select or add a delivery address');
            return;
        }

        setPlacingOrder(true);
        try {
            const orderData = {
                address_id: selectedAddress._id,
                payment_method: paymentMethod,
            };

            const response = await ApiService.placeOrder(orderData);

            if (response.data.success) {
                const order = response.data.data;
                const orderId = order?._id || order?.id;
                toast.success('Order placed successfully! 🎉');

                if (paymentMethod === 'cod') {
                    navigate(`/orders/${orderId}`);
                } else {
                    const paymentResponse = await ApiService.initiatePayment({
                        orderId: orderId,
                        amount: cart.total_amount,
                        payment_method: paymentMethod,
                    });

                    if (paymentResponse.data.success && paymentResponse.data.data?.redirect_url) {
                        window.location.href = paymentResponse.data.data.redirect_url;
                    } else {
                        navigate(`/orders/${orderId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to place order:', error);
            toast.error(error.response?.data?.message || 'Failed to place order');
        } finally {
            setPlacingOrder(false);
        }
    };

    const getAddressIcon = (type) => {
        if (type === 'home') return <FiHome className="w-4 h-4 text-blue-600" />;
        if (type === 'work') return <FiBriefcase className="w-4 h-4 text-purple-600" />;
        return <FiMapPin className="w-4 h-4 text-emerald-600" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded-2xl w-48" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-4">
                            <div className="h-64 bg-slate-200 rounded-3xl" />
                            <div className="h-48 bg-slate-200 rounded-3xl" />
                        </div>
                        <div className="lg:col-span-4 h-96 bg-slate-200 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & HEADER ============ */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/cart')}
                        className="p-2.5 bg-white rounded-2xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5">
                            <Link to="/cart" className="hover:text-blue-600">Cart</Link>
                            <span>/</span>
                            <span className="text-slate-800 font-bold">Checkout</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Secure Order Checkout
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ===== LEFT: ADDRESS & PAYMENT (8 cols) ===== */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* ===== 1. DELIVERY ADDRESS SECTION ===== */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                        1
                                    </div>
                                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                                        Delivery Address
                                    </h2>
                                </div>
                                <button
                                    onClick={() => {
                                        resetAddressForm();
                                        setShowAddressForm(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                                >
                                    <FiPlus className="w-3.5 h-3.5" />
                                    Add New Address
                                </button>
                            </div>

                            {/* Saved Address Cards */}
                            {addresses.length === 0 && !showAddressForm ? (
                                <div className="text-center py-8 space-y-2">
                                    <p className="text-xs text-slate-500">No delivery address found</p>
                                    <button
                                        onClick={() => setShowAddressForm(true)}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        + Add your first delivery address
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {addresses.map((addr) => {
                                        const isSelected = selectedAddress?._id === addr._id;
                                        return (
                                            <div
                                                key={addr._id}
                                                onClick={() => setSelectedAddress(addr)}
                                                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                                                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                                                }`}
                                            >
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {getAddressIcon(addr.address_type)}
                                                            <span className="font-bold text-xs text-slate-900 capitalize">
                                                                {addr.full_name}
                                                            </span>
                                                        </div>
                                                        {addr.is_default && (
                                                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-slate-600 leading-relaxed">
                                                        {addr.address_line1}
                                                        {addr.address_line2 && `, ${addr.address_line2}`}
                                                        <br />
                                                        {addr.city}, {addr.state} - {addr.pincode}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-semibold pt-1">
                                                        📞 {addr.phone}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/60 text-xs">
                                                    <span className={`font-bold text-[11px] ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                                                        {isSelected ? '✓ Deliver to this Address' : 'Select'}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                                                            className="p-1 text-slate-400 hover:text-slate-700"
                                                        >
                                                            <FiEdit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        {!addr.is_default && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }}
                                                                className="p-1 text-slate-400 hover:text-rose-500"
                                                            >
                                                                <FiTrash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add/Edit Address Form Modal/Drawer */}
                            {showAddressForm && (
                                <form onSubmit={handleAddressSubmit} className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                                            {editingAddress ? 'Edit Address' : 'New Shipping Address'}
                                        </h3>
                                        <button onClick={resetAddressForm} className="text-slate-400 hover:text-slate-600">
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={addressForm.full_name}
                                                onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                value={addressForm.phone}
                                                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Flat, House no., Building, Apartment"
                                            value={addressForm.address_line1}
                                            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Area / Landmark (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="Area, Street, Sector, Village"
                                            value={addressForm.address_line2}
                                            onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                                            <input
                                                type="text"
                                                required
                                                value={addressForm.city}
                                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                                            <input
                                                type="text"
                                                required
                                                value={addressForm.state}
                                                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">Pincode</label>
                                            <input
                                                type="text"
                                                required
                                                value={addressForm.pincode}
                                                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                                        >
                                            {loading ? 'Saving…' : 'Save Address'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetAddressForm}
                                            className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* ===== 2. PAYMENT METHOD SECTION ===== */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                    2
                                </div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900">
                                    Payment Method
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { id: 'cod', label: 'Cash on Delivery (COD)', desc: 'Pay with cash upon delivery to your doorstep' },
                                    { id: 'upi', label: 'UPI / QR Code', desc: 'Instant payment via Google Pay, PhonePe, Paytm' },
                                    { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay, Maestro' },
                                    { id: 'netbanking', label: 'Net Banking', desc: 'All major Indian banks supported' },
                                ].map((m) => {
                                    const isSelected = paymentMethod === m.id;
                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => setPaymentMethod(m.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                                }`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs sm:text-sm text-slate-900">{m.label}</p>
                                                    <p className="text-[11px] text-slate-500">{m.desc}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <FiCheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* ===== RIGHT: ORDER SUMMARY (4 cols) ===== */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 sticky top-24">
                            <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
                                Order Summary
                            </h2>

                            {/* Item thumbnails drawer */}
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                {cart?.items?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-xs">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 flex-shrink-0">
                                            <img
                                                src={item.productImage || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                                                alt={item.productName}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                                            <p className="text-slate-400">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-bold text-slate-900">
                                            ₹{(Number(item.finalPrice || item.price) * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-slate-900">₹{(Number(cart?.subtotal || cart?.total_amount || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="font-bold text-emerald-600">FREE</span>
                                </div>
                                {Number(cart?.discount || 0) > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Discount</span>
                                        <span>-₹{Number(cart.discount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-slate-900">
                                    <span className="text-sm font-black">Total Amount</span>
                                    <span className="text-2xl font-black text-blue-600">
                                        ₹{(Number(cart?.total_amount || cart?.subtotal || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Place Order CTA */}
                            <button
                                onClick={handlePlaceOrder}
                                disabled={placingOrder || !selectedAddress}
                                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <FiLock className="w-4 h-4" />
                                {placingOrder ? 'Processing Order…' : 'Place Order & Pay'}
                            </button>

                            {!selectedAddress && (
                                <p className="text-[11px] font-bold text-rose-500 text-center">
                                    Please select or create a delivery address to proceed.
                                </p>
                            )}

                            {/* Assurance */}
                            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400 pt-2">
                                <FiShield className="text-emerald-500" />
                                <span>100% Safe & Secure Purchase Guarantee</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Checkout;
