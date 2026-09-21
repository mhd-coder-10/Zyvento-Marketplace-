// ============================================================
// SAVED ADDRESSES PAGE
// Description: Manage saved delivery addresses
// APIs: getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiMapPin,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiX,
    FiHome,
    FiBriefcase,
    FiPhone,
    FiUser,
    FiStar,
    FiCheckCircle,
    FiAlertCircle
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';

const SavedAddresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const initialFormData = {
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        address_type: 'home',
        is_default: false,
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getAddresses();
            if (response.data?.success) {
                setAddresses(response.data.data || []);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingAddress(null);
        setShowForm(false);
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setFormData({
            full_name: address.full_name || '',
            phone: address.phone || '',
            address_line1: address.address_line1 || '',
            address_line2: address.address_line2 || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            country: address.country || 'India',
            address_type: address.address_type || 'home',
            is_default: !!address.is_default,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            let response;
            if (editingAddress) {
                response = await ApiService.updateAddress(editingAddress._id, formData);
                toast.success('Address updated successfully!');
            } else {
                response = await ApiService.createAddress(formData);
                toast.success('Address added successfully!');
            }

            if (response.data?.success) {
                await loadAddresses();
                resetForm();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save address');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (addressId) => {
        if (!window.confirm('Are you sure you want to remove this address?')) return;

        try {
            const response = await ApiService.deleteAddress(addressId);
            if (response.data?.success) {
                toast.success('Address removed');
                setAddresses(prev => prev.filter((a) => a._id !== addressId));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete address');
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            const response = await ApiService.setDefaultAddress(addressId);
            if (response.data?.success) {
                toast.success('Default delivery address updated');
                await loadAddresses();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to set default address');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md">
                            <FiMapPin className="text-sm text-indigo-400" />
                            Address Book
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            Saved Addresses
                        </h1>
                        <p className="text-sm text-slate-300 mt-2 max-w-xl">
                            Manage your delivery destinations for lightning-fast checkout and shipment tracking.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <FiPlus className="text-base" /> Add New Address
                        </button>
                    </div>
                </div>
            </section>

            {/* ============ ADDRESSES GRID ============ */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map((n) => (
                            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
                                <div className="h-5 bg-slate-200 rounded w-1/3"></div>
                                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto mb-4">
                            <FiMapPin />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No saved addresses found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            Add your home, office, or secondary delivery location to speed up future purchases.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-6 px-6 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all"
                        >
                            + Add Your First Address
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addresses.map((addr) => {
                            const isHome = addr.address_type === 'home';
                            return (
                                <div
                                    key={addr._id}
                                    className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between ${
                                        addr.is_default
                                            ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-lg shadow-indigo-100/50'
                                            : 'border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md'
                                    }`}
                                >
                                    <div>
                                        {/* Header: Tag + Default Badge */}
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">
                                                    {isHome ? <FiHome /> : <FiBriefcase />}
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                    {addr.address_type || 'Address'}
                                                </span>
                                            </div>
                                            {addr.is_default && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                    <FiCheckCircle className="text-xs" /> Default
                                                </span>
                                            )}
                                        </div>

                                        {/* Contact info */}
                                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                            {addr.full_name}
                                        </h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                                            <FiPhone className="text-slate-400" /> {addr.phone}
                                        </p>

                                        {/* Address Text */}
                                        <div className="mt-3.5 text-xs text-slate-600 leading-relaxed space-y-0.5">
                                            <p>{addr.address_line1}</p>
                                            {addr.address_line2 && <p>{addr.address_line2}</p>}
                                            <p className="font-semibold text-slate-800">
                                                {addr.city}, {addr.state} – {addr.pincode}
                                            </p>
                                            <p className="text-slate-400 text-[11px]">{addr.country || 'India'}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                        {!addr.is_default ? (
                                            <button
                                                onClick={() => handleSetDefault(addr._id)}
                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                            >
                                                Set as Default
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">Primary shipping address</span>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(addr)}
                                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors"
                                                title="Edit Address"
                                            >
                                                <FiEdit2 className="text-xs" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(addr._id)}
                                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors"
                                                title="Delete Address"
                                            >
                                                <FiTrash2 className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ============ ADD / EDIT ADDRESS MODAL ============ */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">
                                    {editingAddress ? 'Update Delivery Address' : 'Add New Delivery Address'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Please provide accurate delivery coordinates.</p>
                            </div>
                            <button
                                onClick={resetForm}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                            >
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="Receiver's name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Mobile Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="10-digit mobile number"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Flat / House No. / Building *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address_line1}
                                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                    placeholder="e.g. Flat 402, Lotus Heights"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Street / Landmark / Area
                                </label>
                                <input
                                    type="text"
                                    value={formData.address_line2}
                                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                                    placeholder="e.g. Near City Center Mall"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        placeholder="City"
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        placeholder="State"
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Pincode *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        placeholder="6 digits"
                                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Address Type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Address Type
                                </label>
                                <div className="flex gap-3">
                                    {[
                                        { id: 'home', label: 'Home', icon: FiHome },
                                        { id: 'office', label: 'Office / Work', icon: FiBriefcase },
                                        { id: 'other', label: 'Other', icon: FiMapPin },
                                    ].map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = formData.address_type === type.id;
                                        return (
                                            <button
                                                type="button"
                                                key={type.id}
                                                onClick={() => setFormData({ ...formData, address_type: type.id })}
                                                className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                    isSelected
                                                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <Icon /> {type.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Default Checkbox */}
                            <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="text-xs font-semibold text-slate-700">Set as my default delivery address</span>
                            </label>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-60"
                                >
                                    {actionLoading ? 'Saving...' : editingAddress ? 'Save Changes' : 'Add Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavedAddresses;
