// SELLER SETTINGS & MERCHANT CONTROLS (Amazon Seller Central Style)
// Complete merchant preferences: Store Identity, Business/GST, Shipping, Bank Payouts, Policies & Vacation Mode

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    FiSettings, FiUser, FiFileText, FiSave, FiRefreshCw, FiTrash2,
    FiUploadCloud, FiMapPin, FiCreditCard, FiTruck, FiLoader,
    FiBriefcase, FiDollarSign, FiSun, FiShield, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const SellerSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [documents, setDocuments] = useState([]);
    const mounted = useRef(true);

    // Profile & Business Form
    const [profileForm, setProfileForm] = useState({
        store_name: '',
        tagline: '',
        business_name: '',
        owner_name: '',
        business_type: 'individual',
        gstin: '',
        pan_number: '',
        phone: '',
        email: '',
        business_address: {
            street: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'India',
        },
    });

    // Shipping & Store Settings Form
    const [settingsForm, setSettingsForm] = useState({
        order_processing_time: 24,
        fulfillment_type: 'easy_ship', // easy_ship | self_ship
        default_shipping_fee: 49,
        pickup_address: {
            street: '',
            city: '',
            state: '',
            postal_code: '',
        },
        return_policy: '7 days hassle-free return for unboxed defective items.',
        vacation_mode: false,
    });

    // Bank Details Form
    const [bankForm, setBankForm] = useState({
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        upi_id: '',
    });

    useEffect(() => {
        mounted.current = true;
        fetchData();
        return () => { mounted.current = false; };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profRes, docRes, settRes] = await Promise.allSettled([
                ApiService.getSellerProfile(),
                ApiService.getSellerDocuments(),
                ApiService.getSellerSettings(),
            ]);

            if (!mounted.current) return;

            if (profRes.status === 'fulfilled' && profRes.value?.data?.success) {
                const p = profRes.value.data.data;
                setProfile(p);
                setProfileForm({
                    store_name: p.store_name || p.business_name || '',
                    tagline: p.tagline || 'Quality Products & Reliable Delivery',
                    business_name: p.business_name || '',
                    owner_name: p.owner_name || '',
                    business_type: p.business_type || 'individual',
                    gstin: p.gstin || p.tax_id || '',
                    pan_number: p.pan_number || '',
                    phone: p.phone || p.contact_number || '',
                    email: p.email || '',
                    business_address: {
                        street: p.business_address?.street || p.business_address?.address_line_1 || '',
                        city: p.business_address?.city || '',
                        state: p.business_address?.state || '',
                        postal_code: p.business_address?.postal_code || p.business_address?.pincode || '',
                        country: p.business_address?.country || 'India',
                    },
                });

                if (p.bank_details || p.payout_account) {
                    const b = p.bank_details || p.payout_account;
                    setBankForm({
                        account_holder_name: b.account_holder_name || p.owner_name || '',
                        bank_name: b.bank_name || '',
                        account_number: b.account_number || '',
                        ifsc_code: b.ifsc_code || '',
                        upi_id: b.upi_id || '',
                    });
                }
            }

            if (docRes.status === 'fulfilled' && docRes.value?.data?.success) {
                setDocuments(docRes.value.data.data || []);
            }

            if (settRes.status === 'fulfilled' && settRes.value?.data?.success) {
                const s = settRes.value.data.data;
                setSettingsForm((prev) => ({
                    ...prev,
                    order_processing_time: s.order_processing_time || 24,
                    fulfillment_type: s.fulfillment_type || 'easy_ship',
                    default_shipping_fee: s.default_shipping_fee || 49,
                    return_policy: s.return_policy || '7 days replacement on damaged items.',
                    vacation_mode: Boolean(s.vacation_mode),
                }));
            }
        } catch (err) {
            console.error('Seller settings load error:', err);
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await ApiService.updateSellerProfile(profileForm);
            if (res?.data?.success) toast.success('Business profile updated successfully');
            else toast.error(res?.data?.message || 'Update failed');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSettingsSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await ApiService.updateSellerSettings(settingsForm);
            if (res?.data?.success) toast.success('Store & fulfillment settings saved');
            else toast.error(res?.data?.message || 'Update failed');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleBankSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await ApiService.updateSellerProfile({ bank_details: bankForm });
            if (res?.data?.success) toast.success('Payout & bank details saved successfully');
            else toast.error(res?.data?.message || 'Failed to save bank details');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save bank details');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            const res = await ApiService.deleteSellerDocument(docId);
            if (res?.data?.success) {
                toast.success('Document deleted');
                fetchData();
            } else {
                toast.error('Delete failed');
            }
        } catch (err) {
            toast.error('Failed to delete document');
        }
    };

    const tabs = [
        { key: 'profile', label: 'Store & Business', icon: FiBriefcase, desc: 'Identity, GST & legal address' },
        { key: 'shipping', label: 'Shipping & Fulfillment', icon: FiTruck, desc: 'Dispatch time & logistics model' },
        { key: 'bank', label: 'Bank & Payouts', icon: FiCreditCard, desc: 'Settlement account & UPI details' },
        { key: 'policies', label: 'Policies & Vacation', icon: FiSun, desc: 'Return policy & holiday pause mode' },
        { key: 'documents', label: 'KYC Documents', icon: FiFileText, desc: 'GST, PAN & business verification' },
    ];

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <FiLoader className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <AdminTopbar
                title="Seller Central Settings"
                subtitle="Manage your merchant identity, logistics preferences, payout details and store policies"
                actions={
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                }
            />

            {/* Vacation Mode Banner if Active */}
            {settingsForm.vacation_mode && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 font-bold">
                        <FiSun className="w-5 h-5 text-amber-600" />
                        <span>Holiday / Vacation Mode is currently ACTIVE. Your listings are temporarily hidden from search.</span>
                    </div>
                    <button
                        onClick={() => setSettingsForm((s) => ({ ...s, vacation_mode: false }))}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                    >
                        Resume Selling
                    </button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex flex-col items-center sm:items-start p-3 rounded-xl transition text-left ${
                                isActive
                                    ? 'bg-white text-blue-700 shadow-md font-bold ring-1 ring-slate-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="text-xs sm:text-sm">{t.label}</span>
                            </div>
                            <span className={`text-[10px] hidden sm:block mt-0.5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                                {t.desc}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: STORE & BUSINESS PROFILE */}
            {activeTab === 'profile' && (
                <form onSubmit={handleProfileSave} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiBriefcase className="text-blue-600" /> Merchant & Store Identity
                        </h3>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <FiSave className="h-4 w-4" />{saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Store Front Name (Publicly visible)
                            </label>
                            <input
                                type="text"
                                value={profileForm.store_name}
                                onChange={(e) => setProfileForm((f) => ({ ...f, store_name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. Apex Retail India"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Store Tagline
                            </label>
                            <input
                                type="text"
                                value={profileForm.tagline}
                                onChange={(e) => setProfileForm((f) => ({ ...f, tagline: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                                placeholder="Authentic electronics & lifestyle accessories"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Legal Registered Entity Name
                            </label>
                            <input
                                type="text"
                                value={profileForm.business_name}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Business Type
                            </label>
                            <select
                                value={profileForm.business_type}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_type: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="individual">Sole Proprietorship</option>
                                <option value="company">Private Limited Company</option>
                                <option value="partnership">Partnership / LLP</option>
                                <option value="brand">Direct Brand / D2C</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                GSTIN (Tax Identification)
                            </label>
                            <input
                                type="text"
                                value={profileForm.gstin}
                                onChange={(e) => setProfileForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono uppercase text-slate-900 focus:border-blue-500 focus:outline-none"
                                placeholder="27AAAPL1234C1Z1"
                            />
                        </div>
                    </div>

                    {/* Registered Business Address */}
                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                            <FiMapPin className="text-blue-600" /> Registered Business Address
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <input
                                    type="text"
                                    placeholder="Street Address, Building, Floor"
                                    value={profileForm.business_address.street}
                                    onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, street: e.target.value } }))}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="City"
                                value={profileForm.business_address.city}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, city: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={profileForm.business_address.state}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, state: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Postal Code (PIN)"
                                value={profileForm.business_address.postal_code}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, postal_code: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Country"
                                value={profileForm.business_address.country}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, country: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 2: SHIPPING & FULFILLMENT */}
            {activeTab === 'shipping' && (
                <form onSubmit={handleSettingsSave} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiTruck className="text-blue-600" /> Logistics & Fulfillment Preferences
                        </h3>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <FiSave className="h-4 w-4" />{saving ? 'Saving...' : 'Save Logistics'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Fulfillment Model
                            </label>
                            <select
                                value={settingsForm.fulfillment_type}
                                onChange={(e) => setSettingsForm((s) => ({ ...s, fulfillment_type: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="easy_ship">Zyvento Express Fulfillment (Recommended)</option>
                                <option value="self_ship">Self-Ship (Merchant handles courier logistics)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Dispatch Handling SLA (Hours)
                            </label>
                            <select
                                value={settingsForm.order_processing_time}
                                onChange={(e) => setSettingsForm((s) => ({ ...s, order_processing_time: Number(e.target.value) }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                            >
                                <option value={12}>12 Hours (Same Day Dispatch)</option>
                                <option value={24}>24 Hours (Next Day Dispatch)</option>
                                <option value={48}>48 Hours (Standard)</option>
                            </select>
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 3: BANK & PAYOUTS */}
            {activeTab === 'bank' && (
                <form onSubmit={handleBankSave} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiCreditCard className="text-blue-600" /> Settlement & Payout Account
                        </h3>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <FiSave className="h-4 w-4" />{saving ? 'Saving...' : 'Save Bank Details'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Bank Account Holder Name
                            </label>
                            <input
                                type="text"
                                value={bankForm.account_holder_name}
                                onChange={(e) => setBankForm((b) => ({ ...b, account_holder_name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                                placeholder="Name as per Passbook / Cheque"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                value={bankForm.bank_name}
                                onChange={(e) => setBankForm((b) => ({ ...b, bank_name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                                placeholder="HDFC Bank / ICICI / SBI"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Account Number
                            </label>
                            <input
                                type="password"
                                value={bankForm.account_number}
                                onChange={(e) => setBankForm((b) => ({ ...b, account_number: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none"
                                placeholder="••••••••••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                IFSC Code
                            </label>
                            <input
                                type="text"
                                value={bankForm.ifsc_code}
                                onChange={(e) => setBankForm((b) => ({ ...b, ifsc_code: e.target.value.toUpperCase() }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono uppercase text-slate-900 focus:border-blue-500 focus:outline-none"
                                placeholder="HDFC0001234"
                            />
                        </div>
                    </div>
                </form>
            )}

            {/* TAB 4: POLICIES & VACATION */}
            {activeTab === 'policies' && (
                <form onSubmit={handleSettingsSave} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <FiSun className="text-blue-600" /> Store Policies & Holiday Mode
                        </h3>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <FiSave className="h-4 w-4" />{saving ? 'Saving...' : 'Save Policies'}
                        </button>
                    </div>

                    {/* Vacation Mode Toggle */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                <FiSun className="text-amber-500" /> Vacation / Holiday Mode
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Temporarily hide your product listings from buyer search while taking time off.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={Boolean(settingsForm.vacation_mode)}
                                onChange={(e) => setSettingsForm((s) => ({ ...s, vacation_mode: e.target.checked }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                            Custom Merchant Return & Warranty Policy
                        </label>
                        <textarea
                            rows={3}
                            value={settingsForm.return_policy}
                            onChange={(e) => setSettingsForm((s) => ({ ...s, return_policy: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                            placeholder="State your item inspection, replacement guidelines and conditions."
                        />
                    </div>
                </form>
            )}

            {/* TAB 5: DOCUMENTS */}
            {activeTab === 'documents' && (
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <FiFileText className="text-blue-600" /> Uploaded KYC & Compliance Documents
                    </h3>

                    {documents.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <FiFileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-800 capitalize">
                                                {(doc.document_type || doc.type || 'document').replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                Status: <span className="text-emerald-600 font-semibold">{doc.status || 'Verified'}</span> • Uploaded on {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {doc.document_url && (
                                            <a
                                                href={doc.document_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-blue-600 hover:bg-slate-200"
                                            >
                                                View
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDeleteDocument(doc._id || doc.id)}
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                                        >
                                            <FiTrash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-slate-400">
                            <FiUploadCloud className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-semibold text-slate-600">No additional compliance documents uploaded</p>
                            <p className="text-xs text-slate-400 mt-1">Your basic registration KYC documents were automatically verified.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SellerSettings;
