import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const SellerReviews = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [ratingFilter, setRatingFilter] = useState('');
    const [search, setSearch] = useState('');

    const [stats, setStats] = useState({
        avgRating: 0,
        totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    });

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchReviews();
        return () => {
            mounted.current = false;
        };
    }, [pagination.page, ratingFilter]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerProductReviews({
                page: pagination.page,
                limit: pagination.limit,
                rating: ratingFilter || undefined,
            });

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
                if (list.length > 0) {
                    const total = list.length;
                    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
                    const avg = total > 0 ? (sum / total).toFixed(1) : '0.0';
                    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                    list.forEach((r) => {
                        const star = Math.round(Number(r.rating) || 0);
                        if (breakdown[star] !== undefined) breakdown[star]++;
                    });
                    setStats({
                        avgRating: avg,
                        totalReviews: pag?.total || total,
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

    const renderStars = (rating) => {
        const num = Number(rating) || 0;
        return (
            <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                        key={star}
                        className={`w-3.5 h-3.5 ${
                            star <= num ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumb */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                    <button
                        onClick={() => navigate('/seller/dashboard')}
                        className="p-1 rounded-md hover:bg-sky-50 text-blue-600 transition-colors"
                    >
                        <FiHome className="w-4 h-4" />
                    </button>
                    <span>/</span>
                    <span className="bg-sky-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                        Reviews
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
                            Monitor customer ratings, feedback, and product satisfaction across your store.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchReviews}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Rating Overview Card */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Score */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 text-center">
                    <span className="text-5xl font-black text-slate-900">
                        {stats.totalReviews > 0 ? stats.avgRating : '0.0'}
                    </span>
                    <div className="my-2">{renderStars(stats.totalReviews > 0 ? Math.round(stats.avgRating) : 0)}</div>
                    <p className="text-xs font-semibold text-slate-500">
                        Based on {stats.totalReviews} customer reviews
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
                                <span className="w-12 font-semibold text-slate-600 flex items-center gap-1">
                                    {star} <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                                </span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="w-10 text-right font-medium text-slate-400">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Filter by Rating:</span>
                    <select
                        value={ratingFilter}
                        onChange={(e) => {
                            setRatingFilter(e.target.value);
                            setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden divide-y divide-slate-100">
                {loading ? (
                    <div className="py-12 text-center text-slate-400">
                        <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                        <span className="text-xs">Loading reviews...</span>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <FiMessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">No reviews found</p>
                        <p className="text-xs text-slate-400 mt-1">Customer feedback on your products will be listed here.</p>
                    </div>
                ) : (
                    reviews.map((rev) => {
                        const rId = rev._id || rev.id;
                        const customer = rev.user_id?.full_name || rev.user_name || 'Verified Buyer';
                        const product = rev.product_id?.product_name || rev.product_name || 'Product';
                        const dateStr = rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent';

                        return (
                            <div key={rId} className="p-5 hover:bg-sky-50/20 transition-colors text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                            {customer[0] || 'C'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{customer}</p>
                                            <p className="text-[11px] text-slate-400">
                                                Purchased: <span className="font-medium text-slate-600">{product}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {renderStars(rev.rating || 5)}
                                        <span className="text-[11px] text-slate-400">{dateStr}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pl-11">
                                    {rev.title && (
                                        <h4 className="text-xs font-bold text-slate-900 mb-1">{rev.title}</h4>
                                    )}
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {rev.comment || rev.review_text || 'No comment provided.'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                        <span>
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page <= 1}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerReviews;
