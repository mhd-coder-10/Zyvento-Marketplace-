import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiShield, FiArrowLeft, FiEye } from 'react-icons/fi';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const ProductEdit = () => {
    const { productCode } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        toast.info('Seller owns product information. Admins manage status and approvals from Product Details.');
        const timer = setTimeout(() => {
            navigate(`/admin/products/${productCode}`, { replace: true });
        }, 1500);
        return () => clearTimeout(timer);
    }, [productCode, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <AdminTopbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FiShield className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        Product Details Managed by Seller
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
                        In accordance with the marketplace architecture, sellers manage their own product details (title, description, images, specifications). Administrators control marketplace status (Approval, Active, Inactive, Suspended) directly from the Product Details page.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-2"
                        >
                            <FiArrowLeft className="w-4 h-4" /> Back to Products
                        </button>
                        <button
                            onClick={() => navigate(`/admin/products/${productCode}`)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                            <FiEye className="w-4 h-4" /> Go to Product Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductEdit;