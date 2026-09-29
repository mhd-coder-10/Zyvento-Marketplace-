
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft,
    FiEdit2,
    FiMail,
    FiShield,
    FiPhone,
    FiMapPin,
    FiBriefcase,
    FiCalendar,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiUser,
    FiUsers,
    FiPackage,
    FiStar,
    FiRefreshCw,
    FiAlertCircle,
    FiFileText,
    FiShoppingBag,
    FiActivity,
    FiTrendingUp,
    FiDollarSign,
    FiHash,
    FiEye,
    FiTag,
    FiExternalLink,
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import UserAvatar from '../../../components/common/UserAvatar';
// import {toast} from 'react-toastify';


/* ================= STATUS CONFIG ================= */

const STATUS_BADGE_STYLES = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-50 text-slate-600 border-slate-200',
    suspended: 'bg-rose-50 text-rose-700 border-rose-200',
};

const VERIFICATION_STYLES = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    under_review: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    suspended: 'bg-orange-50 text-orange-700 border-orange-200',
};

/* ================= HELPERS ================= */

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(value || 0);

const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/* ================= SMALL COMPONENTS ================= */

const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors min-w-0">
        <div className="mt-0.5 text-blue-600 shrink-0">{icon}</div>
        <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-slate-900 break-words">{value || 'N/A'}</p>
        </div>
    </div>
);

const StatCard = ({ icon, title, value, subtext, color }) => (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1 truncate">{title}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{value}</h3>
                {subtext && <p className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate">{subtext}</p>}
            </div>
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${color}`}>{icon}</div>
        </div>
    </div>
);

const EmptyTab = ({ icon, title, subtitle }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="p-4 bg-sky-50 rounded-full mb-4">{icon}</div>
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
);

const StatusBadge = ({ status }) => (
    <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold capitalize ${STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.pending
            }`}
    >
        {status || 'pending'}
    </span>
);

const VerificationBadge = ({ status }) => (
    <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold capitalize ${VERIFICATION_STYLES[status] || VERIFICATION_STYLES.pending
            }`}
    >
        <FiCheckCircle size={11} />
        {status?.replace(/_/g, ' ') || 'pending'}
    </span>
);

/* ================= MAIN COMPONENT ================= */

const SellerDetails = () => {
    const { sellerCode } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);


    /* ================= FETCH ================= */
    const fetchDetails = useCallback(async (silent = false) => {
        if (!sellerCode) return;

        // Only show full-page loader on initial load, not on refresh
        if (!silent) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        if (silent) {
            toast.success('Data refreshed');
        }
        setError('');
        try {
            const res = await ApiService.getSellerByCode(sellerCode);
            const payload = res?.data?.data || res?.data || null;
            if (!payload || !payload.seller) {
                setError('Seller not found');
                setData(null);
            } else {
                setData(payload);
            }
        } catch (err) {
            console.error('Error fetching seller:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to load seller');
            toast.error('Failed to load seller details');
        } finally {
            if (!silent) {
                setLoading(false);
            } else {
                setRefreshing(false);
            }
        }
    }, [sellerCode]);


    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);


    /* ================= LOADING ================= */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center from-sky-50 via-[#eaf4ff] to-white">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-700 font-medium">Loading seller details...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertCircle size={38} className="text-sky-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Could not load seller</h2>
                    <p className="text-slate-600 mb-6 text-sm">{error || 'Seller not found'}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={fetchDetails}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-sky-200 text-slate-800 rounded-xl hover:bg-sky-50 font-medium"
                        >
                            <FiRefreshCw size={16} /> Retry
                        </button>
                        <button
                            onClick={() => navigate('/admin/sellers')}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                        >
                            Back to Sellers
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const seller = data.seller || {};
    const products = data.products || [];
    const activities = data.activities || [];
    const complaintsList = data.complaintsList || [];
    const statistics = data.statistics || {};
    const reviews = statistics.reviews || {};
    const complaints = statistics.complaints || {};
    const recentOrders = data.recentOrders || [];
    const recentReviews = data.recentReviews || [];

    const initials = (seller.business_name || 'S').charAt(0).toUpperCase();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <FiBriefcase size={16} /> },
        { id: 'products', label: `Products (${products.length})`, icon: <FiPackage size={16} /> },
        { id: 'reviews', label: `Reviews (${reviews.totalReviews || 0})`, icon: <FiStar size={16} /> },
        { id: 'complaints', label: `Complaints (${complaints.total || complaintsList.length})`, icon: <FiAlertCircle size={16} /> },
        { id: 'activity', label: `Activity (${activities.length})`, icon: <FiActivity size={16} /> },
    ];

    return (
        <div className="min-h-screen from-sky-50 via-[#eaf4ff] to-white pb-10">

            {/* HEADER */}
            <AdminTopbar
                title="Seller Details"
                subtitle={seller.business_name}
                actions={
                    <div className="flex items-center gap-2">

                        <button
                            onClick={() => fetchDetails(true)}
                            disabled={refreshing}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 sm:px-4 disabled:opacity-60"
                        >
                            <FiRefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
                        </button>

                        <button onClick={() => navigate(`/admin/sellers/edit/${sellerCode}`)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02]">
                            <FiEdit2 className="w-5 h-5" /> Edit Seller
                        </button>
                    </div>
                }
            />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 space-y-5">

                {/* ========== SELLER PROFILE CARD ========== */}
                <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500" />

                    <div className="p-5 sm:p-6">

                        {/* ========== DESKTOP LAYOUT ========== */}
                        <div className="hidden lg:flex lg:items-center gap-6">
                            {/* Left: Avatar */}
                            <div className="relative shrink-0">
                                <UserAvatar
                                    src={seller.logo || seller.profile_image || seller.user_id?.profile_image}
                                    name={seller.business_name}
                                    shape="rounded-2xl"
                                    className="w-24 h-24 text-3xl font-black shadow-lg ring-4 ring-sky-100"
                                />
                                <span
                                    className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-4 border-white ${String(seller.account_status || '').toLowerCase() === 'active'
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-400'
                                        }`}
                                />
                            </div>

                            {/* Middle: Name + Owner + Badges (CENTERED) */}
                            <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2 text-center">
                                <h2
                                    className="w-full truncate"
                                    style={{
                                        color: '#020617',
                                        WebkitTextFillColor: '#020617',
                                        fontWeight: 900,
                                        fontSize: '1.5rem',
                                        lineHeight: '2rem',
                                        letterSpacing: '-0.025em',
                                        opacity: 1,
                                        filter: 'none',
                                        mixBlendMode: 'normal',
                                    }}
                                >
                                    {seller.business_name || 'Unnamed Business'}
                                </h2>
                                <p
                                    className="text-sm mt-1 w-full truncate"
                                    style={{ color: '#475569' }}
                                >
                                    {seller.owner_name || 'Owner N/A'} • {seller.business_type || 'Individual'}
                                </p>

                                {/* Badges Centered Below */}
                                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                                    <StatusBadge status={seller.account_status} />
                                    <VerificationBadge status={seller.verification_status} />
                                </div>
                            </div>

                            {/* Right: Seller Code + Joined Date Cards */}
                            <div className="grid grid-cols-1 gap-2 w-64 shrink-0">

                                {/* Seller Code Card */}
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl">
                                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                        <FiHash className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 text-start ml-2.5">
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wider"
                                            style={{ color: '#64748b' }}
                                        >
                                            Seller Code
                                        </p>
                                        <p
                                            className="text-sm font-mono font-bold truncate"
                                            style={{ color: '#1d4ed8' }}
                                        >
                                            {seller.seller_code || sellerCode}
                                        </p>
                                    </div>
                                </div>

                                {/* Joined Date Card */}
                                {seller.created_at && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                            <FiClock className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div className="min-w-0 text-start ml-2.5">
                                            <p
                                                className="text-[10px] font-bold uppercase tracking-wider"
                                                style={{ color: '#64748b' }}
                                            >
                                                Joined
                                            </p>
                                            <p
                                                className="text-sm font-semibold truncate"
                                                style={{ color: '#0f172a' }}
                                            >
                                                {new Date(seller.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ========== MOBILE LAYOUT ========== */}
                        <div className="flex flex-col lg:hidden">
                            {/* Avatar */}
                            <div className="flex justify-center">
                                <div className="relative shrink-0">
                                    <UserAvatar
                                        src={seller.logo || seller.profile_image || seller.user_id?.profile_image}
                                        name={seller.business_name}
                                        shape="rounded-2xl"
                                        className="w-24 h-24 text-3xl font-black shadow-lg ring-4 ring-sky-100"
                                    />
                                    <span
                                        className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-4 border-white ${String(seller.account_status || '').toLowerCase() === 'active'
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-400'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Centered Name + Owner + Badges */}
                            <div className="text-center mt-4">
                                <h2
                                    className="truncate"
                                    style={{
                                        color: '#020617',
                                        WebkitTextFillColor: '#020617',
                                        fontWeight: 900,
                                        fontSize: '1.35rem',
                                        lineHeight: '1.85rem',
                                        letterSpacing: '-0.025em',
                                        opacity: 1,
                                        filter: 'none',
                                        mixBlendMode: 'normal',
                                    }}
                                >
                                    {seller.business_name || 'Unnamed Business'}
                                </h2>

                                <p
                                    className="truncate text-sm mt-1"
                                    style={{ color: '#475569' }}
                                >
                                    {seller.owner_name || 'Owner N/A'} • {seller.business_type || 'Individual'}
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                                    <StatusBadge status={seller.account_status} />
                                    <VerificationBadge status={seller.verification_status} />
                                </div>
                            </div>

                            {/* ========== User Code + Joined Cards (Like UserDetails) ========== */}
                            <div className="grid grid-cols-1 gap-2 mt-5">
                                {/* Seller Code Card */}
                                <div className="flex gap-3 p-3 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-xl">
                                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                        <FiHash className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1 text-start ml-4">
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-wider"
                                            style={{ color: '#64748b' }}
                                        >
                                            Seller Code
                                        </p>
                                        <p
                                            className="text-sm font-mono font-bold truncate"
                                            style={{ color: '#1d4ed8' }}
                                        >
                                            {seller.seller_code || sellerCode}
                                        </p>
                                    </div>
                                </div>

                                {/* Joined Date Card */}
                                {seller.created_at && (
                                    <div className="flex text-start  items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                            <FiClock className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div className="min-w-0 flex-1 ml-4">
                                            <p
                                                className="text-[10px] font-bold uppercase tracking-wider"
                                                style={{ color: '#64748b' }}
                                            >
                                                Joined
                                            </p>
                                            <p
                                                className="text-sm font-semibold truncate"
                                                style={{ color: '#0f172a' }}
                                            >
                                                {new Date(seller.created_at).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ========== STATS ========== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                    <StatCard
                        icon={<FiPackage size={20} className="text-blue-600" />}
                        title="Products"
                        value={statistics.totalProducts || 0}
                        subtext={`${statistics.activeProducts || 0} active`}
                        color="bg-blue-100"
                    />
                    <StatCard
                        icon={<FiShoppingBag size={20} className="text-purple-600" />}
                        title="Total Orders"
                        value={statistics.totalOrders || 0}
                        subtext="Lifetime orders"
                        color="bg-purple-100"
                    />
                    <StatCard
                        icon={<FiStar size={20} className="text-amber-600" />}
                        title="Avg Rating"
                        value={reviews.averageRating ? reviews.averageRating.toFixed(1) : '0.0'}
                        subtext={`${reviews.totalReviews || 0} reviews`}
                        color="bg-amber-100"
                    />
                    <StatCard
                        icon={<FiAlertCircle size={20} className="text-rose-600" />}
                        title="Complaints"
                        value={complaints.total || 0}
                        subtext={`${complaints.pending || 0} pending`}
                        color="bg-rose-100"
                    />
                </div>

                {/* ========== TABS ========== */}
                <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-1 sm:gap-2 p-3 sm:p-4 border-b border-sky-100 overflow-x-auto">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id
                                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-200'
                                    : 'text-slate-700 hover:bg-sky-50'
                                    }`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 sm:p-6">
                        {/* OVERVIEW */}
                        {activeTab === 'overview' && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5"
                            >
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <FaStore className="text-blue-600" /> Business & Brand Identity
                                    </h3>
                                    <InfoRow icon={<FiTag size={16} />} label="Brand Name" value={seller.brand_name || 'N/A'} />
                                    <InfoRow icon={<FaStore size={16} />} label="Public Store Name" value={seller.store_name || seller.business_name} />
                                    <InfoRow icon={<FiBriefcase size={16} />} label="Legal Business Name" value={seller.business_name} />
                                    <InfoRow icon={<FiBriefcase size={16} />} label="Business Type" value={seller.business_type} />
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <FiUser className="text-blue-600" /> Owner & Contact Information
                                    </h3>
                                    <InfoRow icon={<FiUser size={16} />} label="Owner Name" value={seller.owner_name} />
                                    <InfoRow icon={<FiMail size={16} />} label="Official Email" value={seller.email} />
                                    <InfoRow icon={<FiPhone size={16} />} label="Official Phone" value={seller.mobile_number} />
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <FiMapPin className="text-blue-600" /> Address & Registration
                                    </h3>
                                    <InfoRow
                                        icon={<FiMapPin size={16} />}
                                        label="Street"
                                        value={seller.business_address?.street}
                                    />
                                    <InfoRow
                                        icon={<FiMapPin size={16} />}
                                        label="City / State"
                                        value={`${seller.business_address?.city || ''} ${seller.business_address?.state || ''}`.trim()}
                                    />
                                    <InfoRow
                                        icon={<FiFileText size={16} />}
                                        label="GST Number"
                                        value={seller.gst_number}
                                    />
                                    <InfoRow
                                        icon={<FiFileText size={16} />}
                                        label="PAN Number"
                                        value={seller.pan_number}
                                    />
                                    <InfoRow
                                        icon={<FiShield size={16} />}
                                        label="Commission Rate"
                                        value={`${seller.commission_rate || 10}%`}
                                    />
                                </div>
                            </motion.div>
                        )}


                        {/* PRODUCTS */}
                        {activeTab === 'products' && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <FiPackage className="text-blue-600" />
                                            Seller Products Catalog ({products.length})
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            All products created and managed by this seller
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                            {products.filter(p => p.status === 'active').length} Active
                                        </span>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                            {products.filter(p => p.status !== 'active').length} Inactive / Draft
                                        </span>
                                    </div>
                                </div>

                                {products.length === 0 ? (
                                    <EmptyTab
                                        icon={<FiPackage size={28} className="text-sky-500" />}
                                        title="No Products Created Yet"
                                        subtitle="This seller has not created any products in their catalog."
                                    />
                                ) : (
                                    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                                        <table className="w-full min-w-[750px] divide-y divide-slate-100">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Price / MRP</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Approval</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {products.map((p) => {
                                                    const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : (p.image || '');
                                                    const stockQty = p.inventory?.stock_quantity ?? p.stock_quantity ?? 0;
                                                    return (
                                                        <tr key={p._id} className="hover:bg-sky-50/40 transition-colors">
                                                            <td className="px-4 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                        {imgUrl ? (
                                                                            <img src={imgUrl} alt={p.product_name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <FiPackage className="text-slate-400 w-5 h-5" />
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 max-w-xs">
                                                                        <p className="text-xs font-bold text-slate-900 truncate" title={p.product_name}>
                                                                            {p.product_name}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            {p.sku && (
                                                                                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                                                                    SKU: {p.sku}
                                                                                </span>
                                                                            )}
                                                                            {p.brand && (
                                                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                                                                    {p.brand}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-xs text-slate-600">
                                                                <div className="font-semibold text-slate-800">
                                                                    {p.category_id?.category_name || 'Uncategorized'}
                                                                </div>
                                                                {p.sub_category_id?.sub_category_name && (
                                                                    <div className="text-[11px] text-slate-400">
                                                                        {p.sub_category_id.sub_category_name}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-right">
                                                                <div className="text-xs font-bold text-slate-900">
                                                                    {formatCurrency(p.final_price || p.price)}
                                                                </div>
                                                                {p.mrp && p.mrp > (p.final_price || p.price) && (
                                                                    <div className="text-[10px] text-slate-400 line-through">
                                                                        {formatCurrency(p.mrp)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${stockQty <= 0
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    : stockQty <= 5
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    }`}>
                                                                    {stockQty} in stock
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <StatusBadge status={p.status} />
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <VerificationBadge status={p.approval_status || 'approved'} />
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-xs text-slate-500 whitespace-nowrap">
                                                                {formatDate(p.created_at)}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                                <a
                                                                    href={`/products/${p._id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-sky-50 text-blue-600 text-xs font-semibold transition-colors"
                                                                    title="View on store"
                                                                >
                                                                    <FiEye size={12} />
                                                                    <span>View</span>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* REVIEWS */}
                        {activeTab === 'reviews' && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-5"
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500">Total</p>
                                        <p className="text-xl font-bold text-slate-900">
                                            {reviews.totalReviews || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-xl">
                                        <p className="text-xs text-slate-500">Average</p>
                                        <p className="text-xl font-bold text-amber-700">
                                            {reviews.averageRating ? reviews.averageRating.toFixed(1) : '0.0'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-xl">
                                        <p className="text-xs text-slate-500">5 Star</p>
                                        <p className="text-xl font-bold text-emerald-700">
                                            {reviews.fiveStar || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl">
                                        <p className="text-xs text-slate-500">4 Star</p>
                                        <p className="text-xl font-bold text-blue-700">
                                            {reviews.fourStar || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-xl">
                                        <p className="text-xs text-slate-500">3 Star</p>
                                        <p className="text-xl font-bold text-orange-700">
                                            {reviews.threeStar || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-rose-50 rounded-xl">
                                        <p className="text-xs text-slate-500">1-2 Star</p>
                                        <p className="text-xl font-bold text-rose-700">
                                            {(reviews.oneStar || 0) + (reviews.twoStar || 0)}
                                        </p>
                                    </div>
                                </div>

                                {recentReviews.length === 0 ? (
                                    <EmptyTab
                                        icon={<FiStar size={28} className="text-sky-500" />}
                                        title="No reviews yet"
                                        subtitle="Customer reviews will appear here once they start coming in."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-700">
                                            Recent Reviews
                                        </h4>
                                        {recentReviews.map((r) => (
                                            <div
                                                key={r._id}
                                                className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex">
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
                                                        </div>
                                                        <span className="text-xs text-slate-500">
                                                            {r.user_id?.first_name} {r.user_id?.last_name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-400">
                                                        {formatDate(r.created_at)}
                                                    </span>
                                                </div>
                                                {r.title && (
                                                    <p className="font-medium text-slate-800 text-sm mb-1">
                                                        {r.title}
                                                    </p>
                                                )}
                                                {r.comment && (
                                                    <p className="text-sm text-slate-600">{r.comment}</p>
                                                )}
                                                <p className="text-xs text-slate-400 mt-2">
                                                    Product: {r.product_id?.product_name || 'N/A'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* COMPLAINTS */}
                        {activeTab === 'complaints' && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {complaints.total === 0 ? (
                                    <EmptyTab
                                        icon={<FiAlertCircle size={28} className="text-emerald-500" />}
                                        title="No complaints"
                                        subtitle="This seller has a clean record."
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                        <div className="p-4 bg-amber-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Pending</p>
                                            <p className="text-xl font-bold text-amber-700">
                                                {complaints.pending || 0}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Under Review</p>
                                            <p className="text-xl font-bold text-blue-700">
                                                {complaints.under_review || 0}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Resolved</p>
                                            <p className="text-xl font-bold text-emerald-700">
                                                {complaints.resolved || 0}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-rose-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Rejected</p>
                                            <p className="text-xl font-bold text-rose-700">
                                                {complaints.rejected || 0}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl">
                                            <p className="text-xs text-slate-500">Escalated</p>
                                            <p className="text-xl font-bold text-slate-700">
                                                {complaints.escalated || 0}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {complaintsList.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-800 mb-3">
                                            Recent Complaints ({complaintsList.length})
                                        </h4>
                                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                            <table className="w-full min-w-[600px] divide-y divide-slate-100">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Complaint Code</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Subject</th>
                                                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                                                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {complaintsList.map((c) => (
                                                        <tr key={c._id} className="hover:bg-sky-50/40">
                                                            <td className="px-4 py-3 text-xs font-mono font-bold text-blue-600">
                                                                {c.complaint_code || c._id}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-slate-800">
                                                                {c.user_id ? `${c.user_id.first_name || ''} ${c.user_id.last_name || ''}`.trim() || c.user_id.email : 'Customer'}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                                                                {c.subject || c.description || 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <StatusBadge status={c.status} />
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">
                                                                {formatDate(c.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ACTIVITY */}
                        {activeTab === 'activity' && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Account Milestones Card */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                                    <InfoRow
                                        icon={<FiCalendar size={16} />}
                                        label="Account created"
                                        value={formatDateTime(seller.created_at)}
                                    />
                                    <InfoRow
                                        icon={<FiActivity size={16} />}
                                        label="Last profile update"
                                        value={formatDateTime(seller.updated_at)}
                                    />
                                    {seller.approved_at && (
                                        <InfoRow
                                            icon={<FiCheckCircle size={16} />}
                                            label="Approved on"
                                            value={formatDateTime(seller.approved_at)}
                                        />
                                    )}
                                    {seller.approved_by && (
                                        <InfoRow
                                            icon={<FiUser size={16} />}
                                            label="Approved by"
                                            value={`${seller.approved_by.first_name || ''} ${seller.approved_by.last_name || ''}`.trim()}
                                        />
                                    )}
                                </div>

                                {/* Dynamic Live Activity Audit Timeline */}
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                <FiActivity className="text-blue-600" />
                                                Live Activity & Audit History ({activities.length})
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                Chronological events recorded across products, account, and orders
                                            </p>
                                        </div>
                                    </div>

                                    {activities.length === 0 ? (
                                        <EmptyTab
                                            icon={<FiActivity size={28} className="text-sky-500" />}
                                            title="No Activity Logs Yet"
                                            subtitle="Activity logs will appear automatically as the seller creates products, updates profile, or processes orders."
                                        />
                                    ) : (
                                        <div className="space-y-2.5">
                                            {activities.map((act) => {
                                                const actionType = act.action?.toLowerCase() || 'update';
                                                const badgeColor =
                                                    actionType === 'create'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : actionType === 'delete'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : actionType === 'upload'
                                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                                : actionType === 'approve'
                                                                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                                                                    : 'bg-blue-50 text-blue-700 border-blue-200';

                                                const userName = act.user_id
                                                    ? `${act.user_id.first_name || ''} ${act.user_id.last_name || ''}`.trim() || act.user_id.email
                                                    : 'Seller User';

                                                return (
                                                    <div
                                                        key={act._id}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/50 transition-colors shadow-xs"
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className="mt-0.5 shrink-0">
                                                                <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${badgeColor}`}>
                                                                    {act.action}
                                                                </span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words">
                                                                    {act.description || `${act.action} on ${act.module}`}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                                                    <span className="font-semibold text-slate-700">By: {userName}</span>
                                                                    {act.user_type && (
                                                                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 capitalize">
                                                                            {act.user_type.replace(/_/g, ' ')}
                                                                        </span>
                                                                    )}
                                                                    {act.module && (
                                                                        <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">
                                                                            {act.module}
                                                                        </span>
                                                                    )}
                                                                    {act.ip_address && (
                                                                        <span className="text-slate-400 font-mono text-[10px]">
                                                                            IP: {act.ip_address}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 text-left sm:text-right text-[11px] text-slate-400 whitespace-nowrap">
                                                            {formatDateTime(act.created_at)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {recentOrders.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-800 mb-3">
                                            Recent Orders ({recentOrders.length})
                                        </h4>
                                        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                                            <table className="w-full min-w-[600px] divide-y divide-slate-100">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                                                            Order
                                                        </th>
                                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
                                                            Status
                                                        </th>
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
                                                            Date
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {recentOrders.map((o) => (
                                                        <tr key={o._id} className="hover:bg-sky-50/40">
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                                                {o.order_code || o.order_number}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right font-bold text-slate-900">
                                                                {formatCurrency(o.total_amount)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <StatusBadge status={o.order_status} />
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-xs text-slate-500 whitespace-nowrap">
                                                                {formatDate(o.created_at)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDetails;