import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft,
    FiRefreshCw,
    FiEdit2,
    FiPackage,
    FiStar,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
    FiShoppingBag,
    FiTag,
    FiLayers,
    FiExternalLink,
    FiImage,
    FiActivity,
    FiMessageSquare,
    FiPlay,
    FiX,
    FiDollarSign,
    FiTrendingUp,
    FiChevronRight,
    FiMaximize2,
    FiFileText
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const STATUS_BADGES = {
    active: { label: 'Active (Live)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FiCheckCircle },
    inactive: { label: 'Inactive', bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: FiXCircle },
    suspended: { label: 'Suspended by Admin', bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: FiAlertCircle },
    pending: { label: 'Pending Approval', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
    approved: { label: 'Approved', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FiCheckCircle },
    rejected: { label: 'Rejected by Admin', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: FiXCircle },
    draft: { label: 'Draft', bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: FiClock },
};

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [product, setProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'reviews' | 'activity'
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({
        avgRating: 0,
        totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    // Activity state
    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);

    // Media Lightbox (Image / Video preview)
    const [activeMediaModal, setActiveMediaModal] = useState(null);

    useEffect(() => {
        loadAllData();
    }, [id]);

    const loadAllData = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            // 1. Load Product Details
            let productData = null;
            try {
                const prodRes = await ApiService.getSellerProductById(id);
                if (prodRes.data?.success) {
                    productData = prodRes.data.data;
                    setProduct(productData);
                }
            } catch (err) {
                // Fallback to public endpoint if needed
                const fallbackRes = await ApiService.getProductById(id);
                if (fallbackRes.data?.success) {
                    productData = fallbackRes.data.data;
                    setProduct(productData);
                } else {
                    throw err;
                }
            }

            const productId = productData?._id || id;

            // 2. Load Reviews for this Product
            try {
                const revRes = await ApiService.getProductReviews(productId, { page: 1, limit: 10 });
                if (revRes.data?.success) {
                    const revList = revRes.data.data?.reviews || (Array.isArray(revRes.data.data) ? revRes.data.data : []);
                    setReviews(revList);

                    const dist = revRes.data.data?.ratingDistribution || {};
                    const total = revRes.data.data?.totalReviews !== undefined ? revRes.data.data.totalReviews : revList.length;
                    const avg = revRes.data.data?.averageRating !== undefined ? revRes.data.data.averageRating : (productData?.ratings || productData?.rating || 0);

                    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                    if (dist && Object.keys(dist).length > 0) {
                        [1, 2, 3, 4, 5].forEach(star => {
                            breakdown[star] = dist[star] || 0;
                        });
                    } else {
                        revList.forEach(r => {
                            const star = Math.round(Number(r.rating) || 0);
                            if (breakdown[star] !== undefined) breakdown[star]++;
                        });
                    }

                    setReviewStats({
                        avgRating: Number(avg) || 0,
                        totalReviews: total || 0,
                        breakdown
                    });
                }
            } catch (rErr) {
                console.warn('Reviews fetch warning:', rErr);
            }

            // 3. Load Product Activity
            setActivitiesLoading(true);
            try {
                const actRes = await ApiService.getProductActivity(productId);
                if (actRes.data?.success) {
                    setActivities(actRes.data.data?.activities || actRes.data.data || []);
                }
            } catch (aErr) {
                console.warn('Activity fetch warning:', aErr);
            } finally {
                setActivitiesLoading(false);
            }

            if (isManualRefresh) {
                toast.success('Product details and activity reloaded!');
            }
        } catch (error) {
            console.error('Failed to load product details:', error);
            toast.error(error.response?.data?.message || 'Failed to load product information');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleHistory = (revId) => {
        setExpandedHistoryIds(prev => {
            const next = new Set(prev);
            if (next.has(revId)) next.delete(revId);
            else next.add(revId);
            return next;
        });
    };

    const renderStars = (rating = 0) => {
        const num = Number(rating) || 0;
        return (
            <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={`w-3.5 h-3.5 ${
                            star <= num ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-4">
                <div className="h-10 bg-slate-200 rounded-2xl w-60" />
                <div className="h-32 bg-slate-200 rounded-3xl w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-24 bg-slate-200 rounded-2xl" />
                    <div className="h-24 bg-slate-200 rounded-2xl" />
                    <div className="h-24 bg-slate-200 rounded-2xl" />
                    <div className="h-24 bg-slate-200 rounded-2xl" />
                </div>
                <div className="h-96 bg-slate-200 rounded-3xl" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-bold">
                    <FiPackage />
                </div>
                <h2 className="text-xl font-black text-slate-900">Product Not Found</h2>
                <p className="text-xs text-slate-500">The product requested could not be located or does not belong to your store.</p>
                <button
                    onClick={() => navigate('/seller/products')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                >
                    <FiArrowLeft /> Return to Products
                </button>
            </div>
        );
    }

    const images = Array.isArray(product.images)
        ? product.images.map((img) => (typeof img === 'string' ? img : img.url || img.secure_url || '')).filter(Boolean)
        : (product.image ? [product.image] : []);
    if (images.length === 0) {
        images.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80');
    }

    const currentImg = images[selectedImageIndex] || images[0];
    const statusKey = product.status || 'active';
    const statusBadge = STATUS_BADGES[statusKey] || STATUS_BADGES.active;
    const StatusIcon = statusBadge.icon;

    const price = Number(product.price || 0);
    const mrp = Number(product.compare_at_price || product.mrp || price);
    const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const stockQty = Number(product.stock_quantity ?? product.stock ?? 0);
    const inStock = stockQty > 0;

    return (
        <div className="space-y-6 text-left">
            {/* ============================================================
                TOP BAR & ACTIONS
                ============================================================ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                {/* Breadcrumb & Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <button
                        onClick={() => navigate('/seller/products')}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition group"
                    >
                        <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to All Products</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {product.status === 'active' && (
                            <Link
                                to={`/product/${product.product_code || product._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
                            >
                                <FiExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                <span>View in Marketplace</span>
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => loadAllData(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs disabled:opacity-50"
                            title="Reload Product Data"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/seller/products/edit/${product._id}`)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition"
                            title="Edit Product"
                        >
                            <FiEdit2 className="w-3.5 h-3.5" />
                            <span>Edit Product</span>
                        </button>
                    </div>
                </div>

                {/* Product Title & Status Header */}
                <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {product.product_code || 'CODE-N/A'}
                            </span>
                            {product.sku && (
                                <span className="text-[11px] text-slate-500 font-semibold">
                                    SKU: <strong className="text-slate-700">{product.sku}</strong>
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                <span>{statusBadge.label}</span>
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight break-words">
                            {product.product_name}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Selling Price</p>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(price)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                SUMMARY METRIC CARDS
                ============================================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600 font-bold">
                            <FiDollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">{formatCurrency(price)}</p>
                            <p className="text-[11px] text-slate-500 font-semibold">
                                {discountPercent > 0 ? `${discountPercent}% Off MRP (${formatCurrency(mrp)})` : 'Standard Price'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl font-bold ${inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <FiPackage className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">{stockQty} units</p>
                            <p className={`text-[11px] font-bold ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {inStock ? 'In Stock & Ready' : 'Out of Stock'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-500 font-bold">
                            <FiStar className="w-5 h-5 fill-amber-400" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">
                                {reviewStats.avgRating ? Number(reviewStats.avgRating).toFixed(1) : '0.0'} ★
                            </p>
                            <p className="text-[11px] text-slate-500 font-semibold">
                                {reviewStats.totalReviews} Total Reviews
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600 font-bold">
                            <FiActivity className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">{activities.length} Events</p>
                            <p className="text-[11px] text-slate-500 font-semibold">Lifecycle History</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin rejection reason alert callout (if rejected) */}
            {product.approval_status === 'rejected' && product.rejection_reason && (
                <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                    <FiXCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider">
                            Admin Rejection Reason
                        </h4>
                        <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                            "{product.rejection_reason}"
                        </p>
                        <p className="text-[10px] text-rose-500 mt-1">
                            Please click the "Edit Product" button above to modify the required details and re-submit for admin verification.
                        </p>
                    </div>
                </div>
            )}

            {/* ============================================================
                TABS NAVIGATION
                ============================================================ */}
            <div className="border-b border-slate-200 flex items-center gap-8">
                <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'overview'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <FiFileText className="w-4 h-4" />
                    <span>Overview & Specifications</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'reviews'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <FiStar className="w-4 h-4" />
                    <span>Customer Reviews ({reviewStats.totalReviews})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'activity'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <FiActivity className="w-4 h-4" />
                    <span>Activity History ({activities.length})</span>
                </button>
            </div>

            {/* ============================================================
                TAB 1: OVERVIEW
                ============================================================ */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Media Gallery (Left Column) */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
                            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 relative flex items-center justify-center group">
                                <img
                                    src={currentImg}
                                    alt={product.product_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setActiveMediaModal({ url: currentImg, type: 'image' })}
                                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition"
                                    title="Expand Image"
                                >
                                    <FiMaximize2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Thumbnail selector */}
                            {images.length > 1 && (
                                <div className="flex items-center gap-2 pt-3 overflow-x-auto pb-1">
                                    {images.map((img, idx) => (
                                        <button
                                            key={`thumb-${idx}`}
                                            type="button"
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                                                selectedImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Brand & Category Info Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classification</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1.5 border-b border-slate-50">
                                    <span className="text-slate-500">Category:</span>
                                    <span className="font-bold text-slate-800">{product.category_id?.category_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-50">
                                    <span className="text-slate-500">Sub-Category:</span>
                                    <span className="font-bold text-slate-800">{product.sub_category_id?.sub_category_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-slate-50">
                                    <span className="text-slate-500">Brand:</span>
                                    <span className="font-bold text-slate-800">{product.brand || 'Unbranded / Generic'}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-500">Listed Date:</span>
                                    <span className="font-bold text-slate-800">
                                        {product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Specifications & Details (Right Column) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Description Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FiFileText className="w-4 h-4 text-blue-600" />
                                <span>Product Description</span>
                            </h3>
                            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                {product.description || 'No detailed description provided for this product.'}
                            </div>
                        </div>

                        {/* Specifications & Attributes */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FiTag className="w-4 h-4 text-blue-600" />
                                <span>Technical Specifications & Inventory</span>
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 font-semibold">SKU</p>
                                    <p className="font-bold text-slate-800 mt-1">{product.sku || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 font-semibold">Stock Quantity</p>
                                    <p className="font-bold text-slate-800 mt-1">{product.stock_quantity ?? 0} units</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 font-semibold">Inventory Status</p>
                                    <p className="font-bold text-slate-800 mt-1 capitalize">{product.inventory?.stock_status || (inStock ? 'in_stock' : 'out_of_stock')}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 font-semibold">Product Weight</p>
                                    <p className="font-bold text-slate-800 mt-1">{product.weight ? `${product.weight} kg` : 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 font-semibold">Dimensions</p>
                                    <p className="font-bold text-slate-800 mt-1">{product.dimensions || 'Standard'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 font-semibold">Warranty</p>
                                    <p className="font-bold text-slate-800 mt-1">{product.warranty_period || 'Standard'}</p>
                                </div>
                            </div>

                            {/* Tags */}
                            {Array.isArray(product.tags) && product.tags.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {product.tags.map((tag, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                TAB 2: REVIEWS
                ============================================================ */}
            {activeTab === 'reviews' && (
                <div className="space-y-6">
                    {/* Top Review Rating Breakdown Banner */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 text-center">
                            <span className="text-5xl font-black text-slate-900">
                                {reviewStats.totalReviews > 0 ? Number(reviewStats.avgRating).toFixed(1) : '0.0'}
                            </span>
                            <div className="my-2">{renderStars(reviewStats.avgRating)}</div>
                            <p className="text-xs font-semibold text-slate-500">
                                Based on {reviewStats.totalReviews} ratings for this product
                            </p>
                        </div>

                        <div className="md:col-span-8 space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = reviewStats.breakdown[star] || 0;
                                const total = reviewStats.totalReviews || 1;
                                const pct = Math.round((count / total) * 100);

                                return (
                                    <div key={star} className="flex items-center gap-3 text-xs">
                                        <span className="w-12 font-bold text-slate-600 flex items-center gap-1">
                                            {star} <FiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        </span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-right font-medium text-slate-400">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top 10 Reviews List & Link to Reviews Module */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <FiStar className="w-4 h-4 text-amber-500 fill-amber-400" />
                                    <span>Top Customer Reviews for this Product</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Showing up to top 10 latest customer reviews with photo/video attachments
                                </p>
                            </div>

                            {/* View More in Reviews Module Button (User explicitly specified) */}
                            <button
                                type="button"
                                onClick={() => navigate(`/seller/reviews?productId=${product._id}`)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shadow-2xs transition active:scale-95"
                            >
                                <span>View All in Reviews Module</span>
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {reviews.length === 0 ? (
                            <div className="py-16 text-center text-slate-400 space-y-2">
                                <FiMessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                                <p className="font-bold text-slate-700 text-sm">No reviews yet for this product</p>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    When customers purchase and rate this product, their reviews and attached media will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                {reviews.map((rev) => {
                                    const rId = rev._id || rev.id;
                                    const customerName = rev.user_id ? `${rev.user_id.first_name || ''} ${rev.user_id.last_name || ''}`.trim() || rev.user_id.username : 'Customer';
                                    const avatar = rev.user_id?.profile_image;
                                    const reviewDate = rev.is_edited
                                        ? new Date(rev.updated_at || rev.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : new Date(rev.created_at || rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                                    return (
                                        <div key={rId} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition flex flex-col justify-between space-y-3">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2.5">
                                                        {avatar ? (
                                                            <img src={avatar} alt={customerName} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                                {customerName[0] || 'U'}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <p className="font-bold text-slate-900 text-sm truncate">{customerName}</p>
                                                                {rev.is_edited && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                        Edited
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-400">
                                                                {rev.is_edited ? `Updated: ${reviewDate}` : `Posted: ${reviewDate}`}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        {renderStars(rev.rating)}
                                                    </div>
                                                </div>

                                                {rev.title && (
                                                    <h5 className="font-bold text-slate-900 text-sm">"{rev.title}"</h5>
                                                )}

                                                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                                                    {rev.comment}
                                                </p>
                                            </div>

                                            {/* Attached Media Photos & Videos */}
                                            {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                                                <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100">
                                                    {rev.images?.map((img, idx) => (
                                                        <button
                                                            key={`rev-img-${idx}`}
                                                            type="button"
                                                            onClick={() => setActiveMediaModal({ url: img, type: 'image' })}
                                                            className="group relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition shadow-2xs shrink-0"
                                                            title="Click to view photo"
                                                        >
                                                            <img src={img} alt="Review attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        </button>
                                                    ))}
                                                    {rev.videos?.map((vid, idx) => (
                                                        <button
                                                            key={`rev-vid-${idx}`}
                                                            type="button"
                                                            onClick={() => setActiveMediaModal({ url: vid, type: 'video' })}
                                                            className="group relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 hover:ring-2 hover:ring-blue-500 transition flex items-center justify-center shadow-2xs shrink-0"
                                                            title="Click to play video"
                                                        >
                                                            <video src={vid} className="w-full h-full object-cover opacity-60" />
                                                            <FiPlay className="w-5 h-5 fill-white text-white absolute" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================
                TAB 3: ACTIVITY HISTORY
                ============================================================ */}
            {activeTab === 'activity' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <FiActivity className="w-5 h-5 text-blue-600" />
                                <span>Product Lifecycle & Activity History</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Chronological record of administrative operations, stock adjustments, and customer review events
                            </p>
                        </div>
                    </div>

                    {activitiesLoading ? (
                        <div className="py-12 text-center text-slate-400">
                            <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                            <span className="text-xs">Loading activity timeline…</span>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                            <FiActivity className="w-10 h-10 text-slate-300 mx-auto" />
                            <p className="font-bold text-slate-700 text-sm">No activity recorded yet</p>
                            <p className="text-xs text-slate-400">Events will appear as admin reviews or updates are performed.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {activities.map((act, index) => {
                                const actType = (act.type || 'system').toLowerCase();
                                const badgeColor =
                                    actType === 'create'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : actType === 'approve'
                                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                                            : actType === 'reject'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                : actType === 'review'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200';

                                const formattedDate = act.timestamp
                                    ? new Date(act.timestamp).toLocaleString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                      })
                                    : 'N/A';

                                return (
                                    <div
                                        key={act.id || `act-${index}`}
                                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-left"
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${badgeColor}`}>
                                                {actType}
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                                                    {act.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                    <span>By: <strong className="text-slate-700">{act.user || 'System'}</strong></span>
                                                    {act.user_role && (
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold text-[10px] capitalize">
                                                            {act.user_role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {formattedDate}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================
                MEDIA LIGHTBOX (FOR REVIEW PHOTOS & VIDEOS)
                ============================================================ */}
            {activeMediaModal && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setActiveMediaModal(null)}
                >
                    <button
                        type="button"
                        onClick={() => setActiveMediaModal(null)}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                    <div className="max-h-[85vh] max-w-[90vw] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        {activeMediaModal.type === 'video' ? (
                            <video
                                src={activeMediaModal.url}
                                controls
                                autoPlay
                                className="max-h-[80vh] max-w-[85vw] rounded-2xl shadow-2xl bg-black"
                            />
                        ) : (
                            <img
                                src={activeMediaModal.url}
                                alt="Attachment preview"
                                className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerProductDetails;
