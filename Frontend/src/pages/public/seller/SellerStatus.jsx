import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiAlertCircle,
    FiArrowLeft,
    FiShoppingBag,
    FiCalendar,
    FiArrowRight,
    FiRefreshCw
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const SellerStatus = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [sellerStatus, setSellerStatus] = useState('pending'); // pending, approved, rejected, cancelled

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/status-seller' } });
            return;
        }
        checkStatus();
    }, [isAuthenticated]);

    const checkStatus = async () => {
        setLoading(true);
        try {
            // Check seller profile or status
            const res = await ApiService.getSellerProfile();
            if (res.data.success && res.data.data) {
                const s = res.data.data.status || (user?.role === 'seller' ? 'approved' : 'pending');
                setSellerStatus(s);
            } else if (user?.role === 'seller') {
                setSellerStatus('approved');
            } else {
                setSellerStatus('pending');
            }
        } catch (error) {
            if (user?.role === 'seller') {
                setSellerStatus('approved');
            } else {
                setSellerStatus('pending');
            }
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = {
        approved: { label: 'Approved & Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <FiCheckCircle className="w-5 h-5 text-emerald-600" /> },
        pending: { label: 'Application Under Review', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <FiClock className="w-5 h-5 text-amber-600" /> },
        rejected: { label: 'Application Declined', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: <FiXCircle className="w-5 h-5 text-rose-600" /> },
        cancelled: { label: 'Application Cancelled', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: <FiAlertCircle className="w-5 h-5 text-slate-600" /> },
    };

    const cur = statusBadge[sellerStatus] || statusBadge.pending;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 py-12 px-4 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Checking application status…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Breadcrumb & Back */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/become-seller')}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back to Seller Application
                    </button>
                    <Link to="/profile" className="text-xs font-bold text-blue-600 hover:underline">
                        My Account
                    </Link>
                </div>

                {/* Status Hero Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-slate-900">
                                Seller Application Status
                            </h1>
                            <p className="text-xs text-slate-500">
                                Track your merchant verification and onboarding status
                            </p>
                        </div>

                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${cur.bg} text-xs font-bold`}>
                            {cur.icon}
                            <span>{cur.label}</span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6 pt-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Verification Timeline
                        </h3>

                        <div className="space-y-6 pl-4 border-l-2 border-slate-200">
                            <div className="relative">
                                <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow" />
                                <h4 className="text-xs font-bold text-slate-900">1. Registration Submitted</h4>
                                <p className="text-[11px] text-slate-500">Business details and GST credentials captured</p>
                            </div>

                            <div className="relative">
                                <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full border-4 border-white shadow ${
                                    sellerStatus === 'approved' ? 'bg-emerald-500' : 'bg-blue-600 animate-pulse'
                                }`} />
                                <h4 className="text-xs font-bold text-slate-900">2. Document & KYC Verification</h4>
                                <p className="text-[11px] text-slate-500">
                                    {sellerStatus === 'approved' ? 'Completed & verified' : 'In review by Zyvento Admin Compliance Team (Takes 24-48 hrs)'}
                                </p>
                            </div>

                            <div className="relative">
                                <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full border-4 border-white shadow ${
                                    sellerStatus === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'
                                }`} />
                                <h4 className="text-xs font-bold text-slate-900">3. Merchant Store Activation</h4>
                                <p className="text-[11px] text-slate-500">
                                    {sellerStatus === 'approved' ? 'Store is live! You can now publish products' : 'Pending KYC approval'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action trigger */}
                    {sellerStatus === 'approved' ? (
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs text-emerald-700 font-bold">
                                Congratulations! Your merchant account is activated.
                            </p>
                            <Link
                                to="/seller/dashboard"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all"
                            >
                                <FiShoppingBag className="w-4 h-4" />
                                Launch Seller Dashboard
                            </Link>
                        </div>
                    ) : (
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                            <span>Need urgent assistance with your merchant application?</span>
                            <Link to="/help-center" className="font-bold text-blue-600 hover:underline">
                                Contact Seller Support
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SellerStatus;
