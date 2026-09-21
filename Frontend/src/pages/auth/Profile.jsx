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
    FiAlertCircle
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';
import { logoutUser } from '../../store/slices/authSlice';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, orders, addresses, security
    
    const [profileData, setProfileData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        profile_image: '',
        created_at: '',
        role: 'customer'
    });
    
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
                role: user.role || 'customer'
            });
            setResetEmail(user.email || '');
        }
        loadDashboardData();
    }, [user]);

    // Load dashboard stats and recent data
    const loadDashboardData = async () => {
        try {
            // Orders
            const ordersRes = await ApiService.getCustomerOrders({ page: 1, limit: 5 });
            if (ordersRes.data.success) {
                setStats(prev => ({ ...prev, orders: ordersRes.data.data.total || 0 }));
                setRecentOrders(ordersRes.data.data.orders?.slice(0, 3) || []);
            }

            // Wishlist
            const wishlistRes = await ApiService.getWishlist({ page: 1, limit: 1 });
            if (wishlistRes.data.success) {
                setStats(prev => ({ ...prev, wishlist: wishlistRes.data.data.total || 0 }));
            }

            // Addresses
            const addrRes = await ApiService.getAddresses();
            if (addrRes.data.success) {
                const addrs = addrRes.data.data || [];
                setAddresses(addrs);
                setStats(prev => ({ ...prev, addresses: addrs.length }));
            }
        } catch (error) {
            console.error('Failed to load profile dashboard data:', error);
        }
    };

    // Handle profile update
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await ApiService.updateProfile({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                mobile_number: profileData.mobile_number,
            });

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

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, WebP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        setLoading(true);
        try {
            const response = await ApiService.uploadProfileImage(formData);
            if (response.data.success) {
                toast.success('Profile avatar updated!');
                const newImg = response.data.data?.profileImage || URL.createObjectURL(file);
                setImagePreview(newImg);
                const updatedUser = { ...user, profile_image: newImg };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setLoading(false);
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
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                confirm_password: passwordData.confirm_password,
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
                toast.success('Password reset link sent to your registered email!');
                setShowResetPassword(false);
                setShowChangePassword(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset link');
        } finally {
            setResetLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser());
            navigate('/login', { replace: true });
        } catch (error) {
            navigate('/login', { replace: true });
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Recently';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const userRole = user?.role || 'customer';
    const isAdmin = userRole === 'super_admin' || userRole === 'sub_admin' || userRole === 'admin';
    const isSeller = userRole === 'seller';

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
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-1 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                                    <div className="w-full h-full rounded-[14px] bg-white overflow-hidden flex items-center justify-center">
                                        {imagePreview || profileData.profile_image ? (
                                            <img
                                                src={imagePreview || profileData.profile_image}
                                                alt="User Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-3xl">
                                                {profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-all hover:scale-110 active:scale-95"
                                    title="Change Avatar"
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
                                        {profileData.first_name || 'Customer'} {profileData.last_name || ''}
                                    </h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        isAdmin
                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                            : isSeller
                                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                    }`}>
                                        {userRole.replace('_', ' ')}
                                    </span>
                                </div>

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
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 font-semibold text-xs transition-all shadow-sm"
                            >
                                {isEditing ? <FiX className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                            </button>
                        </div>

                        {/* Edit Form Drawer */}
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

                        {/* Quick Stats Grid */}
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
                    </div>
                </div>

                {/* ============ NAVIGATION TILES GRID ============ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
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
                        className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
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
                        className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
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
                        className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
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
                        className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group"
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
