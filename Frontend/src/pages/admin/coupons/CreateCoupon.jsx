import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiCheck, FiX, FiZap, FiPercent, FiCalendar,
    FiTag, FiDollarSign, FiInfo, FiSliders, FiClock, FiUsers,
    FiSave, FiEye, FiShield, FiAlertCircle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const CreateCoupon = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const startDateRef = useRef(null);
    const expiryDateRef = useRef(null);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        perUserLimit: '1',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        status: 'active'
    });

    const [errors, setErrors] = useState({});

    const getDerivedStatus = (startDate, expiryDate) => {
        if (!startDate || !expiryDate) return 'pending';
        const now = new Date();
        const start = new Date(startDate);
        const expiry = new Date(expiryDate);
        if (start > now) return 'pending';
        if (expiry < now) return 'expired';
        return 'active';
    };

    const openCalendar = (ref) => {
        if (ref.current) {
            ref.current.focus();
            if (ref.current.showPicker) {
                try {
                    ref.current.showPicker();
                } catch (err) {
                    // Fallback
                }
            }
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'ZYV-';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code: result }));
        if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.code.trim()) newErrors.code = 'Coupon code is required';
        if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
            newErrors.discountValue = 'Please enter a valid discount value greater than 0';
        }
        if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
            newErrors.discountValue = 'Percentage discount cannot exceed 100%';
        }
        if (!formData.expiryDate) {
            newErrors.expiryDate = 'Expiry date is required';
        } else if (formData.startDate && new Date(formData.expiryDate) < new Date(formData.startDate)) {
            newErrors.expiryDate = 'Expiry date must be after start date';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const updatedForm = { ...formData, [name]: value };
        updatedForm.status = getDerivedStatus(updatedForm.startDate, updatedForm.expiryDate);
        setFormData(updatedForm);
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!validate()) {
            toast.warning('Please fix the validation errors before submitting');
            return;
        }

        setLoading(true);
        try {
            await ApiService.createCoupon({
                ...formData,
                code: formData.code.trim().toUpperCase(),
                discountValue: parseFloat(formData.discountValue),
                minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
                maxDiscountAmount: parseFloat(formData.maxDiscountAmount) || 0,
                usageLimit: parseInt(formData.usageLimit) || null,
                perUserLimit: parseInt(formData.perUserLimit) || 1
            });
            toast.success(`Coupon "${formData.code.toUpperCase()}" created successfully`);
            navigate('/admin/coupons');
        } catch (error) {
            console.error('Failed to create coupon', error);
            toast.error(error.response?.data?.message || 'Failed to create coupon');
        } finally {
            setLoading(false);
        }
    };

    const derivedStatus = getDerivedStatus(formData.startDate, formData.expiryDate);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Create Discount Coupon"
                subtitle="Configure platform voucher codes, redemption rules, and spending thresholds"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/coupons')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm disabled:opacity-50"
                        >
                            <FiSave className="w-4 h-4" />
                            {loading ? 'Creating...' : 'Create Coupon'}
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6 px-4 md:px-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ====== 2-COLUMN RESPONSIVE GRID ====== */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ====== LEFT COLUMN: MAIN FORM SECTIONS (2 Cols) ====== */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Section 1: Coupon Identification & Discount Rules */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Coupon Identification & Offer</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Define code, discount calculation, and customer redemption value</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Coupon Code */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Coupon Code <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    name="code"
                                                    value={formData.code}
                                                    onChange={handleChange}
                                                    placeholder="e.g. FESTIVE20, SAVE500, WELCOME10"
                                                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm font-mono font-bold tracking-wider uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                                                        errors.code ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                                    }`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={generateCode}
                                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                                                title="Generate random coupon code"
                                            >
                                                <FiZap className="w-3.5 h-3.5 text-amber-500" />
                                                <span>Generate</span>
                                            </button>
                                        </div>
                                        {errors.code ? (
                                            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                                <FiAlertCircle className="w-3.5 h-3.5" /> {errors.code}
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                Customers will enter this uppercase code during cart or checkout review.
                                            </p>
                                        )}
                                    </div>

                                    {/* Discount Type & Value */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Discount Type <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'percentage' }))}
                                                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                                        formData.discountType === 'percentage'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <FiPercent className="w-3.5 h-3.5" /> Percentage (%)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, discountType: 'fixed' }))}
                                                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                                        formData.discountType === 'fixed'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <FiDollarSign className="w-3.5 h-3.5" /> Fixed (₹)
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Discount Value <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="discountValue"
                                                    value={formData.discountValue}
                                                    onChange={handleChange}
                                                    min="1"
                                                    max={formData.discountType === 'percentage' ? '100' : undefined}
                                                    placeholder={formData.discountType === 'percentage' ? 'e.g. 15 (for 15%)' : 'e.g. 250 (for ₹250)'}
                                                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pr-12 ${
                                                        errors.discountValue ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                                    }`}
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                                    {formData.discountType === 'percentage' ? '%' : '₹ INR'}
                                                </span>
                                            </div>
                                            {errors.discountValue && (
                                                <p className="text-xs text-rose-500 mt-1">{errors.discountValue}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Minimum Order Amount & Maximum Discount Cap */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Minimum Order Amount (₹)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="minOrderAmount"
                                                    value={formData.minOrderAmount}
                                                    onChange={handleChange}
                                                    min="0"
                                                    placeholder="0 (No minimum required)"
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pl-8"
                                                />
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    ₹
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">Cart subtotal must exceed this to apply voucher.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Maximum Discount Cap (₹)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    name="maxDiscountAmount"
                                                    value={formData.maxDiscountAmount}
                                                    onChange={handleChange}
                                                    min="0"
                                                    placeholder="0 (Unlimited)"
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pl-8"
                                                />
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    ₹
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">Caps discount for percentage vouchers (e.g. max ₹1,000).</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Campaign Description <span className="text-slate-400 font-normal">(Shown to customers)</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={2}
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="e.g. Get 20% off on all items above ₹999. Valid on all marketplace categories."
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Redemption Limits & Date Validity */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Usage Limits & Validity Timeline</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Control how many times the voucher can be redeemed and active duration</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Total Coupon Pool Limit
                                            </label>
                                            <input
                                                type="number"
                                                name="usageLimit"
                                                value={formData.usageLimit}
                                                onChange={handleChange}
                                                min="1"
                                                placeholder="Leave blank for unlimited"
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1">Total allowed redemptions across all marketplace shoppers.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Per-User Redemption Limit
                                            </label>
                                            <input
                                                type="number"
                                                name="perUserLimit"
                                                value={formData.perUserLimit}
                                                onChange={handleChange}
                                                min="1"
                                                placeholder="1"
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1">How many times a single customer account can apply this.</p>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Start Date <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    ref={startDateRef}
                                                    type="date"
                                                    name="startDate"
                                                    value={formData.startDate}
                                                    onChange={handleDateChange}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => openCalendar(startDateRef)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition"
                                                >
                                                    <FiCalendar className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">Coupon becomes available for redemption on this date.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Expiry Date <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    ref={expiryDateRef}
                                                    type="date"
                                                    name="expiryDate"
                                                    value={formData.expiryDate}
                                                    onChange={handleDateChange}
                                                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition pr-10 ${
                                                        errors.expiryDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                                    }`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => openCalendar(expiryDateRef)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition"
                                                >
                                                    <FiCalendar className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {errors.expiryDate && (
                                                <p className="text-xs text-rose-500 mt-1">{errors.expiryDate}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Auto-derived Status */}
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-slate-700">Calculated Coupon Status:</span>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Based on start date ({formData.startDate || 'None'}) and expiry date ({formData.expiryDate || 'None'}).
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            derivedStatus === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : derivedStatus === 'expired'
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                            {derivedStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ====== RIGHT COLUMN: LIVE STOREFRONT PREVIEW & ACTIONS (1 Col) ====== */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Card 1: Live Storefront Voucher Card Preview */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiEye className="w-3.5 h-3.5 text-blue-600" /> Live Voucher Preview
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">How this coupon renders to customers at checkout</p>
                                </div>

                                {/* Voucher Design */}
                                <div className="relative rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-white p-5 space-y-3.5 shadow-xs overflow-hidden">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-100/60 px-2 py-0.5 rounded">
                                                Zyvento Voucher
                                            </span>
                                            <h4 className="text-2xl font-black text-slate-900 mt-1">
                                                {formData.discountValue
                                                    ? (formData.discountType === 'percentage' ? `${formData.discountValue}% OFF` : `₹${formData.discountValue} OFF`)
                                                    : '0% OFF'}
                                            </h4>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
                                            <FiTag className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {formData.description || 'Applicable on qualifying marketplace items.'}
                                    </p>

                                    {/* Voucher Code Box */}
                                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-blue-200/60">
                                        <span className="font-mono font-bold text-sm tracking-wider text-blue-700">
                                            {formData.code || 'COUPONCODE'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                            TAP TO APPLY
                                        </span>
                                    </div>

                                    {/* Terms Summary */}
                                    <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-slate-500">
                                        <span>Min Order: <strong>₹{formData.minOrderAmount || 0}</strong></span>
                                        <span>
                                            Expires: <strong>{formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Ongoing'}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Platform Funding Guarantee */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                        <FiShield className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm">Seller Protected Promotion</h4>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    Zyvento platform coupons never deduct from seller payouts. All discounts are subsidized directly by Zyvento marketing budget and itemized under promotional expenses in administrative reports.
                                </p>
                            </div>

                            {/* Card 3: Best Practice Guidelines */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <FiInfo className="text-blue-600 w-4 h-4" /> Coupon Best Practices
                                </h4>
                                <div className="space-y-2.5 pt-1 text-slate-600">
                                    <div className="flex items-start gap-2">
                                        <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>For percentage discounts above 15%, always set a <strong>Maximum Discount Cap</strong> to safeguard margin on large bulk carts.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Set <strong>Minimum Order Amount</strong> higher than average logistics cost to keep unit economics profitable.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <FiCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Keep codes concise and easy to remember for mobile shoppers.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <FiSave className="w-4 h-4" />
                                    {loading ? 'Creating Coupon...' : 'Save & Publish Coupon'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/coupons')}
                                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-sm transition border border-slate-200 flex items-center justify-center gap-2"
                                >
                                    <FiX className="w-4 h-4" /> Cancel
                                </button>
                            </div>

                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCoupon;