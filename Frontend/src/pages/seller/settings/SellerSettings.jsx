import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiSettings,
    FiImage,
    FiUploadCloud,
    FiTrash2,
    FiShoppingBag,
    FiTruck,
    FiRotateCcw,
    FiSave,
    FiRefreshCw,
    FiHome,
    FiCheckCircle,
    FiMail,
    FiPhone,
    FiTag,
    FiAlertCircle,
    FiEye,
    FiToggleLeft,
    FiToggleRight,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import { updateUser } from '../../../store/slices/authSlice';

const SellerSettings = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const logoInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const mounted = useRef(true);

    const [form, setForm] = useState({
        // Branding & Identity
        store_name: '',
        business_name: '',
        tagline: '',
        store_description: '',
        logo: '',
        banner: '',

        // Support & Communication
        support_email: '',
        support_phone: '',
        owner_name: '',

        // Shipping & Fulfillment
        order_processing_time: 24,
        default_shipping_fee: 49,
        free_shipping_min_amount: 999,
        fulfillment_type: 'easy_ship',
        vacation_mode: false,

        // Customer Return Policy
        return_window_days: 7,
        return_policy: '7 days replacement warranty for defective or damaged items.',
    });

    useEffect(() => {
        mounted.current = true;
        fetchSettingsAndProfile();
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchSettingsAndProfile = async () => {
        setLoading(true);
        try {
            // Load both profile and settings concurrently
            const [profileRes, settingsRes] = await Promise.allSettled([
                ApiService.getSellerProfile(),
                ApiService.getSellerSettings ? ApiService.getSellerSettings() : Promise.reject('n/a'),
            ]);

            if (!mounted.current) return;

            let profileData = {};
            let settingsData = {};

            if (profileRes.status === 'fulfilled' && profileRes.value?.data?.data) {
                profileData = profileRes.value.data.data;
            }
            if (settingsRes.status === 'fulfilled' && settingsRes.value?.data?.data) {
                settingsData = settingsRes.value.data.data?.settings || settingsRes.value.data.data || {};
            }

            const mergedSettings = {
                ...(profileData.settings || {}),
                ...settingsData,
            };

            setForm({
                store_name: profileData.store_name || profileData.business_name || '',
                business_name: profileData.business_name || '',
                tagline: profileData.tagline || 'Quality Products & Reliable Delivery',
                store_description: profileData.store_description || profileData.description || '',
                logo: profileData.logo || profileData.user_id?.profile_image || '',
                banner: profileData.banner || '',

                support_email: profileData.email || profileData.contact_email || profileData.user_id?.email || '',
                support_phone: profileData.mobile_number || profileData.contact_phone || profileData.user_id?.mobile_number || '',
                owner_name: profileData.owner_name || `${profileData.user_id?.first_name || ''} ${profileData.user_id?.last_name || ''}`.trim() || '',

                order_processing_time: mergedSettings.order_processing_time || 24,
                default_shipping_fee: mergedSettings.default_shipping_fee ?? 49,
                free_shipping_min_amount: mergedSettings.free_shipping_min_amount ?? 999,
                fulfillment_type: mergedSettings.fulfillment_type || 'easy_ship',
                vacation_mode: mergedSettings.vacation_mode === true,

                return_window_days: mergedSettings.return_window_days || 7,
                return_policy: mergedSettings.return_policy || '7 days replacement warranty for defective or damaged items.',
            });
        } catch (err) {
            console.error('Failed to load settings:', err);
            toast.error('Failed to load store settings');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    // Handle File Upload (Logo)
    const handleLogoFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Logo image must be smaller than 5MB');
            return;
        }

        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append('profileImage', file);
            formData.append('profile_image', file);
            formData.append('image', file);
            formData.append('file', file);

            const res = await ApiService.uploadProfileImage(formData);
            const imgUrl = res?.data?.data?.profile_image || res?.data?.profile_image || res?.data?.data?.url || res?.data?.url;

            if (imgUrl) {
                setForm((prev) => ({ ...prev, logo: imgUrl }));
                toast.success('Store logo uploaded successfully!');
            } else {
                // Fallback to local Data URL for immediate preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setForm((prev) => ({ ...prev, logo: reader.result }));
                    toast.info('Logo preview ready. Click Save Settings to persist.');
                };
                reader.readAsDataURL(file);
            }
        } catch (err) {
            console.error('Logo upload error, using local preview:', err);
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm((prev) => ({ ...prev, logo: reader.result }));
                toast.info('Logo preview loaded. Click Save Settings to save.');
            };
            reader.readAsDataURL(file);
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    // Handle File Upload (Banner)
    const handleBannerFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            toast.error('Banner image must be smaller than 8MB');
            return;
        }

        setUploadingBanner(true);
        try {
            const formData = new FormData();
            formData.append('profileImage', file);
            formData.append('image', file);
            formData.append('file', file);

            const res = await ApiService.uploadProfileImage(formData);
            const imgUrl = res?.data?.data?.profile_image || res?.data?.profile_image || res?.data?.data?.url || res?.data?.url;

            if (imgUrl) {
                setForm((prev) => ({ ...prev, banner: imgUrl }));
                toast.success('Store banner uploaded successfully!');
            } else {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setForm((prev) => ({ ...prev, banner: reader.result }));
                    toast.info('Banner preview ready. Click Save Settings to persist.');
                };
                reader.readAsDataURL(file);
            }
        } catch (err) {
            console.error('Banner upload fallback to data URL:', err);
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm((prev) => ({ ...prev, banner: reader.result }));
                toast.info('Banner preview loaded. Click Save Settings to save.');
            };
            reader.readAsDataURL(file);
        } finally {
            setUploadingBanner(false);
            if (bannerInputRef.current) bannerInputRef.current.value = '';
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const profilePayload = {
                store_name: form.store_name?.trim() || form.business_name?.trim(),
                business_name: form.business_name?.trim() || form.store_name?.trim(),
                tagline: form.tagline?.trim(),
                store_description: form.store_description?.trim(),
                logo: form.logo || null,
                banner: form.banner || null,
                owner_name: form.owner_name?.trim(),
                email: form.support_email?.trim() || undefined,
                mobile_number: form.support_phone?.trim() || undefined,
                settings: {
                    order_processing_time: Number(form.order_processing_time),
                    return_policy: form.return_policy,
                    default_shipping_fee: Number(form.default_shipping_fee),
                    fulfillment_type: form.fulfillment_type,
                    vacation_mode: form.vacation_mode,
                    shipping_methods: [
                        {
                            name: 'Standard Delivery',
                            cost: Number(form.default_shipping_fee),
                            estimated_days: 3,
                        },
                    ],
                },
            };

            // 1. Update seller profile (which includes branding, logo, banner, and settings)
            await ApiService.updateSellerProfile(profilePayload);

            // 2. Also call updateSellerSettings to guarantee settings sync
            try {
                await ApiService.updateSellerSettings({
                    order_processing_time: Number(form.order_processing_time),
                    return_policy: form.return_policy,
                    default_shipping_fee: Number(form.default_shipping_fee),
                    fulfillment_type: form.fulfillment_type,
                    vacation_mode: form.vacation_mode,
                    shipping_methods: [
                        {
                            name: 'Standard Delivery',
                            cost: Number(form.default_shipping_fee),
                            estimated_days: 3,
                        },
                    ],
                });
            } catch (settingsErr) {
                // Profile update already handled settings, ignore secondary error
            }

            // 3. Refresh user state in Redux so avatar & store name sync in header & sidebar
            try {
                dispatch(updateUser({
                    profile_image: form.logo || undefined,
                    business_name: form.store_name || form.business_name,
                }));
            } catch (userErr) {
                // Ignore
            }

            toast.success('Store branding & settings updated successfully!');
        } catch (err) {
            console.error('Failed to update settings:', err);
            toast.error(err.response?.data?.message || 'Failed to update store settings');
        } finally {
            setSaving(false);
        }
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
                        Settings
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FiSettings className="text-blue-600 w-7 h-7" />
                            <span>Store Settings & Branding</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Customize your public storefront, logo, banners, customer support, and order fulfillment policies.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={fetchSettingsAndProfile}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <FiSave className="w-4 h-4" />
                            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden file inputs for logo & banner upload */}
            <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoFileChange}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
            />
            <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerFileChange}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
            />

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-6 text-left">
                {/* 1. Store Identity & Visual Branding */}
                <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <FiImage className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Store Identity & Visual Branding
                            </h2>
                            <p className="text-xs text-slate-400">
                                This logo and banner appear directly to customers across product listings and your storefront.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Store Logo */}
                        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                            <label className="text-xs font-bold text-slate-700 mb-2">Store Logo</label>
                            <div className="relative group w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-sky-200 flex items-center justify-center overflow-hidden shadow-xs mb-3">
                                {form.logo ? (
                                    <img
                                        src={form.logo}
                                        alt="Store Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-sky-400 to-blue-600 text-white font-black text-3xl flex items-center justify-center">
                                        {(form.store_name || form.business_name || 'S')[0]?.toUpperCase()}
                                    </div>
                                )}

                                {uploadingLogo && (
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-semibold">
                                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                                    </div>
                                )}
                            </div>

                            <p className="text-[11px] text-slate-400 mb-3">Square PNG or JPG (recommended 400x400px)</p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={uploadingLogo}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-sky-50 transition-all shadow-xs"
                                >
                                    <FiUploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload Logo</span>
                                </button>

                                {form.logo && (
                                    <button
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, logo: '' }))}
                                        className="p-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                        title="Remove Logo"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="w-full mt-3">
                                <input
                                    type="url"
                                    value={form.logo}
                                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                                    placeholder="Or paste Logo Image URL"
                                    className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none bg-white"
                                />
                            </div>
                        </div>

                        {/* Store Banner */}
                        <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-700">Store Showcase Banner</label>
                                    <span className="text-[11px] text-slate-400">1200x300px Wide Format</span>
                                </div>

                                <div className="relative group w-full h-32 rounded-xl bg-white border-2 border-dashed border-sky-200 flex items-center justify-center overflow-hidden shadow-xs mb-3">
                                    {form.banner ? (
                                        <img
                                            src={form.banner}
                                            alt="Store Banner"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center text-slate-400">
                                            <FiImage className="w-8 h-8 text-sky-400 mb-1" />
                                            <span className="text-xs font-semibold text-slate-600">No Banner Uploaded</span>
                                            <span className="text-[10px] text-slate-400">Upload a storefront banner image to engage customers</span>
                                        </div>
                                    )}

                                    {uploadingBanner && (
                                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-semibold">
                                            <FiRefreshCw className="w-6 h-6 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => bannerInputRef.current?.click()}
                                    disabled={uploadingBanner}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-sky-50 transition-all shadow-xs"
                                >
                                    <FiUploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload Banner</span>
                                </button>

                                {form.banner && (
                                    <button
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, banner: '' }))}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                        <span>Remove Banner</span>
                                    </button>
                                )}

                                <div className="flex-1 w-full">
                                    <input
                                        type="url"
                                        value={form.banner}
                                        onChange={(e) => setForm({ ...form, banner: e.target.value })}
                                        placeholder="Or paste Banner Image URL"
                                        className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-100 outline-none bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Store Name, Tagline & Description */}
                    <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Public Store Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.store_name}
                                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                                placeholder="e.g. Zyvento Prime Electronics"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">This name is displayed to customers on product pages.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Store Tagline / Slogan
                            </label>
                            <input
                                type="text"
                                value={form.tagline}
                                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                                placeholder="e.g. Quality Products & Reliable Delivery"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Short headline shown beside your store badge.</p>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Store About / Bio
                            </label>
                            <textarea
                                rows={3}
                                value={form.store_description}
                                onChange={(e) => setForm({ ...form, store_description: e.target.value })}
                                placeholder="Tell customers about your brand story, product quality, and commitment..."
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Customer Support & Contact */}
                <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <FiMail className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Customer Support & Direct Communication
                            </h2>
                            <p className="text-xs text-slate-400">Contact information provided on order invoices and customer query tickets.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Store Support Email
                            </label>
                            <input
                                type="email"
                                value={form.support_email}
                                onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                                placeholder="support@yourbrand.com"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Support Phone Number
                            </label>
                            <input
                                type="text"
                                value={form.support_phone}
                                onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
                                placeholder="+91 98765 43210"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Primary Contact / Manager
                            </label>
                            <input
                                type="text"
                                value={form.owner_name}
                                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                                placeholder="Full name of store manager"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Shipping & Fulfillment Settings */}
                <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <FiTruck className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Shipping & Order Fulfillment Rules
                            </h2>
                            <p className="text-xs text-slate-400">Settings applied during checkout and delivery dispatch calculation.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Order Processing / Packing Time
                            </label>
                            <select
                                value={form.order_processing_time}
                                onChange={(e) => setForm({ ...form, order_processing_time: Number(e.target.value) })}
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none bg-white"
                            >
                                <option value={12}>12 Hours (Same Day Dispatch)</option>
                                <option value={24}>24 Hours (Next Day Dispatch)</option>
                                <option value={48}>48 Hours (2 Business Days)</option>
                                <option value={72}>72 Hours (3 Business Days)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Default Shipping Charge (₹)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.default_shipping_fee}
                                onChange={(e) => setForm({ ...form, default_shipping_fee: Number(e.target.value) })}
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Fulfillment Model
                            </label>
                            <select
                                value={form.fulfillment_type}
                                onChange={(e) => setForm({ ...form, fulfillment_type: e.target.value })}
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none bg-white"
                            >
                                <option value="easy_ship">Easy Ship (Platform Courier Pickup)</option>
                                <option value="self_ship">Self Ship (Merchant Arranged)</option>
                            </select>
                        </div>
                    </div>

                    {/* Vacation / Maintenance Mode Toggle */}
                    <div className="mt-5 p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-800">Holiday / Vacation Mode</p>
                            <p className="text-[11px] text-slate-500">Temporarily hide your products or mark orders paused during store holidays.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, vacation_mode: !form.vacation_mode })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                form.vacation_mode
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                        >
                            {form.vacation_mode ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                            <span>{form.vacation_mode ? 'Vacation Active' : 'Store Active'}</span>
                        </button>
                    </div>
                </div>

                {/* 4. Returns & Customer Satisfaction Policy */}
                <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                    <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <FiRotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Returns & Replacement Policy
                            </h2>
                            <p className="text-xs text-slate-400">Rules governing product returns displayed to customers on product pages.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Return Policy Statement (Customer-Facing)
                            </label>
                            <textarea
                                rows={3}
                                required
                                value={form.return_policy}
                                onChange={(e) => setForm({ ...form, return_policy: e.target.value })}
                                placeholder="Explain your return conditions, replacement window, and process..."
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Bar */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/seller/profile')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
                    >
                        View Full Profile
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all disabled:opacity-50 active:scale-95"
                    >
                        <FiSave className="w-4 h-4" />
                        <span>{saving ? 'Saving...' : 'Save All Settings & Branding'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SellerSettings;
