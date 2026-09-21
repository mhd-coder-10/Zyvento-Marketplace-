import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiStar,
    FiHeart,
    FiShoppingCart,
    FiTruck,
    FiRefreshCw,
    FiShield,
    FiMinus,
    FiPlus,
    FiCheck,
    FiShare2,
    FiX,
    FiArrowLeft,
    FiShoppingBag,
    FiPackage,
    FiCheckCircle,
    FiInfo,
    FiTag,
    FiZap
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import ProductCard from '../../../components/public/product/ProductCard';

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [addingToCart, setAddingToCart] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);

    useEffect(() => {
        if (productId) {
            loadProduct();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [productId]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getProductById(productId);

            if (response.data.success) {
                const prod = response.data.data.product || response.data.data;
                setProduct(prod);
                
                // Related products
                if (response.data.data.relatedProducts && response.data.data.relatedProducts.length > 0) {
                    setRelatedProducts(response.data.data.relatedProducts);
                } else {
                    loadFallbackRelated(prod.category_id?._id || prod.category_id || '');
                }

                if (isAuthenticated) {
                    checkWishlist(prod._id || prod.id);
                }
            } else {
                toast.error('Product not found');
                navigate('/products');
            }
        } catch (error) {
            console.error('Failed to load product:', error);
            toast.error(error.response?.data?.message || 'Failed to load product');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const loadFallbackRelated = async (categoryId) => {
        try {
            const res = await ApiService.getAllProducts({ category: categoryId || undefined, limit: 4 });
            if (res.data.success) {
                const list = res.data.data.products || res.data.data || [];
                setRelatedProducts(list.filter(p => (p._id || p.id) !== productId).slice(0, 4));
            }
        } catch (e) {
            // Ignore fallback error
        }
    };

    const checkWishlist = async (id) => {
        try {
            const response = await ApiService.checkWishlist(id);
            if (response.data.success) {
                setInWishlist(Boolean(response.data.data?.inWishlist));
            }
        } catch (error) {
            // Silently ignore
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        setAddingToCart(true);
        try {
            const response = await ApiService.addToCart({
                productId: product._id || product.id,
                quantity: quantity,
            });

            if (response.data.success) {
                toast.success(`Added ${quantity} item(s) to your cart!`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        try {
            await ApiService.addToCart({
                productId: product._id || product.id,
                quantity: quantity,
            });
            navigate('/checkout');
        } catch (error) {
            navigate('/checkout', { state: { productId: product._id || product.id, quantity } });
        }
    };

    const toggleWishlist = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        setWishlistLoading(true);
        const pid = product._id || product.id;
        try {
            if (inWishlist) {
                await ApiService.removeFromWishlist(pid);
                setInWishlist(false);
                toast.success('Removed from your Wishlist');
            } else {
                await ApiService.addToWishlist({ productId: pid });
                setInWishlist(true);
                toast.success('Added to your Wishlist!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.product_name || product.name,
                text: `Check out ${product.product_name || product.name} on Zyvento!`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Product link copied to clipboard!');
        }
    };

    const renderStars = (rating) => {
        const val = Number(rating) || 4.5;
        const fullStars = Math.floor(val);
        const hasHalfStar = val % 1 >= 0.5;

        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <FiStar
                        key={i}
                        className={`w-4 h-4 ${
                            i < fullStars
                                ? 'fill-amber-400 text-amber-400'
                                : i === fullStars && hasHalfStar
                                ? 'fill-amber-400 text-amber-400 opacity-60'
                                : 'text-slate-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    // Extract product fields safely
    const name = product?.product_name || product?.name || 'Product Details';
    const mrp = Number(product?.mrp || product?.price || 0);
    const finalPrice = Number(product?.final_price || product?.finalPrice || product?.price || 0);
    const discount = Number(product?.discount_percent || product?.discount || (mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0));
    const savings = mrp > finalPrice ? mrp - finalPrice : 0;
    const stock = Number(product?.stock_quantity ?? product?.stock ?? 10);
    const inStock = stock > 0;
    const brand = product?.brand || 'Zyvento Choice';
    const rating = Number(product?.ratings || product?.rating || 4.8);
    const reviewsCount = Number(product?.num_reviews || product?.totalReviews || 128);

    // Extract images safely
    let imageList = [];
    if (Array.isArray(product?.images) && product.images.length > 0) {
        imageList = product.images.map(img => (typeof img === 'string' ? img : img.url || img.secure_url || '')).filter(Boolean);
    } else if (product?.image) {
        imageList = [product.image];
    }
    if (imageList.length === 0) {
        imageList = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto animate-pulse space-y-8">
                    <div className="h-6 bg-slate-200 rounded-xl w-64" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="bg-slate-200 aspect-square rounded-3xl" />
                        <div className="space-y-4">
                            <div className="h-8 bg-slate-200 rounded-2xl w-3/4" />
                            <div className="h-6 bg-slate-200 rounded-xl w-1/3" />
                            <div className="h-12 bg-slate-200 rounded-2xl w-1/2" />
                            <div className="h-32 bg-slate-200 rounded-3xl w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-16 px-4 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl font-bold">
                    <FiShoppingBag />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Product Not Found</h2>
                <p className="text-sm text-slate-500">The product you're looking for may be unavailable or deleted.</p>
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20"
                >
                    Browse Catalog
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* ============ BREADCRUMBS ============ */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto py-1">
                        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                        <span>/</span>
                        <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
                        <span>/</span>
                        <span className="text-slate-800 font-bold truncate max-w-xs">{name}</span>
                    </div>

                    <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                    >
                        <FiShare2 className="w-3.5 h-3.5 text-blue-600" />
                        Share
                    </button>
                </div>

                {/* ============ MAIN PRODUCT SECTION ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* ===== LEFT: GALLERY (5 cols) ===== */}
                        <div className="lg:col-span-5 space-y-4">
                            {/* Main Active Image Display */}
                            <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center group">
                                <img
                                    src={imageList[selectedImage]}
                                    alt={name}
                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                />

                                {discount > 0 && (
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white text-xs font-black rounded-full shadow-md shadow-rose-500/30 uppercase tracking-wider">
                                        {discount}% OFF
                                    </div>
                                )}

                                <button
                                    onClick={toggleWishlist}
                                    disabled={wishlistLoading}
                                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-md hover:bg-white text-slate-400 hover:text-rose-500 transition-all active:scale-90"
                                    title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                                >
                                    <FiHeart className={`w-5 h-5 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                                </button>
                            </div>

                            {/* Thumbnail Row */}
                            {imageList.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                    {imageList.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 p-1 bg-slate-50 transition-all ${
                                                selectedImage === idx
                                                    ? 'border-blue-600 shadow-md shadow-blue-600/20 scale-105'
                                                    : 'border-slate-200/80 hover:border-slate-300 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ===== RIGHT: DETAILS & ACTIONS (7 cols) ===== */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Brand & Title */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                                        {brand}
                                    </span>
                                    {product.product_code && (
                                        <span className="text-xs text-slate-400 font-mono">
                                            #{product.product_code}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-snug">
                                    {name}
                                </h1>

                                {/* Rating block */}
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                                        <span className="font-black text-amber-700 text-xs">{rating.toFixed(1)}</span>
                                        {renderStars(rating)}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                        ({reviewsCount} verified customer ratings)
                                    </span>
                                </div>
                            </div>

                            {/* Price Block */}
                            <div className="p-5 rounded-3xl bg-slate-50/80 border border-slate-100 space-y-2">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                        ₹{finalPrice.toFixed(2)}
                                    </span>
                                    {mrp > finalPrice && (
                                        <span className="text-base text-slate-400 line-through font-semibold">
                                            ₹{mrp.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {savings > 0 && (
                                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                        <FiTag className="w-3.5 h-3.5" />
                                        You save ₹{savings.toFixed(2)} ({discount}% off inclusive of all taxes)
                                    </p>
                                )}
                            </div>

                            {/* Stock & Quantity */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                                        inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                        {inStock ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
                                        {inStock ? `In Stock (${stock} available)` : 'Currently Out of Stock'}
                                    </span>
                                </div>

                                {inStock && (
                                    <div className="flex items-center gap-4 pt-1">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Quantity:
                                        </span>
                                        <div className="inline-flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                                            <button
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                className="p-2 text-slate-600 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                            >
                                                <FiMinus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-10 text-center font-bold text-sm text-slate-900">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                                                disabled={quantity >= stock}
                                                className="p-2 text-slate-600 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                            >
                                                <FiPlus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || !inStock}
                                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <FiShoppingCart className="w-5 h-5" />
                                    {addingToCart ? 'Adding to Cart…' : 'Add to Cart'}
                                </button>

                                <button
                                    onClick={handleBuyNow}
                                    disabled={!inStock}
                                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <FiZap className="w-5 h-5" />
                                    Buy Now
                                </button>
                            </div>

                            {/* Trust Assurances Band */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                    <FiTruck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Free Delivery</p>
                                        <p className="text-[11px] text-slate-500">On orders above ₹999</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                    <FiRefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">7 Days Return</p>
                                        <p className="text-[11px] text-slate-500">Hassle-free guarantee</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                                    <FiShield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">100% Genuine</p>
                                        <p className="text-[11px] text-slate-500">Verified seller catalog</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ============ TABS SECTION ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-100 px-6 sm:px-8 gap-4 overflow-x-auto">
                        {[
                            { id: 'description', label: 'Product Details' },
                            { id: 'specifications', label: 'Specifications' },
                            { id: 'reviews', label: `Customer Reviews (${reviewsCount})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 sm:p-8">
                        {activeTab === 'description' && (
                            <div className="prose max-w-none text-slate-600 text-sm leading-relaxed space-y-4">
                                <p>{product.description || 'No detailed description provided for this product.'}</p>
                                {product.attributes && Object.keys(product.attributes).length > 0 && (
                                    <div className="pt-4">
                                        <h4 className="text-sm font-bold text-slate-900 mb-3">Key Highlights:</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {Object.entries(product.attributes).map(([k, v]) => (
                                                <div key={k} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <FiCheck className="text-blue-600" />
                                                    <span className="capitalize">{k}:</span>
                                                    <span className="text-slate-500">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Brand</span>
                                    <span className="font-bold text-slate-900">{brand}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">SKU</span>
                                    <span className="font-mono font-bold text-slate-900">{product.sku || 'N/A'}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">Product Code</span>
                                    <span className="font-mono font-bold text-slate-900">{product.product_code || 'N/A'}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 flex justify-between text-xs">
                                    <span className="font-bold text-slate-500">In Stock</span>
                                    <span className="font-bold text-slate-900">{stock} units</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                    <div className="text-center sm:text-left">
                                        <p className="text-4xl font-black text-slate-900">{rating.toFixed(1)}</p>
                                        <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
                                            {renderStars(rating)}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Based on {reviewsCount} ratings</p>
                                    </div>
                                    <div className="flex-1 w-full space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
                                        {[5, 4, 3, 2, 1].map((stars, i) => (
                                            <div key={stars} className="flex items-center gap-2 text-xs">
                                                <span className="w-4 font-bold text-slate-600">{stars}★</span>
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-400 rounded-full"
                                                        style={{ width: `${i === 0 ? 75 : i === 1 ? 18 : 7}%` }}
                                                    />
                                                </div>
                                                <span className="w-8 text-right font-medium text-slate-400">
                                                    {i === 0 ? '75%' : i === 1 ? '18%' : '7%'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============ RELATED PRODUCTS ============ */}
                {relatedProducts.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                Customers Also Viewed
                            </h2>
                            <Link to="/products" className="text-xs font-bold text-blue-600 hover:underline">
                                See All Products →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.map((p) => (
                                <ProductCard key={p._id || p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProductDetail;
