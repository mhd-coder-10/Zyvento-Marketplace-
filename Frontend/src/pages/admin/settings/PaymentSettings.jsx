import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiSave, FiCreditCard, FiDollarSign, FiShield, FiRefreshCw, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useSettings } from '../../../utils/useSettings';

const PaymentSettings = () => {
    const { settings, loading, updateSettings } = useSettings('payment');
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [activeGateway, setActiveGateway] = useState('razorpay');

    useEffect(() => {
        if (settings && Object.keys(settings).length > 0) {
            setFormData(settings);
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
            if (success) toast.success('Payment settings updated successfully!');
            else toast.error('Failed to update settings.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading payment settings...</div>;
    }

    const gateways = [
        { id: 'razorpay', label: 'Razorpay', icon: FiCreditCard, enabled: formData.razorpayEnabled },
        { id: 'stripe', label: 'Stripe', icon: FiCreditCard, enabled: formData.stripeEnabled },
        { id: 'wallet', label: 'Wallet', icon: FiDollarSign, enabled: formData.walletEnabled },
        { id: 'cashOnDelivery', label: 'Cash on Delivery', icon: FiRefreshCw, enabled: formData.codEnabled },
        { id: 'bankTransfer', label: 'Bank Transfer', icon: FiShield, enabled: formData.bankTransferEnabled },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Settings</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Commission Settings */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">Commission Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                            <select
                                name="commissionType"
                                value={formData.commissionType || 'percentage'}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.commissionType === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                            </label>
                            <input
                                type="number"
                                name="commissionValue"
                                value={formData.commissionValue || 0}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Commission (₹)</label>
                            <input
                                type="number"
                                name="commissionMax"
                                value={formData.commissionMax || 0}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Refund Policy */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Refund Policy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Refund Window (Days)</label>
                            <input
                                type="number"
                                name="refundWindowDays"
                                value={formData.refundWindowDays || 7}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Restocking Fee (₹)</label>
                            <input
                                type="number"
                                name="restockingFee"
                                value={formData.restockingFee || 0}
                                onChange={handleChange}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Gateways */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Gateways</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {gateways.map((gateway) => {
                            const Icon = gateway.icon;
                            const isActive = activeGateway === gateway.id;
                            return (
                                <button
                                    key={gateway.id}
                                    type="button"
                                    onClick={() => setActiveGateway(gateway.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${isActive
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {gateway.label}
                                    {gateway.enabled ? (
                                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <FiAlertCircle className="w-4 h-4 text-gray-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Individual Gateway Config */}
                    <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                        {activeGateway === 'razorpay' && (
                            <>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="razorpayEnabled"
                                        checked={formData.razorpayEnabled || false}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    Enable Razorpay
                                </label>
                                <input type="text" name="razorpayKeyId" value={formData.razorpayKeyId || ''} onChange={handleChange} placeholder="Key ID" className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                <input type="password" name="razorpayKeySecret" value={formData.razorpayKeySecret || ''} onChange={handleChange} placeholder="Key Secret" className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                            </>
                        )}
                        {activeGateway === 'stripe' && (
                            <>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="stripeEnabled"
                                        checked={formData.stripeEnabled || false}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    Enable Stripe
                                </label>
                                <input type="text" name="stripePublishableKey" value={formData.stripePublishableKey || ''} onChange={handleChange} placeholder="Publishable Key" className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                <input type="password" name="stripeSecretKey" value={formData.stripeSecretKey || ''} onChange={handleChange} placeholder="Secret Key" className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                            </>
                        )}
                        {activeGateway === 'wallet' && (
                            <>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="walletEnabled"
                                        checked={formData.walletEnabled || false}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    Enable Wallet
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" name="walletMinBalance" value={formData.walletMinBalance || 0} onChange={handleChange} placeholder="Min Balance" className="px-3 py-2 rounded-lg border border-gray-200" />
                                    <input type="number" name="walletMaxBalance" value={formData.walletMaxBalance || 100000} onChange={handleChange} placeholder="Max Balance" className="px-3 py-2 rounded-lg border border-gray-200" />
                                </div>
                            </>
                        )}
                        {activeGateway === 'cashOnDelivery' && (
                            <>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="codEnabled"
                                        checked={formData.codEnabled || false}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    Enable Cash on Delivery
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" name="codAdditionalCharge" value={formData.codAdditionalCharge || 0} onChange={handleChange} placeholder="Additional Charge" className="px-3 py-2 rounded-lg border border-gray-200" />
                                    <input type="number" name="codMinOrder" value={formData.codMinOrder || 0} onChange={handleChange} placeholder="Min Order Amount" className="px-3 py-2 rounded-lg border border-gray-200" />
                                </div>
                            </>
                        )}
                        {activeGateway === 'bankTransfer' && (
                            <>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="bankTransferEnabled"
                                        checked={formData.bankTransferEnabled || false}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    Enable Bank Transfer
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="bankName" value={formData.bankName || ''} onChange={handleChange} placeholder="Bank Name" className="px-3 py-2 rounded-lg border border-gray-200" />
                                    <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber || ''} onChange={handleChange} placeholder="Account Number" className="px-3 py-2 rounded-lg border border-gray-200" />
                                    <input type="text" name="bankIfsc" value={formData.bankIfsc || ''} onChange={handleChange} placeholder="IFSC Code" className="px-3 py-2 rounded-lg border border-gray-200" />
                                    <input type="text" name="bankAccountHolder" value={formData.bankAccountHolder || ''} onChange={handleChange} placeholder="Account Holder" className="px-3 py-2 rounded-lg border border-gray-200" />
                                </div>
                            </>
                        )}
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

export default PaymentSettings;