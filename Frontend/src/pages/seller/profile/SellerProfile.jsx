import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FiUser,
    FiBriefcase,
    FiMapPin,
    FiCreditCard,
    FiSave,
    FiRefreshCw,
    FiHome,
    FiMail,
    FiPhone,
    FiCheckCircle,
    FiImage,
    FiTag,
    FiSettings,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import { updateUser } from '../../../store/slices/authSlice';

const BUSINESS_TYPES = [
    { value: 'individual', label: 'Individual / Sole Proprietorship' },
    { value: 'company', label: 'Company / Pvt Ltd' },
    { value: 'brand', label: 'Direct Brand' },
    { value: 'partnership', label: 'Partnership' },
];

const SellerProfile = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [form, setForm] = useState({
        // Brand & Names
        store_name: '',
        business_name: '',
        business_type: 'individual',
        owner_name: '',
        tagline: '',
        description: '',
        logo: '',
        banner: '',

        // Contact
        support_email: '',
        support_phone: '',

        // Address
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',

        // Bank
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_holder_name: '',

        // Verification & Account status
        verification_status: 'pending',
        account_status: 'active',
        seller_code: '',
    });

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchProfile();
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerProfile();
            if (res?.data?.success && mounted.current) {
                const p = res.data.data || {};
                const addr = p.business_address || {};
                const bank = p.bank_details || {};

                setForm({
                    store_name: p.store_name || p.business_name || '',
                    business_name: p.business_name || '',
                    business_type: p.business_type || 'individual',
                    owner_name: p.owner_name || '',
                    tagline: p.tagline || '',
                    description: p.store_description || p.description || '',
                    logo: p.logo || p.user_id?.profile_image || '',
                    banner: p.banner || '',

                    support_email: p.email || p.contact_email || p.support_email || p.user_id?.email || '',
                    support_phone: p.mobile_number || p.contact_phone || p.support_phone || p.user_id?.mobile_number || '',

                    street: addr.street || addr.address_line1 || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    postal_code: addr.zip_code || addr.postal_code || addr.pincode || '',
                    country: addr.country || 'India',

                    bank_name: bank.bank_name || '',
                    account_number: bank.account_number || '',
                    ifsc_code: bank.ifsc_code || '',
                    account_holder_name: bank.account_holder_name || '',

                    verification_status: p.verification_status || 'pending',
                    account_status: p.account_status || 'active',
                    seller_code: p.seller_code || '',
                });
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
            toast.error('Failed to fetch seller profile');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                store_name: form.store_name?.trim() || form.business_name?.trim(),
                business_name: form.business_name?.trim() || form.store_name?.trim(),
                business_type: form.business_type,
                owner_name: form.owner_name?.trim(),
                tagline: form.tagline?.trim(),
                store_description: form.description?.trim(),
                logo: form.logo || null,
                banner: form.banner || null,
                email: form.support_email?.trim() || undefined,
                mobile_number: form.support_phone?.trim() || undefined,
                business_address: {
                    street: form.street,
                    city: form.city,
                    state: form.state,
                    postal_code: form.postal_code,
                    zip_code: form.postal_code,
                    country: form.country,
                },
                bank_details: {
                    bank_name: form.bank_name,
                    account_number: form.account_number,
                    ifsc_code: form.ifsc_code,
                    account_holder_name: form.account_holder_name,
                },
            };

            await ApiService.updateSellerProfile(payload);

            try {
                dispatch(updateUser({
                    profile_image: form.logo || undefined,
                    business_name: form.store_name || form.business_name,
                }));
            } catch (uErr) {
                // Ignore
            }

            toast.success('Store profile updated successfully!');
        } catch (err) {
            console.error('Save profile error:', err);
            toast.error(err.response?.data?.message || 'Failed to update profile');
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
                        My Profile
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-sky-200 overflow-hidden flex-shrink-0">
                            {form.logo ? (
                                <img src={form.logo} alt="Store Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span>{(form.store_name || form.business_name || 'S')[0]?.toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                                <span>{form.store_name || form.business_name || 'Seller Profile'}</span>
                                {form.seller_code && (
                                    <span className="text-[11px] font-mono font-bold bg-sky-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-sky-200">
                                        {form.seller_code}
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                {form.tagline || 'Manage store credentials, legal registration, address details, and payout accounts.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => navigate('/seller/settings')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all"
                        >
                            <FiSettings className="w-3.5 h-3.5 text-blue-600" />
                            <span>Store Settings</span>
                        </button>

                        <button
                            type="button"
                            onClick={fetchProfile}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs & Main Form */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                <div className="flex border-b border-slate-100 px-4 gap-2 pt-2 scrollbar-none">
                    {[
                        { key: 'general', label: 'Store & General', icon: FiBriefcase },
                        { key: 'address', label: 'Address & Contact', icon: FiMapPin },
                        { key: 'bank', label: 'Bank Disbursement', icon: FiCreditCard },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                                    isActive
                                        ? 'border-blue-600 text-blue-700 bg-sky-50/50'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <form onSubmit={handleSave} className="p-6 text-left">
                    {/* Tab: General & Business */}
                    {activeTab === 'general' && (
                        <div className="space-y-4 max-w-2xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Public Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.store_name}
                                        onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                                        placeholder="e.g. Acme Tech Solutions"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Legal Business Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.business_name}
                                        onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                                        placeholder="e.g. Acme Pvt Ltd"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Business Type
                                    </label>
                                    <select
                                        value={form.business_type}
                                        onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none bg-white"
                                    >
                                        {BUSINESS_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Owner / Primary Contact Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.owner_name}
                                        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                                        placeholder="Full name of owner"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Store Tagline / Slogan
                                </label>
                                <input
                                    type="text"
                                    value={form.tagline}
                                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                                    placeholder="e.g. Premium Electronics & Lifestyle Products"
                                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Store Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe your brand, offerings, and quality commitment..."
                                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab: Address & Contact */}
                    {activeTab === 'address' && (
                        <div className="space-y-4 max-w-2xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Support Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.support_email}
                                        onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                                        placeholder="contact@store.com"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Support Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={form.support_phone}
                                        onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
                                        placeholder="+91..."
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Dispatch / Warehouse Street Address
                                </label>
                                <input
                                    type="text"
                                    value={form.street}
                                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                                    placeholder="Warehouse / Office Street address"
                                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                        placeholder="City"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">State</label>
                                    <input
                                        type="text"
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                        placeholder="State"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pincode</label>
                                    <input
                                        type="text"
                                        value={form.postal_code}
                                        onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                                        placeholder="Postal code"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Bank Disbursement */}
                    {activeTab === 'bank' && (
                        <div className="space-y-4 max-w-2xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Bank Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.bank_name}
                                        onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                                        placeholder="e.g. HDFC Bank"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Account Holder Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.account_holder_name}
                                        onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                                        placeholder="As registered in bank"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Bank Account Number
                                    </label>
                                    <input
                                        type="text"
                                        value={form.account_number}
                                        onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                                        placeholder="Account number"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        IFSC Code
                                    </label>
                                    <input
                                        type="text"
                                        value={form.ifsc_code}
                                        onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. HDFC0001234"
                                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <FiSave className="w-4 h-4" />
                            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SellerProfile;
