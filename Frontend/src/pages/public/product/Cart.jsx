import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiShoppingCart,
    FiPlus,
    FiMinus,
    FiX,
    FiTrash2,
    FiTag,
    FiArrowLeft,
    FiShoppingBag,
    FiTruck,
    FiShield,
    FiCheckCircle,
    FiArrowRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const Cart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getCart();
            if (response.data.success) {
                setCart(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
            toast.error(error.response?.data?.message || 'Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (productId, quantity) => {
        if (quantity < 1) return;
        setUpdating(true);

        try {
            const response = await ApiService.updateCartItem(productId, { quantity });
            if (response.data.success) {
                setCart(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update quantity');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            const response = await ApiService.removeFromCart(productId);
            if (response.data.success) {
                toast.success('Item removed from cart');
                setCart(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove item');
        }
    };

    const handleClearCart = async () => {
        if (!window.confirm('Are you sure you want to clear your entire cart?')) return;

        try {
            const response = await ApiService.clearCart();
            if (response.data.success) {
                toast.success('Cart cleared');
                setCart(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to clear cart');
        }
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        try {
            const response = await ApiService.applyCoupon({ code: couponCode.trim().toUpperCase() });
            if (response.data.success) {
                toast.success('Coupon applied successfully!');
                setCart(response.data.data);
                setCouponCode('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or expired coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = async () => {
        try {
            const response = await ApiService.removeCoupon();
            if (response.data.success) {
                toast.success('Coupon removed');
                setCart(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove coupon');
        }
    };

    const handleCheckout = () => {
        if (!cart?.items || cart.items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        navigate('/checkout');
    };

    const subtotal = Number(cart?.subtotal || cart?.total_amount || 0);
    const freeDeliveryThreshold = 999;
    const progressToFreeDelivery = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
    const amountLeftForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded-2xl w-48" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 bg-slate-200 rounded-3xl" />
                            ))}
                        </div>
                        <div className="lg:col-span-4 h-80 bg-slate-200 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-16 px-4 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl font-bold shadow-md shadow-blue-500/10">
                    <FiShoppingCart />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Your Shopping Cart is Empty</h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                    Looks like you haven't added anything to your cart yet. Explore thousands of deals today!
                </p>
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 transition-all"
                >
                    <FiShoppingBag className="w-4 h-4" />
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & HEADER ============ */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5">
                            <Link to="/" className="hover:text-blue-600">Home</Link>
                            <span>/</span>
                            <span className="text-slate-800 font-bold">Shopping Cart</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Shopping Cart ({cart.items.length} {cart.items.length === 1 ? 'item' : 'items'})
                        </h1>
                    </div>

                    <button
                        onClick={handleClearCart}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-all border border-rose-200"
                    >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        Clear Cart
                    </button>
                </div>

                {/* ============ FREE DELIVERY PROGRESS BAR ============ */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-slate-700">
                            <FiTruck className="text-blue-600 w-4 h-4" />
                            {amountLeftForFreeDelivery === 0 ? (
                                <span className="text-emerald-600 font-black">🎉 You've unlocked FREE Delivery!</span>
                            ) : (
                                <span>Add <span className="text-blue-600 font-black">₹{amountLeftForFreeDelivery.toFixed(2)}</span> more for FREE delivery</span>
                            )}
                        </span>
                        <span className="text-slate-400">{progressToFreeDelivery}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressToFreeDelivery}%` }}
                        />
                    </div>
                </div>

                {/* ============ MAIN CART GRID ============ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ===== CART ITEMS (8 cols) ===== */}
                    <div className="lg:col-span-8 space-y-4">
                        {cart.items.map((item, idx) => {
                            const pid = item.productId || item._id;
                            const img = item.productImage || item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                            const finalP = Number(item.finalPrice || item.final_price || item.price || 0);
                            const origP = Number(item.price || finalP);
                            const discount = Number(item.discount || (origP > finalP ? Math.round(((origP - finalP) / origP) * 100) : 0));

                            return (
                                <div
                                    key={pid || idx}
                                    className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 transition-all hover:border-slate-300"
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                        {/* Product Thumbnail */}
                                        <Link to={`/products/${pid}`} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex-shrink-0 flex items-center justify-center">
                                            <img
                                                src={img}
                                                alt={item.productName || 'Product'}
                                                className="w-full h-full object-contain"
                                            />
                                        </Link>

                                        {/* Product Details */}
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            {item.brand && (
                                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {item.brand}
                                                </span>
                                            )}
                                            <Link to={`/products/${pid}`}>
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2">
                                                    {item.productName || item.name}
                                                </h3>
                                            </Link>

                                            {/* Price block */}
                                            <div className="flex items-baseline gap-2 pt-1">
                                                <span className="text-lg sm:text-xl font-black text-slate-900">
                                                    ₹{finalP.toFixed(2)}
                                                </span>
                                                {origP > finalP && (
                                                    <span className="text-xs text-slate-400 line-through font-semibold">
                                                        ₹{origP.toFixed(2)}
                                                    </span>
                                                )}
                                                {discount > 0 && (
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        {discount}% OFF
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity Stepper & Remove */}
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                                            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1">
                                                <button
                                                    onClick={() => handleUpdateQuantity(pid, item.quantity - 1)}
                                                    disabled={updating || item.quantity <= 1}
                                                    className="p-1.5 text-slate-600 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                                >
                                                    <FiMinus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center font-bold text-xs text-slate-900">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(pid, item.quantity + 1)}
                                                    disabled={updating}
                                                    className="p-1.5 text-slate-600 hover:text-blue-600 transition-colors"
                                                >
                                                    <FiPlus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveItem(pid)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Continue Shopping Link */}
                        <div className="pt-2">
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* ===== ORDER SUMMARY SIDEBAR (4 cols) ===== */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 sticky top-24">
                            <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
                                Order Summary
                            </h2>

                            {/* Price Breakdown */}
                            <div className="space-y-3 text-xs font-semibold text-slate-600">
                                <div className="flex justify-between">
                                    <span>Items Subtotal</span>
                                    <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span>Delivery Charges</span>
                                    <span className={subtotal >= freeDeliveryThreshold ? 'text-emerald-600 font-bold' : 'text-slate-900 font-bold'}>
                                        {subtotal >= freeDeliveryThreshold ? 'FREE' : '₹99.00'}
                                    </span>
                                </div>

                                {Number(cart.discount || 0) > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Coupon Discount</span>
                                        <span className="font-bold">-₹{Number(cart.discount).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-slate-900">
                                    <span className="text-sm font-black">Total Payable</span>
                                    <span className="text-2xl font-black text-blue-600">
                                        ₹{(Number(cart.total_amount || subtotal)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Coupon Apply Drawer */}
                            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Have a Promo Coupon?
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="E.g. ZYVENTO10"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={couponLoading}
                                        className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                                    >
                                        {couponLoading ? '…' : 'Apply'}
                                    </button>
                                </div>

                                {cart.coupon_code && (
                                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold mt-2">
                                        <span className="flex items-center gap-1.5">
                                            <FiTag />
                                            "{cart.coupon_code}" Applied
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveCoupon}
                                            className="text-rose-500 hover:text-rose-700"
                                        >
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </form>

                            {/* Checkout CTA */}
                            <button
                                onClick={handleCheckout}
                                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                Proceed to Checkout
                                <FiArrowRight className="w-4 h-4" />
                            </button>

                            {/* Assurances */}
                            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
                                <FiShield className="text-emerald-500" />
                                <span>256-bit SSL Encrypted Checkout</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Cart;
