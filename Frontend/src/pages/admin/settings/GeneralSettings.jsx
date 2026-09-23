import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSave, FiImage } from 'react-icons/fi';
import { useSettings } from '../../../utils/useSettings';

const GeneralSettings = () => {
    const { settings, loading, updateSettings } = useSettings('general');
    const [formData, setFormData] = useState({
        siteName: '',
        siteDescription: '',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        registrationEnabled: true,
        guestCheckout: true,
        maintenanceMode: false,
    });
    const [saving, setSaving] = useState(false);

    // ✅ Jab settings load ho jayein, form me set karo
    useEffect(() => {
        if (settings && Object.keys(settings).length > 0) {
            setFormData(prev => ({ ...prev, ...settings }));
        }
    }, [settings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const success = await updateSettings(formData);
            if (success) {
                toast.success('General settings updated successfully!');
            } else {
                toast.error('Failed to update settings.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                        <input
                            type="text"
                            name="siteName"
                            value={formData.siteName || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                            name="currency"
                            value={formData.currency || 'INR'}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="INR">Indian Rupee (₹)</option>
                            <option value="USD">US Dollar ($)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">British Pound (£)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
                    <textarea
                        name="siteDescription"
                        value={formData.siteDescription || ''}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select
                            name="timezone"
                            value={formData.timezone || 'Asia/Kolkata'}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="Asia/Kolkata">India (UTC +5:30)</option>
                            <option value="America/New_York">USA Eastern (UTC -5:00)</option>
                            <option value="Europe/London">UK (UTC +0:00)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                        <select
                            name="dateFormat"
                            value={formData.dateFormat || 'DD/MM/YYYY'}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Platform Features</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="registrationEnabled"
                                checked={formData.registrationEnabled || false}
                                onChange={handleChange}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">User Registration</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="guestCheckout"
                                checked={formData.guestCheckout || false}
                                onChange={handleChange}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Guest Checkout</span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="maintenanceMode"
                                checked={formData.maintenanceMode || false}
                                onChange={handleChange}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Maintenance Mode</span>
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <FiSave className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GeneralSettings;