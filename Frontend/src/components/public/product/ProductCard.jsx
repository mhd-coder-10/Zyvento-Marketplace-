import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiHeart, FiShoppingCart, FiStar, FiEye, FiCheck,
    FiTrendingUp, FiShoppingBag, FiTruck
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const ProductCard = ({ product, viewMode = 'grid', onUpdate }) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [addingToCart, setAddingToCart] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const productId = product?._id || product?.id;

    // Resolve product fields safely across schemas
    const title = product?.product_name || product?.name || 'Product';
    const brand = product?.brand || '';
    const price = product?.final_price ?? product?.finalPrice ?? product?.price ?? 0;
    const mrp = product?.price ?? product?.mrp ?? price;
    const discount = product?.discount_percent ?? product?.discount ?? (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
    const stock = product?.stock ?? product?.quantity ?? 10;
    const rating = product?.rating ?? product?.average_rating ?? 4.5;
    const totalReviews = product?.total_reviews ?? product?.totalReviews ?? product?.reviews_count ?? 12;

    const rawImages = product?.images || (product?.image ? [product?.image] : []);
    const imageUrl = (rawImages[0]?.url || rawImages[0] || '').trim();
    const secondaryImageUrl = (rawImages[1]?.url || rawImages[1] || imageUrl).trim();

    useEffect(() => {
        if (isAuthenticated && productId) {
            ApiService.checkWishlist(productId)
                .then((res) => {
                    if (res?.data?.success) {
                        setInWishlist(res.data.data?.inWishlist || false);
                    }
                })
                .catch(() => { });
        }
    }, [isAuthenticated, productId]);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.info('Please sign in to add items to your cart');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        if (stock <= 0) {
            toast.warning('This item is currently out of stock');
            return;
        }

        setAddingToCart(true);
        try {
            const res = await ApiService.addToCart({ productId, quantity: 1 });
            if (res?.data?.success) {
                toast.success('Added to Cart!');
                if (onUpdate) onUpdate();
            } else {
                toast.error(res?.data?.message || 'Failed to add to cart');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleToggleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.info('Please sign in to save items to your wishlist');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        setWishlistLoading(true);
        try {
            if (inWishlist) {
                await ApiService.removeFromWishlist(productId);
                setInWishlist(false);
                toast.success('Removed from Wishlist');
            } else {
                await ApiService.addToWishlist({ productId });
                setInWishlist(true);
                toast.success('Saved to Wishlist!');
            }
            if (onUpdate) onUpdate();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Could not update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    const formatCurrency = (v) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

    const renderStars = (score) => {
        const full = Math.floor(score);
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <FiStar
                        key={i}
                        className={`h-3.5 w-3.5 ${
                            i <= full
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (viewMode === 'list') {
        return (
            <div className="group relative bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col sm:flex-row gap-5">
                {/* Image Container */}
                <Link
                    to={`/products/${productId}`}
                    className="relative w-full sm:w-56 h-56 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-2"
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <FiShoppingBag className="h-16 w-16 text-slate-300" />
                    )}

                    {discount > 0 && (
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md">
                            {discount}% OFF
                        </span>
                    )}
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            {brand && (
                                <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                                    {brand}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleToggleWishlist}
                                disabled={wishlistLoading}
                                className={`p-2 rounded-full border transition ${
                                    inWishlist
                                        ? 'bg-rose-50 border-rose-200 text-rose-500'
                                        : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                                }`}
                            >
                                <FiHeart className={`h-4 w-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
                            </button>
                        </div>

                        <Link to={`/products/${productId}`}>
                            <h3 className="mt-1 text-base sm:text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-2">
                                {title}
                            </h3>
                        </Link>

                        <div className="flex items-center gap-2 mt-2">
                            {renderStars(rating)}
                            <span className="text-xs font-bold text-slate-700">{Number(rating).toFixed(1)}</span>
                            <span className="text-xs text-slate-400">({totalReviews} reviews)</span>
                        </div>

                        {product?.description && (
                            <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2">
                                {product.description}
                            </p>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-black text-slate-900">
                                    {formatCurrency(price)}
                                </span>
                                {mrp > price && (
                                    <span className="text-sm font-semibold text-slate-400 line-through">
                                        {formatCurrency(mrp)}
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <FiTruck className="h-3 w-3" /> Free Delivery
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={addingToCart || stock <= 0}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition active:scale-95 disabled:opacity-50"
                        >
                            <FiShoppingCart className="h-4 w-4" />
                            {addingToCart ? 'Adding...' : stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Grid View Card
    return (
        <div
            className="group relative bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div>
                {/* Image Container with Badges */}
                <div className="relative aspect-square w-full rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-3 mb-3">
                    <Link to={`/products/${productId}`} className="w-full h-full flex items-center justify-center">
                        {imageUrl ? (
                            <img
                                src={isHovered && secondaryImageUrl !== imageUrl ? secondaryImageUrl : imageUrl}
                                alt={title}
                                className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                        ) : (
                            <FiShoppingBag className="h-16 w-16 text-slate-300" />
                        )}
                    </Link>

                    {/* Discount & Stock Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
                        {discount > 0 && (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm">
                                {discount}% OFF
                            </span>
                        )}
                        {stock <= 0 && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-slate-800 text-white">
                                SOLD OUT
                            </span>
                        )}
                    </div>

                    {/* Wishlist Button (Floating) */}
                    <button
                        type="button"
                        onClick={handleToggleWishlist}
                        disabled={wishlistLoading}
                        className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-full flex items-center justify-center shadow-md transition-all ${
                            inWishlist
                                ? 'bg-rose-50 text-rose-500 ring-2 ring-rose-200 scale-105'
                                : 'bg-white text-slate-400 hover:text-rose-500 hover:scale-110 opacity-90 group-hover:opacity-100'
                        }`}
                        aria-label="Add to Wishlist"
                    >
                        <FiHeart className={`h-4 w-4 ${inWishlist ? 'fill-rose-500' : ''}`} />
                    </button>
                </div>

                {/* Brand & Title */}
                <div>
                    {brand && (
                        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 truncate">
                            {brand}
                        </p>
                    )}
                    <Link to={`/products/${productId}`}>
                        <h3 className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px] leading-snug">
                            {title}
                        </h3>
                    </Link>
                </div>

                {/* Star Ratings */}
                <div className="flex items-center gap-1.5 mt-1.5">
                    {renderStars(rating)}
                    <span className="text-xs font-bold text-slate-700">{Number(rating).toFixed(1)}</span>
                    <span className="text-[11px] text-slate-400">({totalReviews})</span>
                </div>
            </div>

            {/* Price & Add to Cart Action */}
            <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between mb-2.5">
                    <div>
                        <span className="text-base sm:text-lg font-extrabold text-slate-900">
                            {formatCurrency(price)}
                        </span>
                        {mrp > price && (
                            <span className="ml-1.5 text-xs font-medium text-slate-400 line-through">
                                {formatCurrency(mrp)}
                            </span>
                        )}
                    </div>
                    {mrp > price && (
                        <span className="text-[11px] font-bold text-emerald-600">
                            Save {formatCurrency(mrp - price)}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={addingToCart || stock <= 0}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 hover:shadow-md transition active:scale-95 disabled:opacity-50"
                >
                    <FiShoppingCart className="h-4 w-4" />
                    {addingToCart ? 'Adding...' : stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
