import React, { useState, useEffect, useRef } from 'react';
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
    FiZap,
    FiMapPin,
    FiAward,
    FiClock,
    FiChevronRight,
    FiMaximize2,
    FiMessageSquare,
    FiSliders,
    FiThumbsUp
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import ProductCard from '../../../components/public/product/ProductCard';

const ProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);

    // Interactive variant selections
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');

    // Delivery pincode checker
    const [pincode, setPincode] = useState('');
    const [deliveryInfo, setDeliveryInfo] = useState(null);
    const [checkingPincode, setCheckingPincode] = useState(false);

    // Image zoom & modal
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const imageContainerRef = useRef(null);

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

            if (response.data?.success) {
                const prod = response.data.data?.product || response.data.data;
                setProduct(prod);

                // Set default variant options if available
                if (prod.attributes?.color) setSelectedColor(prod.attributes.color);
                if (prod.attributes?.size) setSelectedSize(prod.attributes.size);
                if (prod.attributes?.storage) setSelectedStorage(prod.attributes.storage);

                // Load related products
                const categoryId = prod.category_id?._id || prod.category_id;
                loadRelated(categoryId);

                if (isAuthenticated) {
                    checkWishlist(prod._id || prod.id);
                }
            } else {
                toast.error('Product not found');
                navigate('/products');
            }
        } catch (error) {
            console.error('Failed to load product:', error);
            toast.error(error.response?.data?.message || 'Failed to load product details');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const loadRelated = async (categoryId) => {
        try {
            const res = await ApiService.getAllProducts({
                category: categoryId || undefined,
                limit: 8
            });
            if (res.data?.success) {
                const list = Array.isArray(res.data.data)
                    ? res.data.data
                    : (res.data.data?.products || res.data.data || []);
                setRelatedProducts(list.filter(p => (p._id || p.id) !== productId).slice(0, 4));
            }
        } catch (_) { }
    };

    const checkWishlist = async (id) => {
        try {
            const response = await ApiService.checkWishlist(id);
            if (response.data?.success) {
                setInWishlist(Boolean(response.data.data?.inWishlist));
            }
        } catch (_) { }
    };

    const toggleWishlist = async () => {
        if (!isAuthenticated) {
            toast.info('Please sign in to save items to your wishlist');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        setWishlistLoading(true);
        try {
            const id = product._id || product.id;
            if (inWishlist) {
                await ApiService.removeFromWishlist(id);
                setInWishlist(false);
                toast.success('Removed from wishlist');
            } else {
                await ApiService.addToWishlist({ productId: id });
                setInWishlist(true);
                toast.success('Added to your wishlist!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            toast.info('Please sign in to add items to your cart');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        if (!inStock) {
            toast.warning('This item is currently out of stock');
            return;
        }

        setAddingToCart(true);
        try {
            const id = product._id || product.id;
            const res = await ApiService.addToCart({
                productId: id,
                quantity,
                selectedColor,
                selectedSize,
                selectedStorage
            });
            if (res?.data?.success) {
                toast.success(`Added ${quantity} item(s) to Cart!`);
            } else {
                toast.error(res?.data?.message || 'Failed to add to cart');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!isAuthenticated) {
            toast.info('Please sign in to complete your purchase');
            navigate('/login', { state: { from: `/products/${productId}` } });
            return;
        }

        if (!inStock) {
            toast.warning('This item is currently out of stock');
            return;
        }

        setBuyingNow(true);
        try {
            const id = product._id || product.id;
            await ApiService.addToCart({
                productId: id,
                quantity,
                selectedColor,
                selectedSize,
                selectedStorage
            });
            navigate('/checkout');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not initiate checkout');
        } finally {
            setBuyingNow(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: name,
                    text: `Check out ${name} on Zyvento Marketplace!`,
                    url: window.location.href,
                });
            } catch (_) { }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Product link copied to clipboard!');
        }
    };

    const handleCheckPincode = (e) => {
        e.preventDefault();
        const code = pincode.trim();
        if (!/^\d{6}$/.test(code)) {
            toast.error('Please enter a valid 6-digit PIN code');
            return;
        }

        setCheckingPincode(true);
        setTimeout(() => {
            setCheckingPincode(false);
            const deliveryDays = 2 + (parseInt(code.slice(-1)) % 3);
            const date = new Date();
            date.setDate(date.getDate() + deliveryDays);
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            setDeliveryInfo({
                pincode: code,
                date: date.toLocaleDateString('en-IN', options),
                free: true
            });
            toast.success(`Delivery available for ${code}!`);
        }, 500);
    };

    // Zoom handlers
    const handleMouseMove = (e) => {
        if (!imageContainerRef.current) return;
        const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    // Extract product fields safely
    const name = product?.product_name || product?.name || 'Product Details';
    const mrp = Number(product?.mrp || product?.price || 0);
    const finalPrice = Number(product?.final_price || product?.finalPrice || product?.price || 0);
    const discount = Number(product?.discount_percent || product?.discount || (mrp > finalPrice ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0));
    const savings = mrp > finalPrice ? mrp - finalPrice : 0;
    const stock = Number(product?.stock_quantity ?? product?.stock ?? 10);
    const inStock = stock > 0;
    const brand = product?.brand || 'Zyvento Verified';
    const rating = Number(product?.ratings || product?.rating || 4.8);
    const reviewsCount = Number(product?.num_reviews || product?.totalReviews || 128);
    const description = product?.description || 'Experience premium quality, high-grade materials, and unmatched performance crafted specifically to elevate your everyday lifestyle.';
    const attributes = product?.attributes || {};
    const seller = product?.seller_id || { business_name: 'Zyvento Retail Hub', rating: 4.9 };

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

    const renderStars = (val = 4.5) => {
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
                                : 'text-slate-200'
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="w-full max-w-[1600px] mx-auto animate-pulse space-y-8">
                    <div className="h-6 bg-slate-200 rounded-xl w-72" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-6 bg-slate-200 aspect-[4/3] rounded-3xl" />
                        <div className="lg:col-span-6 space-y-5">
                            <div className="h-10 bg-slate-200 rounded-2xl w-4/5" />
                            <div className="h-6 bg-slate-200 rounded-xl w-1/3" />
                            <div className="h-16 bg-slate-200 rounded-3xl w-full" />
                            <div className="h-36 bg-slate-200 rounded-3xl w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-20 px-4 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-rose-500/10">
                    <FiShoppingBag />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Product Not Found</h2>
                <p className="text-sm text-slate-500">The product you're looking for may be unavailable or moved.</p>
                <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                    <FiArrowLeft /> Browse Marketplace
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 xl:px-10 pb-24 lg:pb-16">
            <div className="w-full max-w-[1600px] mx-auto space-y-8">

                {/* ============ BREADCRUMB NAVIGATION ============ */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto py-1 scrollbar-none">
                        <Link to="/" className="hover:text-blue-600 transition-colors whitespace-nowrap">Home</Link>
                        <span>/</span>
                        <Link to="/products" className="hover:text-blue-600 transition-colors whitespace-nowrap">Catalog</Link>
                        <span>/</span>
                        {product.category_id?.category_name && (
                            <>
                                <Link
                                    to={`/products?category=${encodeURIComponent(product.category_id._id || product.category_id.category_name)}`}
                                    className="hover:text-blue-600 transition-colors whitespace-nowrap"
                                >
                                    {product.category_id.category_name}
                                </Link>
                                <span>/</span>
                            </>
                        )}
                        <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-md">{name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm hover:border-sky-300 transition-all active:scale-95"
                            title="Share product link"
                        >
                            <FiShare2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                </div>

                {/* ============ MAIN PRODUCT SHOWCASE CONTAINER ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 lg:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                        {/* ============================================================
                            LEFT: INTERACTIVE MULTI-ANGLE MEDIA GALLERY (5 cols)
                            ============================================================ */}
                        <div className="lg:col-span-5 space-y-4">
                            {/* Main Stage Image with Zoom */}
                            <div
                                ref={imageContainerRef}
                                onMouseEnter={() => setIsZoomed(true)}
                                onMouseLeave={() => setIsZoomed(false)}
                                onMouseMove={handleMouseMove}
                                onClick={() => setIsLightboxOpen(true)}
                                className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center cursor-zoom-in group shadow-inner"
                            >
                                <img
                                    src={imageList[selectedImage]}
                                    alt={name}
                                    style={isZoomed ? {
                                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                        transform: 'scale(1.75)'
                                    } : {}}
                                    className="w-full h-full object-contain p-6 transition-transform duration-150 ease-out select-none"
                                />

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                                    {discount > 0 && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500 text-white text-xs font-black rounded-full shadow-lg shadow-rose-500/30 uppercase tracking-wider">
                                            <FiTag className="w-3 h-3" /> {discount}% OFF
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold rounded-full shadow">
                                        <FiShield className="w-3 h-3 text-sky-400" /> 100% Genuine
                                    </span>
                                </div>

                                {/* Top Right Quick Actions */}
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsLightboxOpen(true);
                                        }}
                                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-md hover:bg-white text-slate-500 hover:text-blue-600 transition-all active:scale-95"
                                        title="View Fullscreen"
                                    >
                                        <FiMaximize2 className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWishlist();
                                        }}
                                        disabled={wishlistLoading}
                                        className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-md hover:bg-white text-slate-400 hover:text-rose-500 transition-all active:scale-95"
                                        title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                                    >
                                        <FiHeart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                                    </button>
                                </div>

                                {/* Hover Prompt */}
                                <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="px-3 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-[11px] font-semibold text-white shadow-md">
                                        🔍 Hover to Zoom • Click to Expand
                                    </span>
                                </div>
                            </div>

                            {/* Thumbnail Selector Reel */}
                            {imageList.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                    {imageList.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 p-1.5 bg-slate-50 transition-all ${
                                                selectedImage === idx
                                                    ? 'border-blue-600 shadow-md shadow-blue-600/20 scale-105 ring-2 ring-blue-100'
                                                    : 'border-slate-200/80 hover:border-slate-400 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Trust Highlight Pill Bar */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                        <FiTruck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800">Free 48h Delivery</p>
                                        <p className="text-[10px] text-slate-500 truncate">On prepaid orders</p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <FiRefreshCw className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800">7-Day Replacement</p>
                                        <p className="text-[10px] text-slate-500 truncate">Hassle-free return</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ============================================================
                            RIGHT: PRODUCT INFORMATION, VARIANTS & ACTIONS (7 cols)
                            ============================================================ */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* Brand, SKU & Title */}
                            <div className="space-y-2.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider border border-blue-200/70">
                                        {brand}
                                    </span>
                                    {product.product_code && (
                                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2.5 py-0.5 rounded-md">
                                            ITEM #{product.product_code}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full font-bold">
                                        <FiAward className="w-3.5 h-3.5 text-emerald-600" /> Zyvento Verified
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                                    {name}
                                </h1>

                                {/* Rating summary block */}
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                                        <span className="font-black text-amber-800 text-sm">{rating.toFixed(1)}</span>
                                        {renderStars(rating)}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {reviewsCount} Customer Reviews
                                    </span>
                                    <span className="hidden sm:inline text-slate-300">•</span>
                                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                        <FiThumbsUp className="w-3 h-3" /> 98% Recommended
                                    </span>
                                </div>
                            </div>

                            {/* Dynamic Price Display Card */}
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 space-y-2 shadow-sm">
                                <div className="flex flex-wrap items-baseline gap-3.5">
                                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                                        ₹{finalPrice.toLocaleString('en-IN')}
                                    </span>
                                    {mrp > finalPrice && (
                                        <span className="text-lg sm:text-xl text-slate-400 line-through font-semibold">
                                            ₹{mrp.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                    {discount > 0 && (
                                        <span className="px-3 py-1 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-500/20">
                                            Save ₹{savings.toLocaleString('en-IN')} ({discount}% OFF)
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                    <FiCheck className="text-emerald-500" /> Inclusive of all taxes and import fees
                                    <span className="text-slate-300">•</span>
                                    <span className="text-blue-600 font-bold">Free Shipping on orders above ₹499</span>
                                </p>
                            </div>

                            {/* Color Selector (if present in attributes or demo) */}
                            {(attributes.color || attributes.colors) && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Color: <span className="text-blue-600 font-black">{selectedColor || attributes.color}</span>
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {[selectedColor || attributes.color, 'Midnight Black', 'Starlight Silver'].filter(Boolean).slice(0, 3).map((col) => (
                                            <button
                                                key={col}
                                                type="button"
                                                onClick={() => setSelectedColor(col)}
                                                className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                                                    selectedColor === col
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-200'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                {col}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Storage / Size Selector (if present in attributes) */}
                            {(attributes.storage || attributes.size) && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            {attributes.storage ? 'Storage Capacity' : 'Select Size'}:
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {(attributes.storage
                                            ? ['128GB', '256GB', '512GB']
                                            : (attributes.size || 'UK 8, UK 9, UK 10').split(',').map(s => s.trim())
                                        ).map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => attributes.storage ? setSelectedStorage(opt) : setSelectedSize(opt)}
                                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                                                    (selectedStorage === opt || selectedSize === opt)
                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-105'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity & Stock Availability */}
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                                        inStock
                                            ? stock < 5
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                    }`}>
                                        {inStock ? (
                                            <>
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                {stock < 5 ? `Hurry, only ${stock} left in stock!` : `In Stock (${stock} units ready to ship)`}
                                            </>
                                        ) : (
                                            <>
                                                <FiX className="w-3.5 h-3.5" /> Currently Out of Stock
                                            </>
                                        )}
                                    </span>
                                </div>

                                {inStock && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Quantity:
                                        </span>
                                        <div className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-2xl p-1 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                className="p-2.5 rounded-xl bg-white text-slate-700 hover:text-blue-600 shadow-sm disabled:opacity-40 transition-all active:scale-95"
                                            >
                                                <FiMinus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-12 text-center font-black text-sm text-slate-900">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                                                disabled={quantity >= stock}
                                                className="p-2.5 rounded-xl bg-white text-slate-700 hover:text-blue-600 shadow-sm disabled:opacity-40 transition-all active:scale-95"
                                            >
                                                <FiPlus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Purchase CTA Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || !inStock}
                                    className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <FiShoppingCart className="w-5 h-5" />
                                    {addingToCart ? 'Adding to Cart…' : 'Add to Cart'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleBuyNow}
                                    disabled={buyingNow || !inStock}
                                    className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-orange-500/30 hover:from-amber-600 hover:to-rose-600 hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <FiZap className="w-5 h-5" />
                                    {buyingNow ? 'Processing…' : 'Buy Now'}
                                </button>
                            </div>

                            {/* Pincode Delivery Estimator */}
                            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                    <FiMapPin className="text-blue-600 w-4 h-4" />
                                    <span>Check Delivery Availability & Estimated Date</span>
                                </div>
                                <form onSubmit={handleCheckPincode} className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        placeholder="Enter 6-digit PIN code (e.g. 110001)"
                                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={checkingPincode}
                                        className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {checkingPincode ? 'Checking…' : 'Check'}
                                    </button>
                                </form>
                                {deliveryInfo && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                                        <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        <span>Delivery by <strong className="text-emerald-900">{deliveryInfo.date}</strong> | FREE Delivery to PIN {deliveryInfo.pincode}</span>
                                    </div>
                                )}
                            </div>

                            {/* Seller Store Badge Card */}
                            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    {seller.logo ? (
                                        <img
                                            src={seller.logo}
                                            alt={seller.store_name || seller.business_name || 'Seller'}
                                            className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-md shadow-slate-200/50"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                                            {(seller.store_name || seller.business_name || 'Z')[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sold by Authorized Partner</p>
                                        <p className="text-sm font-extrabold text-slate-900">{seller.store_name || seller.business_name || 'Zyvento Prime Store'}</p>
                                        {seller.tagline && (
                                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{seller.tagline}</p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black">
                                                ★ {seller.rating || '4.9'}
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-medium">Verified Merchant</span>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    to="/products"
                                    className="px-4 py-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-sky-50 text-xs font-bold text-blue-600 transition-all whitespace-nowrap"
                                >
                                    Visit Store
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ============================================================
                    TABBED SPECIFICATIONS, REVIEWS & DETAILS MATRIX
                    ============================================================ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-200/80 bg-slate-50/70 overflow-x-auto scrollbar-none px-4 sm:px-6">
                        {[
                            { id: 'description', label: 'Product Description' },
                            { id: 'specs', label: 'Technical Specifications' },
                            { id: 'reviews', label: `Customer Reviews (${reviewsCount})` },
                            { id: 'shipping', label: 'Shipping & Returns Policy' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 sm:p-8 lg:p-10">
                        {/* TAB 1: DESCRIPTION */}
                        {activeTab === 'description' && (
                            <div className="space-y-6 max-w-4xl text-left">
                                <h3 className="text-lg font-black text-slate-900">About this product</h3>
                                <p className="text-sm sm:text-base leading-relaxed text-slate-600 whitespace-pre-line">
                                    {description}
                                </p>

                                <div className="space-y-3 pt-4">
                                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Key Highlights:</h4>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600">
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Engineered with certified high-grade components</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Official 1-Year Pan-India Brand Warranty</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Designed for maximum durability and premium aesthetics</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <FiCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                                            <span>Compliant with all international safety & quality benchmarks</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: SPECIFICATIONS */}
                        {activeTab === 'specs' && (
                            <div className="space-y-6 max-w-4xl text-left">
                                <h3 className="text-lg font-black text-slate-900">Technical Details</h3>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 p-4 bg-slate-50 text-xs font-semibold">
                                        <span className="text-slate-500">Brand</span>
                                        <span className="sm:col-span-2 text-slate-900 font-bold">{brand}</span>
                                    </div>
                                    {product.product_code && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 p-4 text-xs font-semibold">
                                            <span className="text-slate-500">Model / SKU Code</span>
                                            <span className="sm:col-span-2 text-slate-900 font-mono">{product.sku || product.product_code}</span>
                                        </div>
                                    )}
                                    {Object.entries(attributes).map(([k, v]) => (
                                        <div key={k} className="grid grid-cols-1 sm:grid-cols-3 p-4 text-xs font-semibold even:bg-slate-50">
                                            <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                            <span className="sm:col-span-2 text-slate-900 font-medium">{String(v)}</span>
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 p-4 text-xs font-semibold even:bg-slate-50">
                                        <span className="text-slate-500">Country of Origin</span>
                                        <span className="sm:col-span-2 text-slate-900 font-medium">India</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: REVIEWS */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-8 max-w-4xl text-left">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-200/80 items-center">
                                    <div className="text-center sm:border-r border-slate-200 sm:pr-6">
                                        <p className="text-5xl font-black text-slate-900">{rating.toFixed(1)}</p>
                                        <div className="flex justify-center mt-2">{renderStars(rating)}</div>
                                        <p className="text-xs text-slate-500 mt-1 font-semibold">{reviewsCount} Verified Reviews</p>
                                    </div>

                                    {/* Star Rating Breakdown Bars */}
                                    <div className="sm:col-span-2 space-y-2 text-xs">
                                        {[
                                            { stars: '5★', pct: 78 },
                                            { stars: '4★', pct: 16 },
                                            { stars: '3★', pct: 4 },
                                            { stars: '2★', pct: 1 },
                                            { stars: '1★', pct: 1 }
                                        ].map((bar) => (
                                            <div key={bar.stars} className="flex items-center gap-3">
                                                <span className="w-8 font-bold text-slate-600">{bar.stars}</span>
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-400 rounded-full"
                                                        style={{ width: `${bar.pct}%` }}
                                                    />
                                                </div>
                                                <span className="w-10 text-right text-slate-500 font-semibold">{bar.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sample Reviews */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-slate-900">Featured Customer Feedbacks</h4>
                                    {[
                                        {
                                            author: 'Vikram Mehta',
                                            badge: 'Verified Buyer',
                                            rating: 5,
                                            date: '14 Sep 2026',
                                            title: 'Spectacular build quality, exceeded all expectations!',
                                            comment: 'Received within 48 hours in bulletproof packaging. The product finish and functionality are top of the line. Worth every single penny.'
                                        },
                                        {
                                            author: 'Pooja Sharma',
                                            badge: 'Verified Buyer',
                                            rating: 5,
                                            date: '02 Sep 2026',
                                            title: 'Absolute game changer. Must buy!',
                                            comment: 'The quality matches international standards. Genuine product verified on official brand website. Super smooth experience with Zyvento!'
                                        }
                                    ].map((rev, i) => (
                                        <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-xs text-slate-800">{rev.author}</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                        {rev.badge}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-400">{rev.date}</span>
                                            </div>
                                            <div>{renderStars(rev.rating)}</div>
                                            <p className="text-xs font-bold text-slate-900">{rev.title}</p>
                                            <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: SHIPPING & RETURNS */}
                        {activeTab === 'shipping' && (
                            <div className="space-y-4 max-w-4xl text-left text-xs sm:text-sm text-slate-600 leading-relaxed">
                                <h3 className="text-lg font-black text-slate-900">Shipping & Returns Information</h3>
                                <p>
                                    All orders placed on Zyvento are dispatched through verified tier-1 logistics partners (BlueDart, Delhivery, Xpressbees) ensuring insured doorstep delivery across 19,000+ pin codes in India.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <p className="font-bold text-slate-900">⚡ Dispatch Time</p>
                                        <p className="text-xs text-slate-500">Orders placed before 2:00 PM are processed and dispatched on the very same day.</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                        <p className="font-bold text-slate-900">🔄 7-Day Replacement</p>
                                        <p className="text-xs text-slate-500">In the rare event of physical defect or mismatch, an instant doorstep exchange is scheduled.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================================
                    RELATED & RECOMMENDED PRODUCTS
                    ============================================================ */}
                {relatedProducts.length > 0 && (
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                    You might also love
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500">Handpicked alternatives from the same department</p>
                            </div>
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition"
                            >
                                <span>View Full Catalog</span>
                                <FiChevronRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {relatedProducts.map((p) => (
                                <ProductCard
                                    key={p._id || p.id}
                                    product={p}
                                    viewMode="grid"
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* ============================================================
                STICKY MOBILE CONVERSION BAR (Mobile only)
                ============================================================ */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 z-40 shadow-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{name}</p>
                    <p className="text-lg font-black text-slate-900 leading-tight">₹{finalPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={addingToCart || !inStock}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {addingToCart ? 'Adding…' : 'Add to Cart'}
                    </button>
                    <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={buyingNow || !inStock}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
                    >
                        Buy Now
                    </button>
                </div>
            </div>

            {/* ============================================================
                FULLSCREEN IMAGE LIGHTBOX MODAL
                ============================================================ */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                    <img
                        src={imageList[selectedImage]}
                        alt="Expanded preview"
                        className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

        </div>
    );
};

export default ProductDetail;
