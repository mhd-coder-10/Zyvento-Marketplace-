import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiCheck, FiX, FiRefreshCw, FiCalendar,
    FiTag, FiDollarSign, FiPercent, FiInfo, FiSliders,
    FiClock, FiUsers, FiSave, FiEye, FiShield, FiAlertCircle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const EditCoupon = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const startDateRef = useRef(null);
    const expiryDateRef = useRef(null);

    const [couponOriginal, setCouponOriginal] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        perUserLimit: '1',
        startDate: '',
        expiryDate: '',
        status: 'pending'
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
                } catch (err) {}
            }
        }
    };

    useEffect(() => {
        fetchCoupon();
    }, [code]);

    const fetchCoupon = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getCouponByCode(code);
            if (res.data?.success && res.data?.data) {
                const c = res.data.data;
                setCouponOriginal(c);
                const derivedStatus = getDerivedStatus(c.startDate, c.expiryDate);
                const finalStatus = (c.status === 'disabled') ? 'disabled' : derivedStatus;

                setFormData({
                    code: c.code || '',
                    description: c.description || '',
                    discountType: c.discountType || c.discount_type || 'percentage',
                    discountValue: c.discountValue ?? c.discount_value ?? '',
                    minOrderAmount: c.minOrderAmount ?? c.min_order_amount ?? '',
                    maxDiscountAmount: c.maxDiscountAmount ?? c.max_discount_amount ?? '',
                    usageLimit: c.usageLimit ?? c.usage_limit ?? '',
                    perUserLimit: c.perUserLimit ?? c.per_user_limit ?? '1',
                    startDate: c.startDate ? c.startDate.split('T')[0] : (c.start_date ? c.start_date.split('T')[0] : ''),
                    expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : (c.expiry_date ? c.expiry_date.split('T')[0] : ''),
                    status: finalStatus
                });
            } else {
                toast.error('Coupon not found');
                navigate('/admin/coupons');
            }
        } catch (error) {
            console.error('Failed to load coupon', error);
            toast.error('Failed to load coupon');
            navigate('/admin/coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const updatedForm = { ...formData, [name]: value };
        // if status was not disabled, auto update derived status
        if (formData.status !== 'disabled') {
            updatedForm.status = getDerivedStatus(updatedForm.startDate, updatedForm.expiryDate);
        }
        setFormData(updatedForm);
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleStatusChange = (e) => {
        const { value } = e.target;
        const derivedStatus = getDerivedStatus(formData.startDate, formData.expiryDate);

        if (value === 'disabled') {
            setFormData(prev => ({ ...prev, status: 'disabled' }));
            setErrors(prev => ({ ...prev, status: '' }));
            return;
        }

        if (value !== derivedStatus) {
            setErrors(prev => ({
                ...prev,
                status: `Based on selected dates, status should naturally be '${derivedStatus}'. Setting '${value}' may be overridden upon date evaluation.`
            }));
        } else {
            setErrors(prev => ({ ...prev, status: '' }));
        }

        setFormData(prev => ({ ...prev, status: value }));
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

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!validate()) {
            toast.warning('Please resolve form errors before saving');
            return;
        }

        setSubmitting(true);
        try {
            await ApiService.updateCoupon(code, {
                ...formData,
                code: formData.code.trim().toUpperCase(),
                discountValue: parseFloat(formData.discountValue),
                minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
                maxDiscountAmount: parseFloat(formData.maxDiscountAmount) || 0,
                usageLimit: parseInt(formData.usageLimit) || null,
                perUserLimit: parseInt(formData.perUserLimit) || 1
            });
            toast.success(`Coupon "${formData.code.toUpperCase()}" updated successfully`);
            navigate('/admin/coupons');
        } catch (error) {
            console.error('Failed to update coupon', error);
            toast.error(error.response?.data?.message || 'Failed to update coupon');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading coupon details...</p>
                </div>
            </div>
        );
    }

    const derivedStatus = getDerivedStatus(formData.startDate, formData.expiryDate);
    const usedCount = couponOriginal?.usedCount || couponOriginal?.used_count || 0;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Edit Discount Coupon"
                subtitle={`Modifying configuration for voucher: ${code}`}
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
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm disabled:opacity-50"
                        >
                            <FiSave className="w-4 h-4" />
                            {submitting ? 'Updating...' : 'Save Changes'}
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
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Coupon Identification & Offer</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Edit voucher code, discount formula, and customer saving parameters</p>
                                    </div>
                                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                                        ID: {code}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {/* Coupon Code */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Coupon Code <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleChange}
                                            placeholder="e.g. FESTIVE20"
                                            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm font-mono font-bold tracking-wider uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                                                errors.code ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                                            }`}
                                        />
                                        {errors.code && (
                                            <p className="text-xs text-rose-500 mt-1">{errors.code}</p>
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
                                                    placeholder="0"
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pl-8"
                                                />
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    ₹
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">Cart subtotal threshold required for redemption.</p>
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
                                                    placeholder="0"
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition pl-8"
                                                />
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                                                    ₹
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1">Upper limit for percentage deductions.</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Campaign Description
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={2}
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="e.g. Save on all electronics orders above ₹1,000"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Redemption Limits & Date Validity */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-bold text-slate-900">Usage Limits & Validity Timeline</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Manage availability windows, customer quotas, and active status</p>
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
                                            <p className="text-[11px] text-slate-400 mt-1">Total allowed redemptions across all shoppers.</p>
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
                                            <p className="text-[11px] text-slate-400 mt-1">Max redemptions per individual account.</p>
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

                                    {/* Status Controls */}
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Administrative Status
                                                </label>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Choose whether this voucher is active, pending, or manually disabled.
                                                </p>
                                            </div>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleStatusChange}
                                                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-slate-800"
                                            >
                                                <option value="active">Active (Visible & Redeemable)</option>
                                                <option value="pending">Pending (Upcoming)</option>
                                                <option value="expired">Expired</option>
                                                <option value="disabled">Disabled (Deactivated)</option>
                                            </select>
                                        </div>
                                        {errors.status && (
                                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                                                {errors.status}
                                            </p>
                                        )}
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
                                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time storefront checkout display</p>
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
                                            ACTIVE PROMO
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

                            {/* Card 2: Existing Usage Statistics */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 text-xs">
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <FiUsers className="text-blue-600 w-4 h-4" /> Redemption Telemetry
                                </h4>
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                        <span className="text-slate-500">Times Redeemed:</span>
                                        <span className="font-bold text-slate-800">{usedCount} redemptions</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                                        <span className="text-slate-500">Pool Limit:</span>
                                        <span className="font-semibold text-slate-800">
                                            {formData.usageLimit ? `${formData.usageLimit} max` : 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-slate-500">Settlement Model:</span>
                                        <span className="font-semibold text-emerald-600">100% Zyvento Subsidized</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/coupons/${code}`)}
                                    className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-blue-600 font-semibold rounded-xl text-xs border border-slate-200 transition text-center"
                                >
                                    View Full Performance Details
                                </button>
                            </div>

                            {/* Card 3: Actions Container */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <FiSave className="w-4 h-4" />
                                    {submitting ? 'Saving Changes...' : 'Save Changes'}
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

export default EditCoupon;
