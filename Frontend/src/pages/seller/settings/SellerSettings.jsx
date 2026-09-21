import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    FiSettings, FiUser, FiFileText, FiSave, FiRefreshCw, FiTrash2,
    FiUploadCloud, FiMapPin, FiCreditCard, FiTruck, FiLoader,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const SellerSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [settings, setSettings] = useState(null);
    const mounted = useRef(true);

    // Profile form
    const [profileForm, setProfileForm] = useState({
        business_name: '', owner_name: '', business_type: 'individual',
        business_address: { street: '', city: '', state: '', postal_code: '', country: 'India' },
    });

    // Settings form
    const [settingsForm, setSettingsForm] = useState({
        order_processing_time: 24, return_policy: '',
    });

    useEffect(() => { mounted.current = true; fetchData(); return () => { mounted.current = false; }; }, []);

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
                    business_name: p.business_name || '',
                    owner_name: p.owner_name || '',
                    business_type: p.business_type || 'individual',
                    business_address: {
                        street: p.business_address?.street || p.business_address?.address_line_1 || '',
                        city: p.business_address?.city || '',
                        state: p.business_address?.state || '',
                        postal_code: p.business_address?.postal_code || p.business_address?.pincode || '',
                        country: p.business_address?.country || 'India',
                    },
                });
            }

            if (docRes.status === 'fulfilled' && docRes.value?.data?.success) {
                setDocuments(docRes.value.data.data || []);
            }

            if (settRes.status === 'fulfilled' && settRes.value?.data?.success) {
                const s = settRes.value.data.data;
                setSettings(s);
                setSettingsForm({
                    order_processing_time: s.order_processing_time || 24,
                    return_policy: s.return_policy || '',
                });
            }
        } catch (err) {
            console.error('Settings load error:', err);
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await ApiService.updateSellerProfile(profileForm);
            if (res?.data?.success) toast.success('Profile updated successfully');
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
            if (res?.data?.success) toast.success('Settings updated successfully');
            else toast.error(res?.data?.message || 'Update failed');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            const res = await ApiService.deleteSellerDocument(docId);
            if (res?.data?.success) { toast.success('Document deleted'); fetchData(); }
            else toast.error('Delete failed');
        } catch (err) {
            toast.error('Failed to delete document');
        }
    };

    const tabs = [
        { key: 'profile', label: 'Business Profile', icon: FiUser },
        { key: 'documents', label: 'Documents', icon: FiFileText },
        { key: 'store', label: 'Store Settings', icon: FiSettings },
    ];

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <FiLoader className="h-8 w-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminTopbar title="Store Settings" subtitle="Configure your business profile, documents, and store policies"
                actions={
                    <button onClick={fetchData} disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-50">
                        <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                }
            />

            {/* Tab Navigation */}
            <div className="flex gap-1 rounded-xl bg-sky-50 p-1 ring-1 ring-sky-100">
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-sky-600 hover:text-blue-700'}`}>
                        <t.icon className="h-4 w-4" />{t.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <form onSubmit={handleProfileSave} className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><FiUser className="text-sky-600" />Business Profile</h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Business Name</label>
                            <input type="text" value={profileForm.business_name}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Owner Name</label>
                            <input type="text" value={profileForm.owner_name}
                                onChange={(e) => setProfileForm((f) => ({ ...f, owner_name: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Business Type</label>
                        <select value={profileForm.business_type}
                            onChange={(e) => setProfileForm((f) => ({ ...f, business_type: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none">
                            <option value="individual">Individual</option>
                            <option value="company">Company</option>
                            <option value="brand">Brand</option>
                            <option value="partnership">Partnership</option>
                        </select>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><FiMapPin className="text-sky-600" />Business Address</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <input type="text" placeholder="Street Address" value={profileForm.business_address.street}
                                    onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, street: e.target.value } }))}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none" />
                            </div>
                            <input type="text" placeholder="City" value={profileForm.business_address.city}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, city: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none" />
                            <input type="text" placeholder="State" value={profileForm.business_address.state}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, state: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none" />
                            <input type="text" placeholder="Postal Code" value={profileForm.business_address.postal_code}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, postal_code: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none" />
                            <input type="text" placeholder="Country" value={profileForm.business_address.country}
                                onChange={(e) => setProfileForm((f) => ({ ...f, business_address: { ...f.business_address, country: e.target.value } }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none" />
                        </div>
                    </div>

                    <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-sky-600 hover:to-blue-700 disabled:opacity-50">
                        <FiSave className="h-4 w-4" />{saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
                <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FiFileText className="text-sky-600" />Uploaded Documents
                    </h3>
                    {documents.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center">
                                            <FiFileText className="text-sky-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 capitalize">{(doc.document_type || doc.type || 'document').replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-slate-400">{doc.status || 'uploaded'} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {doc.document_url && (
                                            <a href={doc.document_url} target="_blank" rel="noreferrer"
                                                className="text-xs font-semibold text-blue-600 hover:underline">View</a>
                                        )}
                                        <button onClick={() => handleDeleteDocument(doc._id || doc.id)}
                                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition">
                                            <FiTrash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-slate-400">
                            <FiUploadCloud className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-medium">No documents uploaded yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Store Settings Tab */}
            {activeTab === 'store' && (
                <form onSubmit={handleSettingsSave} className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><FiTruck className="text-sky-600" />Store Configuration</h3>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                            Order Processing Time (hours)
                        </label>
                        <input type="number" min="1" max="72" value={settingsForm.order_processing_time}
                            onChange={(e) => setSettingsForm((f) => ({ ...f, order_processing_time: parseInt(e.target.value) || 24 }))}
                            className="w-full max-w-xs rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        <p className="text-xs text-slate-400 mt-1">Maximum time to process and ship an order (1-72 hours)</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Return Policy</label>
                        <textarea rows={4} value={settingsForm.return_policy}
                            onChange={(e) => setSettingsForm((f) => ({ ...f, return_policy: e.target.value }))}
                            placeholder="Describe your return and refund policy..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    </div>

                    <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-sky-600 hover:to-blue-700 disabled:opacity-50">
                        <FiSave className="h-4 w-4" />{saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SellerSettings;
