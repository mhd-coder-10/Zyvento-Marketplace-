import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiUser,
    FiMail,
    FiPhone,
    FiEdit2,
    FiCamera,
    FiSave,
    FiX,
    FiCheck,
    FiLock,
    FiLogOut,
    FiPackage,
    FiHeart,
    FiStar,
    FiTag,
    FiMapPin,
    FiShoppingBag,
    FiClock,
    FiChevronRight,
    FiShield,
    FiBell,
    FiSettings,
    FiCreditCard,
    FiHelpCircle,
    FiArrowLeft,
    FiSend,
    FiKey,
    FiCompass,
    FiBriefcase,
    FiExternalLink,
    FiCheckCircle,
    FiAlertCircle,
    FiLayers
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';
import { logoutUser, uploadProfileImage } from '../../store/slices/authSlice';
import UserAvatar, { getFullImageUrl } from '../../components/common/UserAvatar';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    
    // Dynamic role calculation
    const userRole = user?.user_type || user?.role || 'customer';
    const isAdmin = ['super_admin', 'sub_admin', 'admin'].includes(userRole);
    const isSeller = ['seller', 'seller_employee'].includes(userRole);
    const isCustomer = !isAdmin && !isSeller;

    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        profile_image: '',
        created_at: '',
        role: 'customer'
    });
    
    const [sellerInfo, setSellerInfo] = useState(null);

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [stats, setStats] = useState({
        orders: 0,
        wishlist: 0,
        reviews: 0,
        addresses: 0,
        revenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);

    // Load profile data
    useEffect(() => {
        if (user) {
            setProfileData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                mobile_number: user.mobile_number || '',
                profile_image: user.profile_image || '',
                created_at: user.created_at || '',
                role: user.user_type || user.role || 'customer'
            });
            setResetEmail(user.email || '');
        }
        loadDashboardData();
    }, [user]);

    // Load dashboard stats and recent data based on role
    const loadDashboardData = async () => {
        try {
            const role = user?.user_type || user?.role || 'customer';
            const userIsSeller = ['seller', 'seller_employee'].includes(role);
            const userIsAdmin = ['super_admin', 'sub_admin', 'admin'].includes(role);

            if (userIsSeller) {
                // Load seller profile & store info
                try {
                    const sellerRes = await ApiService.getSellerProfile();
                    if (sellerRes?.data?.success) {
                        const s = sellerRes.data.data;
                        setSellerInfo(s);
                        setStats(prev => ({
                            ...prev,
                            orders: s.total_orders || 0,
                            revenue: s.total_revenue || 0,
                        }));
                    }
                } catch (err) {
                    console.warn('Could not load seller profile:', err?.message);
                }
            } else if (!userIsAdmin) {
                // Load customer data
                try {
                    const ordersRes = await ApiService.getCustomerOrders({ page: 1, limit: 5 });
                    if (ordersRes?.data?.success) {
                        setStats(prev => ({ ...prev, orders: ordersRes.data.data?.total || 0 }));
                        setRecentOrders(ordersRes.data.data?.orders?.slice(0, 3) || []);
                    }
                } catch (_) {}

                try {
                    const wishlistRes = await ApiService.getWishlist({ page: 1, limit: 1 });
                    if (wishlistRes?.data?.success) {
                        setStats(prev => ({ ...prev, wishlist: wishlistRes.data.data?.total || 0 }));
                    }
                } catch (_) {}

                try {
                    const addrRes = await ApiService.getAddresses();
                    if (addrRes?.data?.success) {
                        const addrs = addrRes.data.data || [];
                        setAddresses(addrs);
                        setStats(prev => ({ ...prev, addresses: addrs.length }));
                    }
                } catch (_) {}
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    // Handle profile update
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                mobile_number: profileData.mobile_number,
            };

            const response = await ApiService.updateProfile(payload);
            if (response.data.success) {
                toast.success('Profile details updated successfully!');
                setIsEditing(false);
                const updatedUser = { ...user, ...profileData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Handle image upload with multiple field support and instant preview
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, WebP)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB');
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);
        formData.append('profile_image', file);
        formData.append('image', file);
        formData.append('file', file);

        setLoading(true);
        try {
            const result = await dispatch(uploadProfileImage(formData));
            if (result.meta?.requestStatus === 'fulfilled') {
                const newImg = result.payload?.profile_image || result.payload?.profileImage || result.payload?.url || result.payload?.user?.profile_image;
                if (newImg) {
                    setImagePreview(newImg);
                    setProfileData(prev => ({ ...prev, profile_image: newImg }));
                    if (user) {
                        const updatedUser = { ...user, profile_image: newImg };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }
                }
            } else {
                toast.error(result.payload || 'Failed to upload image');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New password and confirmation do not match');
            return;
        }

        if (passwordData.new_password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const response = await ApiService.changePassword({
                currentPassword: passwordData.current_password,
                newPassword: passwordData.new_password,
            });

            if (response.data.success) {
                toast.success('Password changed successfully!');
                setShowChangePassword(false);
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        setResetLoading(true);
        try {
            const response = await ApiService.forgotPassword({ email: resetEmail });
            if (response.data.success) {
                toast.success('Password reset email sent! Check your inbox.');
                setShowResetPassword(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        } finally {
            setResetLoading(false);
        }
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        toast.info('Logged out successfully');
        navigate('/login');
    };

    const formatDate = (date) => {
        if (!date) return 'Recently';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & BACK ============ */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-200"
                    >
                        <FiLogOut className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </div>

                {/* ============ ROLE-BASED DASHBOARD SWITCHER BANNER ============ */}
                {isAdmin ? (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-800/40">
                        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30">
                                    <FiShield className="w-3.5 h-3.5" />
                                    {userRole === 'super_admin' ? 'Super Administrator' : 'Administrator Control'}
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                    Admin Command Center
                                </h2>
                                <p className="text-sm text-slate-300 max-w-xl">
                                    Manage platform stores, seller approvals, sub-admins, live catalog, financial audits, and master system settings.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    to="/admin/dashboard"
                                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <FiCompass className="w-4 h-4" />
                                    Launch Admin Dashboard
                                    <FiExternalLink className="w-4 h-4 opacity-70" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : isSeller ? (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 p-6 sm:p-8 text-white shadow-xl shadow-sky-950/20 border border-sky-800/40">
                        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider border border-sky-400/30">
                                    <FiBriefcase className="w-3.5 h-3.5" />
                                    Verified Merchant Store
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                    Seller Merchant Portal
                                </h2>
                                <p className="text-sm text-slate-300 max-w-xl">
                                    Monitor your live store catalog, fulfill customer orders, manage product stock, and track seller payouts.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    to="/seller/dashboard"
                                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-sky-600/30 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <FiShoppingBag className="w-4 h-4" />
                                    Launch Seller Dashboard
                                    <FiExternalLink className="w-4 h-4 opacity-70" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-600/20 border border-blue-400/30">
                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                    <FiTag className="w-3.5 h-3.5" />
                                    Sell on Zyvento
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                    Want to grow your business with Zyvento?
                                </h2>
                                <p className="text-sm text-blue-100 max-w-xl">
                                    Reach millions of buyers across 19,000+ pin codes. Register your store today with 0% setup fee and quick onboarding.
                                </p>
                            </div>
                            <Link
                                to="/become-seller"
                                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-blue-700 font-bold text-sm shadow-lg hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                            >
                                <FiBriefcase className="w-4 h-4 text-blue-600" />
                                Become a Seller
                                <FiChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ============ MAIN PROFILE CARD & STATS ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar with Upload button */}
                            <div className="relative group shrink-0">
                                <UserAvatar
                                    src={imagePreview || profileData.profile_image}
                                    name={`${profileData.first_name || ''} ${profileData.last_name || ''}`}
                                    shape="rounded-2xl"
                                    className="w-24 h-24 sm:w-28 sm:h-28 text-3xl sm:text-4xl font-black shadow-lg shadow-blue-500/20 ring-4 ring-sky-100"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-all hover:scale-110 active:scale-95 z-10"
                                    title="Change Profile Photo"
                                    disabled={loading}
                                >
                                    <FiCamera className="w-4 h-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>

                            {/* User Header Details */}
                            <div className="flex-1 text-center sm:text-left space-y-1.5">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                                        {profileData.first_name || 'User'} {profileData.last_name || ''}
                                    </h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                        isAdmin
                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                            : isSeller
                                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}>
                                        {isSeller ? (userRole === 'seller_employee' ? 'Staff Member' : 'Store Owner') : userRole.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                {isSeller && sellerInfo?.business_name && (
                                    <p className="text-sm font-bold text-blue-600 flex items-center justify-center sm:justify-start gap-1.5">
                                        <FiShoppingBag className="w-4 h-4" />
                                        <span>Store: {sellerInfo.business_name}</span>
                                        {sellerInfo.business_type && (
                                            <span className="text-xs font-semibold text-slate-400 capitalize">({sellerInfo.business_type})</span>
                                        )}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <FiMail className="w-4 h-4 text-slate-400" />
                                        {profileData.email}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiPhone className="w-4 h-4 text-slate-400" />
                                        {profileData.mobile_number || 'No phone added'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium pt-1">
                                    Zyvento member since {formatDate(profileData.created_at)}
                                </p>
                            </div>

                            {/* Edit toggle button */}
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 hover:border-blue-400 text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all shadow-sm self-center sm:self-start"
                            >
                                <FiEdit2 className="w-4 h-4 text-blue-600" />
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                            </button>
                        </div>

                        {/* Inline Edit Form */}
                        {isEditing && (
                            <form onSubmit={handleUpdateProfile} className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profileData.first_name}
                                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profileData.last_name}
                                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileData.mobile_number}
                                        onChange={(e) => setProfileData({ ...profileData, mobile_number: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="sm:col-span-2 flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                                    >
                                        <FiSave className="w-4 h-4" />
                                        {loading ? 'Saving…' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Role-Specific Quick Stats Grid */}
                        {isSeller ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-100">
                                <Link
                                    to="/seller/orders"
                                    className="group p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-100/60 border border-blue-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-blue-600 group-hover:scale-105 transition-transform">
                                        {stats.orders}
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Store Orders</p>
                                </Link>

                                <Link
                                    to="/seller/products"
                                    className="group p-4 rounded-2xl bg-sky-50/50 hover:bg-sky-100/60 border border-sky-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-sky-600 group-hover:scale-105 transition-transform">
                                        <FiPackage className="inline w-7 h-7" />
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">My Products</p>
                                </Link>

                                <Link
                                    to="/seller/earnings"
                                    className="group p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 group-hover:scale-105 transition-transform">
                                        {stats.revenue ? `₹${stats.revenue.toLocaleString()}` : <FiCreditCard className="inline w-7 h-7" />}
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Earnings</p>
                                </Link>

                                <Link
                                    to="/seller/settings"
                                    className="group p-4 rounded-2xl bg-purple-50/50 hover:bg-purple-100/60 border border-purple-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-purple-600 group-hover:scale-105 transition-transform">
                                        <FiSettings className="inline w-7 h-7" />
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Store Settings</p>
                                </Link>
                            </div>
                        ) : isAdmin ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-100">
                                <Link
                                    to="/admin/users"
                                    className="group p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-100/60 border border-blue-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-blue-600 group-hover:scale-105 transition-transform">
                                        <FiUser className="inline w-7 h-7" />
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">All Users</p>
                                </Link>

                                <Link
                                    to="/admin/sellers"
                                    className="group p-4 rounded-2xl bg-sky-50/50 hover:bg-sky-100/60 border border-sky-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-sky-600 group-hover:scale-105 transition-transform">
                                        <FiBriefcase className="inline w-7 h-7" />
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Sellers</p>
                                </Link>

                                <Link
                                    to="/admin/products/approve"
                                    className="group p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 group-hover:scale-105 transition-transform">
                                        <FiCheckCircle className="inline w-7 h-7" />
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Approvals</p>
                                </Link>

                                <Link
                                    to="/admin/roles"
                                    className="group p-4 rounded-2xl bg-purple-50/50 hover:bg-purple-100/60 border border-purple-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-purple-600 group-hover:scale-105 transition-transform">
                                        <FiShield className="inline w-7 h-7" />
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Roles & RBAC</p>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-100">
                                <Link
                                    to="/orders"
                                    className="group p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-100/60 border border-blue-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-blue-600 group-hover:scale-105 transition-transform">
                                        {stats.orders}
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">My Orders</p>
                                </Link>

                                <Link
                                    to="/wishlist"
                                    className="group p-4 rounded-2xl bg-rose-50/50 hover:bg-rose-100/60 border border-rose-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-rose-600 group-hover:scale-105 transition-transform">
                                        {stats.wishlist}
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Wishlist</p>
                                </Link>

                                <Link
                                    to="/addresses"
                                    className="group p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 group-hover:scale-105 transition-transform">
                                        {stats.addresses}
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Saved Addrs</p>
                                </Link>

                                <Link
                                    to="/cart"
                                    className="group p-4 rounded-2xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-100/80 transition-all text-center"
                                >
                                    <p className="text-2xl sm:text-3xl font-black text-amber-600 group-hover:scale-105 transition-transform">
                                        <FiShoppingBag className="inline w-6 h-6 -mt-1" />
                                    </p>
                                    <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">Active Cart</p>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============ NAVIGATION TILES GRID ============ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isSeller ? (
                        <>
                            <Link
                                to="/seller/products"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                        <FiPackage className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Manage Products</h3>
                                        <p className="text-xs text-slate-500">Catalog, stock, prices & variants</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/seller/orders"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FiShoppingBag className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Store Orders</h3>
                                        <p className="text-xs text-slate-500">Fulfill, ship & manage returns</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/seller/earnings"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <FiCreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Earnings & Reports</h3>
                                        <p className="text-xs text-slate-500">Payouts, commission & invoices</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/seller/settings"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <FiSettings className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Store Settings</h3>
                                        <p className="text-xs text-slate-500">Business profile, address & policies</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/seller/dashboard"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <FiCompass className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Merchant Dashboard</h3>
                                        <p className="text-xs text-slate-500">Sales metrics, analytics & trends</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/help-center"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <FiHelpCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Seller Support</h3>
                                        <p className="text-xs text-slate-500">Documentation & merchant assistance</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </>
                    ) : isAdmin ? (
                        <>
                            <Link
                                to="/admin/users"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FiUser className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">User Management</h3>
                                        <p className="text-xs text-slate-500">All registered buyers & staff</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/admin/sellers"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg group-hover:bg-sky-600 group-hover:text-white transition-colors">
                                        <FiBriefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Sellers & Stores</h3>
                                        <p className="text-xs text-slate-500">Verify & manage merchant accounts</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/admin/products/approve"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <FiCheckCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Product Approvals</h3>
                                        <p className="text-xs text-slate-500">Moderate new product submissions</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/admin/roles"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <FiShield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Roles & Access</h3>
                                        <p className="text-xs text-slate-500">Permissions & RBAC security</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/admin/dashboard"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <FiCompass className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Platform Dashboard</h3>
                                        <p className="text-xs text-slate-500">Live platform stats & revenue</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/help-center"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <FiHelpCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Help Center</h3>
                                        <p className="text-xs text-slate-500">Support tickets & system guides</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/orders"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FiPackage className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Your Orders</h3>
                                        <p className="text-xs text-slate-500">Track packages & return items</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/wishlist"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                        <FiHeart className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Your Wishlist</h3>
                                        <p className="text-xs text-slate-500">Saved favorite items & deals</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/addresses"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <FiMapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Saved Addresses</h3>
                                        <p className="text-xs text-slate-500">Delivery locations & pincodes</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/notifications"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <FiBell className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Notifications</h3>
                                        <p className="text-xs text-slate-500">Price alerts & order updates</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/settings"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-400 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                        <FiSettings className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Account Settings</h3>
                                        <p className="text-xs text-slate-500">Preferences & privacy options</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                to="/help-center"
                                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <FiHelpCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">24x7 Help Center</h3>
                                        <p className="text-xs text-slate-500">Customer care & FAQs</p>
                                    </div>
                                </div>
                                <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </>
                    )}
                </div>

                {/* ============ SECURITY & PASSWORD ACCORDION ============ */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                <FiShield className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Security & Credentials</h3>
                                <p className="text-xs text-slate-500">Update your account password or request a reset link</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowChangePassword(!showChangePassword);
                                setShowResetPassword(false);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 text-xs font-bold text-indigo-600 hover:bg-indigo-50/60 transition-all self-start sm:self-auto"
                        >
                            <FiLock className="w-3.5 h-3.5" />
                            {showChangePassword ? 'Close Security' : 'Manage Password'}
                        </button>
                    </div>

                    {showChangePassword && (
                        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Direct Password Update */}
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-900">Update Current Password</h4>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="At least 6 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Updating…' : 'Save New Password'}
                                </button>
                            </form>

                            {/* Forgot Password Link */}
                            <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <FiKey className="text-indigo-600" />
                                    Forgot Your Current Password?
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    We can email a secure one-click reset link to your registered email address ({profileData.email}).
                                </p>
                                {!showResetPassword ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowResetPassword(true)}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                                    >
                                        Send Reset Email
                                    </button>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="space-y-3">
                                        <input
                                            type="email"
                                            required
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {resetLoading ? 'Sending…' : 'Send Link Now'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowResetPassword(false)}
                                                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Profile;
