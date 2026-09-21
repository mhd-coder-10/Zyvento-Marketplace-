import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiHeart,
    FiShoppingCart,
    FiX,
    FiTrash2,
    FiStar,
    FiShoppingBag,
    FiChevronLeft,
    FiChevronRight,
    FiArrowRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        loadWishlist();
    }, [pagination.page]);

    const loadWishlist = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getWishlist({
                page: pagination.page,
                limit: pagination.limit,
            });

            if (response.data.success) {
                const list = response.data.data.wishlist || response.data.data.items || response.data.data || [];
                setWishlist(list);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || list.length,
                    pages: response.data.data.pages || Math.ceil((response.data.data.total || list.length) / prev.limit) || 1,
                }));
            }
        } catch (error) {
            console.error('Failed to load wishlist:', error);
            toast.error(error.response?.data?.message || 'Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (productId) => {
        setActionLoading(productId);
        try {
            const response = await ApiService.removeFromWishlist(productId);
            if (response.data.success) {
                toast.success('Removed from Wishlist');
                setWishlist(prev => prev.filter(item => (item.productId || item._id || item.product?._id) !== productId));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove item');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMoveToCart = async (productId) => {
        setActionLoading(productId);
        try {
            const response = await ApiService.moveToCart(productId, { quantity: 1 });
            if (response.data.success) {
                toast.success('Moved to Cart!');
                setWishlist(prev => prev.filter(item => (item.productId || item._id || item.product?._id) !== productId));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to move to cart');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & HEADER ============ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5">
                            <Link to="/" className="hover:text-blue-600">Home</Link>
                            <span>/</span>
                            <span className="text-slate-800 font-bold">My Wishlist</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Saved Items ({wishlist.length})
                        </h1>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 self-start sm:self-auto"
                    >
                        Explore More Deals <FiArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* ============ WISHLIST GRID ============ */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-4 border border-slate-200/80 animate-pulse space-y-3">
                                <div className="aspect-square bg-slate-200 rounded-2xl" />
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-5 bg-slate-200 rounded w-1/2" />
                                <div className="h-10 bg-slate-200 rounded-2xl w-full" />
                            </div>
                        ))}
                    </div>
                ) : wishlist.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
                        <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-4xl font-bold mx-auto shadow-md shadow-rose-500/10">
                            <FiHeart />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Your Wishlist is Empty</h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                            Save products you're interested in by tapping the heart icon on any product page.
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/25 hover:bg-blue-700 transition-all"
                        >
                            <FiShoppingBag className="w-4 h-4" />
                            Start Exploring
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {wishlist.map(item => {
                                const pid = item.productId || item.product?._id || item._id;
                                const name = item.productName || item.product?.product_name || item.name || 'Product';
                                const img = item.productImage || item.product?.images?.[0]?.url || item.product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                                const finalP = Number(item.finalPrice || item.product?.final_price || item.price || 0);
                                const origP = Number(item.price || item.product?.price || finalP);
                                const discount = Number(item.discount || (origP > finalP ? Math.round(((origP - finalP) / origP) * 100) : 0));

                                return (
                                    <div
                                        key={pid}
                                        className="group relative bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden p-4"
                                    >
                                        {/* Product Thumbnail */}
                                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center">
                                            <Link to={`/products/${pid}`} className="w-full h-full p-3 flex items-center justify-center">
                                                <img
                                                    src={img}
                                                    alt={name}
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </Link>

                                            {discount > 0 && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-sm">
                                                    {discount}% OFF
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleRemoveFromWishlist(pid)}
                                                disabled={actionLoading === pid}
                                                className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-sm text-slate-400 hover:text-rose-600 hover:bg-white transition-all active:scale-90"
                                                title="Remove"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-1">
                                            {item.brand && (
                                                <span className="text-[10px] font-black uppercase text-blue-600">
                                                    {item.brand}
                                                </span>
                                            )}
                                            <Link to={`/products/${pid}`}>
                                                <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                                    {name}
                                                </h3>
                                            </Link>

                                            {/* Price */}
                                            <div className="flex items-baseline gap-2 pt-1">
                                                <span className="text-base sm:text-lg font-black text-slate-900">
                                                    ₹{finalP.toFixed(2)}
                                                </span>
                                                {origP > finalP && (
                                                    <span className="text-xs text-slate-400 line-through">
                                                        ₹{origP.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Move to Cart CTA */}
                                        <div className="pt-3 mt-2 border-t border-slate-100">
                                            <button
                                                onClick={() => handleMoveToCart(pid)}
                                                disabled={actionLoading === pid}
                                                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <FiShoppingCart className="w-3.5 h-3.5" />
                                                {actionLoading === pid ? 'Moving…' : 'Move to Cart'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-8">
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page <= 1}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40"
                                >
                                    <FiChevronLeft className="inline mr-1" /> Prev
                                </button>
                                <span className="text-xs font-bold text-slate-600 px-3">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page >= pagination.pages}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40"
                                >
                                    Next <FiChevronRight className="inline ml-1" />
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
};

export default Wishlist;
