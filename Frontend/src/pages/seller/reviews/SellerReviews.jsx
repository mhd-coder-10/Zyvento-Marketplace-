import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiStar,
    FiSearch,
    FiRefreshCw,
    FiHome,
    FiMessageSquare,
    FiCheckCircle,
    FiClock,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiX,
    FiPackage,
    FiUser,
    FiCalendar,
    FiPlay,
    FiMaximize2,
    FiFilter,
    FiThumbsUp,
    FiAlertCircle,
    FiInfo,
    FiEyeOff
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'published', label: 'Published' },
    { value: 'hidden', label: 'Hidden (by Admin)' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    hidden: 'bg-slate-100 text-slate-700 border-slate-300',
    flagged: 'bg-orange-50 text-orange-700 border-orange-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const SellerReviews = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Query parameters from URL if any
    const initialProductId = searchParams.get('productId') || '';

    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
    const [jumpPageInput, setJumpPageInput] = useState('');

    // Filters
    const [selectedProduct, setSelectedProduct] = useState(initialProductId);
    const [statusFilter, setStatusFilter] = useState('all');
    const [sentimentFilter, setSentimentFilter] = useState(''); // '', 'better', 'medium', 'bad'
    const [ratingFilter, setRatingFilter] = useState(''); // '', '5', '4', '3', '2', '1'
    const [search, setSearch] = useState('');

    // Products list for dropdown
    const [sellerProducts, setSellerProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Rating Overview Stats
    const [stats, setStats] = useState({
        avgRating: 0,
        totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    });

    // Review Details View Modal (Read-Only for Seller)
    const [selectedReviewForView, setSelectedReviewForView] = useState(null);

    // Media Lightbox (for images & videos)
    const [activeMediaModal, setActiveMediaModal] = useState(null);

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchSellerProducts();
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        // Sync URL param if changed from outside
        const pId = searchParams.get('productId') || '';
        if (pId !== selectedProduct) {
            setSelectedProduct(pId);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchReviews();
    }, [pagination.page, selectedProduct, sentimentFilter, ratingFilter, statusFilter]);

    const fetchSellerProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await ApiService.getSellerMyProducts({ limit: 100 });
            if (res.data?.success) {
                const list = res.data.data?.products || (Array.isArray(res.data.data) ? res.data.data : []);
                setSellerProducts(list);
            }
        } catch (err) {
            console.error('Failed to load seller products for filter:', err);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
            };

            if (selectedProduct) {
                params.productId = selectedProduct;
            }

            if (statusFilter && statusFilter !== 'all') {
                params.status = statusFilter;
            }

            if (sentimentFilter) {
                params.sentiment = sentimentFilter;
            } else if (ratingFilter) {
                params.rating = ratingFilter;
            }

            const res = await ApiService.getSellerProductReviews(params);

            if (!mounted.current) return;

            if (res?.data?.success) {
                const list = res.data.data?.reviews || (Array.isArray(res.data.data) ? res.data.data : []);
                setReviews(list);

                const pag = res.data.pagination || res.data.data?.pagination;
                if (pag) {
                    setPagination((p) => ({
                        ...p,
                        total: pag.total || list.length,
                        totalPages: pag.totalPages || Math.ceil((pag.total || list.length) / p.limit) || 1,
                    }));
                }

                // Compute rating stats
                const total = pag?.total || list.length;
                if (total > 0) {
                    const dist = res.data.ratingDistribution || res.data.data?.ratingDistribution;
                    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

                    if (dist && Object.keys(dist).length > 0) {
                        [1, 2, 3, 4, 5].forEach(star => {
                            breakdown[star] = dist[star] || 0;
                        });
                    } else {
                        list.forEach((r) => {
                            const star = Math.round(Number(r.rating) || 0);
                            if (breakdown[star] !== undefined) breakdown[star]++;
                        });
                    }

                    const sum = [1, 2, 3, 4, 5].reduce((acc, s) => acc + (s * (breakdown[s] || 0)), 0);
                    const avg = total > 0 ? (sum / total).toFixed(1) : '0.0';

                    setStats({
                        avgRating: avg,
                        totalReviews: total,
                        breakdown,
                    });
                } else {
                    setStats({
                        avgRating: '0.0',
                        totalReviews: 0,
                        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                    });
                }
            }
        } catch (err) {
            console.error('Reviews fetch error:', err);
            toast.error('Failed to load product reviews');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleProductChange = (productId) => {
        setSelectedProduct(productId);
        setPagination((p) => ({ ...p, page: 1 }));
        if (productId) {
            setSearchParams({ productId });
        } else {
            setSearchParams({});
        }
    };

    const handleSentimentOrRatingChange = (val) => {
        setPagination((p) => ({ ...p, page: 1 }));
        if (['better', 'medium', 'bad'].includes(val)) {
            setSentimentFilter(val);
            setRatingFilter('');
        } else if (['1', '2', '3', '4', '5'].includes(val)) {
            setRatingFilter(val);
            setSentimentFilter('');
        } else {
            setSentimentFilter('');
            setRatingFilter('');
        }
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

    const getSentimentBadge = (rating) => {
        const r = Number(rating) || 0;
        if (r >= 4) {
            return (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Better / Good ({r}★)
                </span>
            );
        }
        if (r === 3) {
            return (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Medium ({r}★)
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Bad / Poor ({r}★)
            </span>
        );
    };

    return (
        <div className="space-y-6 text-left">
            {/* Header & Breadcrumb */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
                    <button
                        onClick={() => navigate('/seller/dashboard')}
                        className="p-1 rounded-md hover:bg-slate-50 text-blue-600 transition-colors"
                    >
                        <FiHome className="w-4 h-4" />
                    </button>
                    <span>/</span>
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg font-bold text-xs">
                        Reviews Module
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FiStar className="text-amber-500 w-7 h-7 fill-amber-400" />
                            <span>Customer Reviews</span>
                            {pagination.total > 0 && (
                                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    {pagination.total} reviews
                                </span>
                            )}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Monitor authentic customer ratings, detailed feedback, and review histories for your catalog.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchReviews}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Rating Overview Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Score */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 text-center">
                    <span className="text-5xl font-black text-slate-900">
                        {stats.totalReviews > 0 ? stats.avgRating : '0.0'}
                    </span>
                    <div className="my-2">{renderStars(stats.totalReviews > 0 ? Math.round(Number(stats.avgRating)) : 0)}</div>
                    <p className="text-xs font-semibold text-slate-500">
                        Average store rating ({stats.totalReviews} total reviews)
                    </p>
                </div>

                {/* Rating Breakdown */}
                <div className="md:col-span-8 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = stats.breakdown[star] || 0;
                        const total = stats.totalReviews || 1;
                        const percentage = Math.round((count / total) * 100);

                        return (
                            <div key={star} className="flex items-center gap-3 text-xs">
                                <span className="w-12 font-bold text-slate-600 flex items-center gap-1">
                                    {star} <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                                </span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-12 text-right font-medium text-slate-400">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter Bar (Product selection dropdown + Sentiment & Rating filters) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Product Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <FiPackage className="w-3.5 h-3.5 text-blue-600" /> Product:
                        </span>
                        <select
                            value={selectedProduct}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition max-w-xs truncate"
                        >
                            <option value="">All Products ({sellerProducts.length})</option>
                            {sellerProducts.map((p) => (
                                <option key={p._id || p.id} value={p._id || p.id}>
                                    {p.product_name} {p.product_code ? `(${p.product_code})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Status:
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPagination((p) => ({ ...p, page: 1 }));
                            }}
                            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sentiment & Rating Filter Dropdown (Bad, Medium, Better) */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <FiFilter className="w-3.5 h-3.5 text-amber-500" /> Rating & Sentiment:
                        </span>
                        <select
                            value={sentimentFilter || ratingFilter || ''}
                            onChange={(e) => handleSentimentOrRatingChange(e.target.value)}
                            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                        >
                            <option value="">All Ratings & Sentiments</option>
                            <optgroup label="Sentiment Categories">
                                <option value="better">⭐ Better / Good (4 - 5 Stars)</option>
                                <option value="medium">⚖️ Medium / Neutral (3 Stars)</option>
                                <option value="bad">⚠️ Bad / Poor (1 - 2 Stars)</option>
                            </optgroup>
                            <optgroup label="Specific Star Rating">
                                <option value="5">5 Stars Only</option>
                                <option value="4">4 Stars Only</option>
                                <option value="3">3 Stars Only</option>
                                <option value="2">2 Stars Only</option>
                                <option value="1">1 Star Only</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                {/* Reset Filters button if any active */}
                {(selectedProduct || sentimentFilter || ratingFilter || statusFilter !== 'all') && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedProduct('');
                            setSentimentFilter('');
                            setRatingFilter('');
                            setStatusFilter('all');
                            setSearchParams({});
                            setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 underline transition self-start md:self-auto"
                    >
                        Clear All Filters
                    </button>
                )}
            </div>

            {/* ============================================================
                REVIEWS TABLE
                ============================================================ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="py-3.5 px-4">Review ID</th>
                                <th className="py-3.5 px-4">Product</th>
                                <th className="py-3.5 px-4">Rating</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Customer</th>
                                <th className="py-3.5 px-4">Review Date</th>
                                <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-16 text-center text-slate-400">
                                        <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                        <span>Loading reviews…</span>
                                    </td>
                                </tr>
                            ) : reviews.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-16 text-center text-slate-400 space-y-2">
                                        <FiMessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="font-bold text-slate-700 text-sm">No reviews found</p>
                                        <p className="text-xs text-slate-400">Try adjusting your status, product, or rating filters to see more results.</p>
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((rev) => {
                                    const rId = rev._id || rev.id;
                                    const revCode = rev.review_code || `#REV-${String(rId).slice(-6).toUpperCase()}`;
                                    const customerName = rev.user_id ? `${rev.user_id.first_name || ''} ${rev.user_id.last_name || ''}`.trim() || rev.user_id.username : 'Customer';
                                    const customerUsername = rev.user_id?.username ? `@${rev.user_id.username}` : '';
                                    const customerAvatar = rev.user_id?.profile_image;

                                    const productObj = rev.product_id;
                                    const productName = productObj?.product_name || rev.product_name || 'Product';
                                    const productImg = Array.isArray(productObj?.images) ? productObj.images[0] : (productObj?.image || '');

                                    // Display updated review date if edited, otherwise created date
                                    const dateStr = rev.is_edited
                                        ? new Date(rev.updated_at || rev.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : new Date(rev.created_at || rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

                                    return (
                                        <tr key={rId} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Review ID */}
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                                                {revCode}
                                            </td>

                                            {/* Product */}
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="flex items-center gap-2.5">
                                                    {productImg ? (
                                                        <img src={typeof productImg === 'string' ? productImg : productImg.url} alt={productName} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                                            <FiPackage className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 truncate" title={productName}>
                                                            {productName}
                                                        </p>
                                                        {productObj?.sku && (
                                                            <p className="text-[10px] text-slate-400">SKU: {productObj.sku}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Rating & Sentiment */}
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {renderStars(rev.rating)}
                                                        <span className="font-bold text-slate-800">{rev.rating}.0</span>
                                                    </div>
                                                    {getSentimentBadge(rev.rating)}
                                                </div>
                                            </td>

                                            {/* Review Status Badge */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold capitalize ${
                                                        STATUS_BADGE[rev.status] || STATUS_BADGE.published
                                                    }`}
                                                >
                                                    {rev.status === 'hidden' && <FiEyeOff className="w-3 h-3 text-slate-500" />}
                                                    {rev.status || 'published'}
                                                </span>
                                            </td>

                                            {/* Customer */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    {customerAvatar ? (
                                                        <img src={customerAvatar} alt={customerName} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                            {customerName[0] || 'U'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-800">{customerName}</p>
                                                        {customerUsername && (
                                                            <p className="text-[10px] text-slate-400">{customerUsername}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Review Date (Updated date if edited, with "Edited" tag) */}
                                            <td className="py-3.5 px-4">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-slate-700">{dateStr}</span>
                                                        {rev.is_edited && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                Edited
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400">
                                                        {rev.is_edited ? 'Last updated date' : 'Initial post date'}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Action: View Icon */}
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedReviewForView(rev)}
                                                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                                    title="View Full Review Details"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
                        <span>
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {/* Page Jumper */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs">
                                <span className="text-slate-500">Go to:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={pagination.totalPages}
                                    value={jumpPageInput}
                                    onChange={(e) => setJumpPageInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const p = parseInt(jumpPageInput);
                                            if (!isNaN(p) && p >= 1 && p <= pagination.totalPages) {
                                                setPagination((prev) => ({ ...prev, page: p }));
                                                setJumpPageInput('');
                                            }
                                        }
                                    }}
                                    placeholder={pagination.page.toString()}
                                    className="w-12 text-center text-xs border border-slate-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const p = parseInt(jumpPageInput);
                                        if (!isNaN(p) && p >= 1 && p <= pagination.totalPages) {
                                            setPagination((prev) => ({ ...prev, page: p }));
                                            setJumpPageInput('');
                                        }
                                    }}
                                    className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition shadow-2xs"
                                >
                                    Jump
                                </button>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                    disabled={pagination.page <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                >
                                    <FiChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2 text-slate-700 font-semibold">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                >
                                    <FiChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================
                REVIEW DETAILS MODAL (READ-ONLY FOR SELLER)
                Displays:
                - Current review text and rating (only edited value)
                - "Edited" badge if edited (no old text shown)
                - Attached Photos & Playable Videos
                ============================================================ */}
            {selectedReviewForView && (() => {
                const rev = selectedReviewForView;
                const rId = rev._id || rev.id;
                const revCode = rev.review_code || `#REV-${String(rId).slice(-6).toUpperCase()}`;
                const customerName = rev.user_id ? `${rev.user_id.first_name || ''} ${rev.user_id.last_name || ''}`.trim() || rev.user_id.username : 'Customer';
                const customerUsername = rev.user_id?.username ? `@${rev.user_id.username}` : '';
                const customerAvatar = rev.user_id?.profile_image;
                const customerEmail = rev.user_id?.email || '';

                const productObj = rev.product_id;
                const productName = productObj?.product_name || rev.product_name || 'Product';

                const updatedDateStr = rev.is_edited
                    ? new Date(rev.updated_at || rev.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : new Date(rev.created_at || rev.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                    <div
                        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                        onClick={() => setSelectedReviewForView(null)}
                    >
                        <div
                            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                            {revCode}
                                        </span>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold capitalize ${
                                                STATUS_BADGE[rev.status] || STATUS_BADGE.published
                                            }`}
                                        >
                                            {rev.status === 'hidden' && <FiEyeOff className="w-3 h-3 text-slate-500" />}
                                            {rev.status || 'published'}
                                        </span>
                                        {rev.is_edited && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                Edited
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                                        Customer Review Details
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedReviewForView(null)}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4 overflow-y-auto">
                                {/* Moderation Alert if Hidden or Rejected */}
                                {rev.status === 'hidden' && (
                                    <div className="p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                                        <FiEyeOff className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-slate-900">Hidden by Admin Moderation</p>
                                            <p className="text-slate-600 mt-0.5">
                                                This review has been marked as Hidden by the administration and is NOT visible to customers on the public storefront.
                                            </p>
                                            {rev.moderation_reason && (
                                                <p className="text-slate-800 mt-1 font-semibold">
                                                    Reason: <span className="font-normal text-slate-600">{rev.moderation_reason}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {rev.status === 'rejected' && (
                                    <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                                        <FiAlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-rose-900">Rejected by Admin Moderation</p>
                                            <p className="text-rose-700 mt-0.5">
                                                This review was rejected by moderators and is excluded from the catalog.
                                            </p>
                                            {rev.moderation_reason && (
                                                <p className="text-rose-800 mt-1 font-semibold">
                                                    Reason: <span className="font-normal text-rose-700">{rev.moderation_reason}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Customer & Product Information Banner */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Customer */}
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        {customerAvatar ? (
                                            <img src={customerAvatar} alt={customerName} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                                {customerName[0] || 'U'}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-xs truncate">{customerName}</p>
                                            {customerUsername && (
                                                <p className="text-[11px] text-slate-500">{customerUsername}</p>
                                            )}
                                            {customerEmail && (
                                                <p className="text-[10px] text-slate-400 truncate">{customerEmail}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product */}
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                                            <FiPackage className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reviewed Product</p>
                                            <p className="font-bold text-slate-900 text-xs truncate" title={productName}>{productName}</p>
                                            {productObj?.sku && (
                                                <p className="text-[10px] text-slate-500">SKU: {productObj.sku}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Review Details */}
                                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {renderStars(rev.rating)}
                                            <span className="text-xs font-bold text-slate-900">{rev.rating}.0 / 5.0</span>
                                            {getSentimentBadge(rev.rating)}
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            {rev.is_edited ? `Updated: ${updatedDateStr}` : `Submitted: ${updatedDateStr}`}
                                        </span>
                                    </div>

                                    {rev.title && (
                                        <h4 className="font-black text-slate-900 text-sm">"{rev.title}"</h4>
                                    )}

                                    <div>
                                        <p className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                            {rev.comment}
                                        </p>
                                    </div>
                                </div>

                                {/* Attached Media Photos & Videos */}
                                {((rev.images && rev.images.length > 0) || (rev.videos && rev.videos.length > 0)) && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Attached Photos & Videos
                                        </p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {rev.images?.map((img, idx) => (
                                                <button
                                                    key={`rev-modal-img-${idx}`}
                                                    type="button"
                                                    onClick={() => setActiveMediaModal({ url: img, type: 'image' })}
                                                    className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:ring-2 hover:ring-blue-500 transition"
                                                    title="Click to view full photo"
                                                >
                                                    <img src={img} alt="Customer photo" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                                </button>
                                            ))}
                                            {rev.videos?.map((vid, idx) => (
                                                <button
                                                    key={`rev-modal-vid-${idx}`}
                                                    type="button"
                                                    onClick={() => setActiveMediaModal({ url: vid, type: 'video' })}
                                                    className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs hover:ring-2 hover:ring-blue-500 transition flex items-center justify-center text-white"
                                                    title="Click to play video"
                                                >
                                                    <video src={vid} className="w-full h-full object-cover opacity-60" />
                                                    <FiPlay className="w-5 h-5 fill-white text-white absolute" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedReviewForView(null)}
                                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ============================================================
                MEDIA LIGHTBOX (FOR IMAGES & PLAYABLE VIDEOS)
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

export default SellerReviews;
