
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
    FiStar,
    FiEye,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiAlertCircle,
    FiThumbsUp,
    FiX,
    FiPackage,
    FiUser,
    FiExternalLink,
    FiPlay,
    FiEyeOff,
    FiFlag,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import ApiService from '../../../api/ApiService';

/* ================= HELPERS ================= */

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    hidden: 'bg-slate-100 text-slate-700 border-slate-300',
    flagged: 'bg-orange-50 text-orange-700 border-orange-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

const StatusBadge = ({ status }) => (
    <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold capitalize ${
            STATUS_BADGE[status] || STATUS_BADGE.published
        }`}
    >
        {status === 'hidden' && <FiEyeOff size={11} />}
        {status || 'published'}
    </span>
);

const StatCard = ({ icon, title, value, color, accent }) => (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {title}
                </p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={`${color} grid h-10 w-10 shrink-0 place-items-center rounded-lg`}>
                {icon}
            </div>
        </div>
    </div>
);

/* ================= MAIN COMPONENT ================= */

const Reviews = () => {
    const navigate = useNavigate();

    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const itemsPerPage = 15;
    const [jumpPageInput, setJumpPageInput] = useState('');
    const [selectedReviewForModal, setSelectedReviewForModal] = useState(null);
    const [moderateLoading, setModerateLoading] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const params = { page: currentPage, limit: itemsPerPage };
            if (debouncedSearch) params.search = debouncedSearch;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (ratingFilter) params.rating = ratingFilter;

            const res = await ApiService.getAllReviews(params);
            const payload = res?.data || {};
            const list = Array.isArray(payload.data)
                ? payload.data
                : payload.data?.reviews || payload.reviews || [];
            const pag = payload.pagination || payload.data?.pagination || {};

            setReviews(list);
            setTotalPages(pag.totalPages || 1);
            setTotalReviews(pag.total || list.length);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviews([]);
            setLoadError(error?.response?.data?.message || 'Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, statusFilter, ratingFilter]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await ApiService.getReviewStats();
            setStats(res?.data?.data || res?.data || null);
        } catch (error) {
            console.error('Error fetching review stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, ratingFilter]);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const activeFilterCount =
        (statusFilter !== 'all' ? 1 : 0) + (ratingFilter ? 1 : 0) + (searchQuery ? 1 : 0);

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setRatingFilter('');
        setCurrentPage(1);
    };

    const handleQuickModerate = async (reviewId, action, reason = '') => {
        setModerateLoading(true);
        try {
            await ApiService.moderateReview(reviewId, { action, reason });
            toast.success(`Review ${action}ed successfully`);
            if (selectedReviewForModal && selectedReviewForModal._id === reviewId) {
                setSelectedReviewForModal((prev) => ({
                    ...prev,
                    status: action === 'publish' || action === 'unflag' ? 'published' : (action === 'hide' ? 'hidden' : (action === 'reject' ? 'rejected' : (action === 'flag' ? 'flagged' : prev.status)))
                }));
            }
            fetchReviews();
            fetchStats();
        } catch (err) {
            toast.error(err?.response?.data?.message || `Failed to ${action} review`);
        } finally {
            setModerateLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* HEADER */}
            <header className="relative z-30 border-b border-slate-200 bg-white">
                <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                            <FiStar size={20} />
                        </div>
                        <div className="min-w-0">
                            <h1
                                className="truncate"
                                style={{
                                    color: '#0f172a',
                                    fontWeight: 900,
                                    fontSize: '1.75rem',
                                    lineHeight: '2.25rem',
                                }}
                            >
                                Review Management
                            </h1>
                            <p className="mt-1 text-sm" style={{ color: '#475569' }}>
                                Moderate customer reviews across all sellers and products
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                fetchReviews();
                                fetchStats();
                            }}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6">
                {loadError && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
                        <FiAlertCircle size={16} /> {loadError}
                    </div>
                )}

                {/* STATS */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                    <StatCard
                        icon={<FiStar size={18} className="text-blue-600" />}
                        title="Total Reviews"
                        value={statsLoading ? '—' : stats?.totalReviews ?? 0}
                        color="bg-blue-100"
                        accent="bg-blue-500"
                    />
                    <StatCard
                        icon={<FiCheckCircle size={18} className="text-emerald-600" />}
                        title="Published"
                        value={statsLoading ? '—' : stats?.publishedReviews ?? 0}
                        color="bg-emerald-100"
                        accent="bg-emerald-500"
                    />
                    <StatCard
                        icon={<FiEyeOff size={18} className="text-slate-600" />}
                        title="Hidden"
                        value={statsLoading ? '—' : stats?.hiddenReviews ?? 0}
                        color="bg-slate-100"
                        accent="bg-slate-500"
                    />
                    <StatCard
                        icon={<FiFlag size={18} className="text-orange-600" />}
                        title="Flagged"
                        value={statsLoading ? '—' : stats?.flaggedReviews ?? 0}
                        color="bg-orange-100"
                        accent="bg-orange-500"
                    />
                    <StatCard
                        icon={<FiThumbsUp size={18} className="text-purple-600" />}
                        title="Avg Rating"
                        value={
                            statsLoading
                                ? '—'
                                : stats?.averageRating
                                    ? stats.averageRating.toFixed(2)
                                    : '0.00'
                        }
                        color="bg-purple-100"
                        accent="bg-purple-500"
                    />
                </div>

                {/* FILTERS + LIST */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="relative sm:col-span-2 xl:col-span-1">
                                <FiSearch
                                    size={16}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    value={searchQuery}
                                    placeholder="Search reviews..."
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-9 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    >
                                        <FiX size={15} />
                                    </button>
                                )}
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                            >
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                                className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                            >
                                <option value="">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>

                        {activeFilterCount > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-500">Active filters:</span>
                                {statusFilter !== 'all' && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                        {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className="hover:text-blue-900"
                                        >
                                            <FiX size={12} />
                                        </button>
                                    </span>
                                )}
                                {ratingFilter && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                                        {ratingFilter} Stars
                                        <button
                                            onClick={() => setRatingFilter('')}
                                            className="hover:text-amber-900"
                                        >
                                            <FiX size={12} />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={handleClearFilters}
                                    className="ml-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="space-y-3 p-3 sm:p-4 xl:hidden">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-sky-50 rounded-xl animate-pulse" />
                            ))
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">No reviews found</div>
                        ) : (
                            reviews.map((r) => (
                                <div
                                    key={r._id}
                                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 transition cursor-pointer"
                                    onClick={() => setSelectedReviewForModal(r)}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <FiStar
                                                    key={n}
                                                    size={14}
                                                    className={
                                                        n <= r.rating
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-300'
                                                    }
                                                />
                                            ))}
                                            <span className="text-xs font-bold text-slate-700 ml-1">{r.rating}.0</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {r.is_edited && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    Edited
                                                </span>
                                            )}
                                            <StatusBadge status={r.status} />
                                        </div>
                                    </div>
                                    <p className="font-medium text-slate-800 text-sm mb-1 line-clamp-2">
                                        {r.title || r.comment || 'No title'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        By {r.user_id?.first_name} {r.user_id?.last_name}
                                    </p>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                                        <span>{r.product_id?.product_name || 'Product N/A'}</span>
                                        <span>{formatDate(r.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden overflow-x-auto xl:block">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-sky-50/60">
                                <tr>
                                    {['Review', 'Customer', 'Product / Seller', 'Rating', 'Status', 'Date', 'Actions'].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h === 'Actions' ? 'text-center' : 'text-left'
                                                    }`}
                                            >
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sky-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(7)].map((__, j) => (
                                                <td key={j} className="px-4 py-4">
                                                    <div className="h-4 bg-sky-50 rounded animate-pulse" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-slate-500">
                                            No reviews found
                                        </td>
                                    </tr>
                                ) : (
                                    reviews.map((r) => (
                                        <tr
                                            key={r._id}
                                            className="hover:bg-sky-50/40 transition-colors"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="min-w-0 max-w-[280px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-medium text-slate-800 truncate text-sm">
                                                            {r.title || r.comment?.slice(0, 50) || 'No title'}
                                                        </p>
                                                        {r.is_edited && (
                                                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                Edited
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {r.review_code}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">
                                                        {r.user_id?.first_name} {r.user_id?.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {r.user_id?.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm text-slate-700 truncate">
                                                        {r.product_id?.product_name || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {r.seller_id?.business_name || 'N/A'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1">
                                                    <FiStar
                                                        size={14}
                                                        className="fill-amber-400 text-amber-400"
                                                    />
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {r.rating}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusBadge status={r.status} />
                                            </td>
                                            <td className="px-4 py-4 text-xs text-slate-500">
                                                {formatDate(r.created_at)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedReviewForModal(r)}
                                                        className="p-2 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition"
                                                        title="View review"
                                                    >
                                                        <FiEye size={15} />
                                                    </button>
                                                    {r.status === 'published' ? (
                                                        <button
                                                            type="button"
                                                            disabled={moderateLoading}
                                                            onClick={() => handleQuickModerate(r._id, 'hide', 'Hidden by Admin')}
                                                            className="p-2 text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
                                                            title="Hide Review (Excluded from public storefront)"
                                                        >
                                                            <FiXCircle size={15} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={moderateLoading}
                                                            onClick={() => handleQuickModerate(r._id, 'publish')}
                                                            className="p-2 text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50"
                                                            title="Publish Review (Show publicly)"
                                                        >
                                                            <FiCheckCircle size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION WITH DIRECT JUMP */}
                    {!loading && reviews.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 bg-slate-50/40">
                            <p className="text-xs text-slate-500">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                                {Math.min(currentPage * itemsPerPage, totalReviews)} of {totalReviews} reviews
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {/* Page Jumper */}
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs">
                                    <span className="text-slate-500">Go to:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={jumpPageInput}
                                        onChange={(e) => setJumpPageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const p = parseInt(jumpPageInput);
                                                if (!isNaN(p) && p >= 1 && p <= totalPages) {
                                                    handlePageChange(p);
                                                    setJumpPageInput('');
                                                }
                                            }
                                        }}
                                        placeholder={currentPage.toString()}
                                        className="w-12 text-center text-xs border border-slate-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const p = parseInt(jumpPageInput);
                                            if (!isNaN(p) && p >= 1 && p <= totalPages) {
                                                handlePageChange(p);
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
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-sky-200 text-slate-600 disabled:opacity-40 hover:bg-sky-50 transition"
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>
                                    <span className="px-3 text-xs font-semibold text-slate-700">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-sky-200 text-slate-600 disabled:opacity-40 hover:bg-sky-50 transition"
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {/* QUICK VIEW REVIEW MODAL */}
            {selectedReviewForModal && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                    onClick={() => setSelectedReviewForModal(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                    {selectedReviewForModal.review_code || `#REV-${selectedReviewForModal._id?.slice(-6).toUpperCase()}`}
                                </span>
                                <StatusBadge status={selectedReviewForModal.status} />
                                {selectedReviewForModal.is_edited && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        Edited
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedReviewForModal(null)}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Customer & Product Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Customer</p>
                                    <p className="font-bold text-slate-900 truncate">
                                        {selectedReviewForModal.user_id?.first_name} {selectedReviewForModal.user_id?.last_name || ''}
                                    </p>
                                    <p className="text-slate-500 truncate text-[11px]">{selectedReviewForModal.user_id?.email || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Product</p>
                                    <p className="font-bold text-slate-900 truncate" title={selectedReviewForModal.product_id?.product_name}>
                                        {selectedReviewForModal.product_id?.product_name || 'N/A'}
                                    </p>
                                    <p className="text-slate-500 truncate text-[11px]">{selectedReviewForModal.seller_id?.business_name || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Rating and Date */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <FiStar
                                                key={n}
                                                size={14}
                                                className={
                                                    n <= selectedReviewForModal.rating
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : 'text-slate-300'
                                                }
                                            />
                                        ))}
                                    </div>
                                    <span className="font-bold text-slate-800">{selectedReviewForModal.rating}.0 / 5.0</span>
                                </div>
                                <span className="text-slate-400 text-[11px]">
                                    {formatDate(selectedReviewForModal.created_at)}
                                    {selectedReviewForModal.is_edited && selectedReviewForModal.updated_at && ` (Edited)`}
                                </span>
                            </div>

                            {/* Title & Comment (Edited value only) */}
                            <div className="space-y-1.5">
                                {selectedReviewForModal.title && (
                                    <h4 className="font-bold text-slate-900 text-sm">
                                        "{selectedReviewForModal.title}"
                                    </h4>
                                )}
                                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-line">
                                    {selectedReviewForModal.comment || 'No comment provided.'}
                                </p>
                            </div>

                            {/* Media Photos & Videos */}
                            {((selectedReviewForModal.images && selectedReviewForModal.images.length > 0) || (selectedReviewForModal.videos && selectedReviewForModal.videos.length > 0)) && (
                                <div className="space-y-2 pt-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Attachments ({((selectedReviewForModal.images?.length || 0) + (selectedReviewForModal.videos?.length || 0))})
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {selectedReviewForModal.images?.map((img, idx) => (
                                            <a
                                                key={`adm-img-${idx}`}
                                                href={img}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition block"
                                            >
                                                <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                        {selectedReviewForModal.videos?.map((vid, idx) => (
                                            <a
                                                key={`adm-vid-${idx}`}
                                                href={vid}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xs hover:ring-2 hover:ring-blue-500 transition flex items-center justify-center text-white"
                                            >
                                                <FiPlay className="w-5 h-5 fill-white" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-50 border-t border-slate-100 shrink-0">
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedReviewForModal.status !== 'published' && (
                                    <button
                                        type="button"
                                        disabled={moderateLoading}
                                        onClick={() => handleQuickModerate(selectedReviewForModal._id, 'publish')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                                    >
                                        <FiCheckCircle size={14} />
                                        <span>Publish</span>
                                    </button>
                                )}
                                {selectedReviewForModal.status !== 'hidden' && (
                                    <button
                                        type="button"
                                        disabled={moderateLoading}
                                        onClick={() => handleQuickModerate(selectedReviewForModal._id, 'hide', 'Hidden by Admin')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                                    >
                                        <FiXCircle size={14} />
                                        <span>Hide</span>
                                    </button>
                                )}
                                {selectedReviewForModal.status !== 'rejected' && (
                                    <button
                                        type="button"
                                        disabled={moderateLoading}
                                        onClick={() => handleQuickModerate(selectedReviewForModal._id, 'reject', 'Rejected by Admin')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                                    >
                                        <FiXCircle size={14} />
                                        <span>Reject</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const rId = selectedReviewForModal._id;
                                        setSelectedReviewForModal(null);
                                        navigate(`/admin/reviews/${rId}`);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                                >
                                    <span>Full Details</span>
                                    <FiExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedReviewForModal(null)}
                                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;