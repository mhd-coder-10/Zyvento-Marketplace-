import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiClock, FiArrowLeft, FiLayers } from 'react-icons/fi';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const CreateProduct = () => {
    const navigate = useNavigate();

    useEffect(() => {
        toast.info('Products are created by sellers and submitted for Admin approval.');
        const timer = setTimeout(() => {
            navigate('/admin/products?tab=pending', { replace: true });
        }, 1500);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <AdminTopbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiClock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        Seller Submission Flow
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                        In this marketplace, products are created directly by sellers from their Seller Portal. Newly created products arrive in the Admin Pending review queue for verification and approval.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-2"
                        >
                            <FiArrowLeft className="w-4 h-4" /> Products Overview
                        </button>
                        <button
                            onClick={() => navigate('/admin/products?tab=pending')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                            <FiLayers className="w-4 h-4" /> View Pending Approvals
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProduct;
