import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiRefreshCw, FiCheckCircle, FiXCircle, FiCheck,
    FiClock, FiTrendingUp, FiShoppingBag, FiStar, FiPackage, FiX,
    FiUser, FiFileText, FiAlertCircle, FiTrash2, FiExternalLink, FiAlertTriangle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const ProductDetails = () => {
    const { productCode } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [approveConfirm, setApproveConfirm] = useState(false);
    const [rejectModal, setRejectModal] = useState({ open: false, reason: '' });
    const [statusModal, setStatusModal] = useState({ open: false, newStatus: '', reason: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchProductDetails();
    }, [productCode]);

    const fetchProductDetails = async () => {
        setLoading(true);
        try {
            const prodRes = await ApiService.getProductByCode(productCode);
            if (!prodRes.data.success) throw new Error(prodRes.data.message);
            setProduct(prodRes.data.data);
        } catch (error) {
            console.error("Product details error:", error.response?.data || error.message);
            toast.error('Failed to load product details');
            navigate('/admin/products');
            return;
        }

        try {
            const reviewRes = await ApiService.getProductReviews(productCode, { page: 1, limit: 10 });
            if (reviewRes.data.success) setReviews(reviewRes.data.data || []);
        } catch (_) { }

        try {
            const orderRes = await ApiService.getProductOrders(productCode, { page: 1, limit: 10 });
            if (orderRes.data.success) setOrders(orderRes.data.data || []);
        } catch (_) { }

        setLoading(false);
    };

    // Approve Product
    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await ApiService.approveProduct(productCode);
            toast.success(`Product "${product.product_name}" approved successfully!`);
            setApproveConfirm(false);
            fetchProductDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve product');
        } finally {
            setActionLoading(false);
        }
    };

    // Reject Product
    const handleReject = async () => {
        if (!rejectModal.reason.trim()) {
            toast.warning('Please enter a rejection reason');
            return;
        }
        setActionLoading(true);
        try {
            await ApiService.rejectProduct(productCode, { rejection_reason: rejectModal.reason.trim() });
            toast.success(`Product "${product.product_name}" rejected`);
            setRejectModal({ open: false, reason: '' });
            fetchProductDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject product');
        } finally {
            setActionLoading(false);
        }
    };

    // Marketplace Status Change
    const handleStatusChange = async () => {
        if (!statusModal.newStatus) return;
        setActionLoading(true);
        try {
            await ApiService.updateProductStatus(productCode, {
                status: statusModal.newStatus,
                reason: statusModal.reason.trim()
            });
            toast.success(`Product marketplace status changed to ${statusModal.newStatus}`);
            setStatusModal({ open: false, newStatus: '', reason: '' });
            fetchProductDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product status');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status, approvalStatus) => {
        if (status === 'deleted') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border bg-rose-50 text-rose-800 border-rose-300">
                    <FiTrash2 className="w-3.5 h-3.5" /> Deleted by Seller
                </span>
            );
        }
        if (approvalStatus === 'pending' || status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-300">
                    <FiClock className="w-3.5 h-3.5" /> Pending Admin Approval
                </span>
            );
        }
        if (approvalStatus === 'rejected' || status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-rose-50 text-rose-800 border-rose-300">
                    <FiXCircle className="w-3.5 h-3.5" /> Rejected
                </span>
            );
        }
        if (status === 'suspended') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-orange-50 text-orange-800 border-orange-300">
                    <FiAlertCircle className="w-3.5 h-3.5" /> Suspended
                </span>
            );
        }
        if (status === 'inactive') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-300">
                    <FiXCircle className="w-3.5 h-3.5" /> Inactive
                </span>
            );
        }
        if (status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-800 border-blue-300">
                    <FiCheckCircle className="w-3.5 h-3.5" /> Approved
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-300">
                <FiCheckCircle className="w-3.5 h-3.5" /> Active (Live)
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!product) return <div className="text-center py-12 text-slate-500">Product not found</div>;

    const isDeleted = product.status === 'deleted';
    const isPending = product.status === 'pending' || product.approval_status === 'pending';
    const isApprovedOrManaged = product.approval_status === 'approved' && !isDeleted;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Product Details"
                subtitle={`${product.product_name} (${product.product_code})`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Back to Products
                        </button>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* ====== DELETED NOTICE BANNER ====== */}
                {isDeleted && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-xs flex items-center gap-3 text-rose-800">
                        <FiTrash2 className="w-6 h-6 shrink-0 text-rose-600" />
                        <div>
                            <h4 className="font-bold text-sm">Product Deleted by Seller</h4>
                            <p className="text-xs text-rose-700 mt-0.5">
                                This product was removed by the seller. It is preserved for historical orders and auditing. No status or inventory modifications can be performed on this product.
                            </p>
                        </div>
                    </div>
                )}

                {/* ====== SUSPENDED NOTICE BANNER ====== */}
                {product.status === 'suspended' && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 shadow-xs flex items-center gap-3 text-orange-900">
                        <FiAlertTriangle className="w-6 h-6 shrink-0 text-orange-600" />
                        <div>
                            <h4 className="font-bold text-sm">Product Suspended on Marketplace</h4>
                            <p className="text-xs text-orange-800 mt-0.5">
                                This product remains visible on the customer store, but customer orders are blocked. Reason:{' '}
                                <strong>{product.suspension_reason || 'Administrative hold'}</strong>
                            </p>
                        </div>
                    </div>
                )}

                {/* ====== 1. PRODUCT HEADER & ACTIONS CARD ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {product.images?.[0] ? (
                                <img
                                    src={product.images[0]}
                                    alt={product.product_name}
                                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 bg-slate-50 shadow-xs"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-3xl font-bold text-white shadow-xs">
                                    {(product.product_name?.[0] || 'P').toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-xl font-bold text-slate-900">{product.product_name}</h2>
                                    {getStatusBadge(product.status, product.approval_status)}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Brand: <strong className="text-slate-700">{product.brand || 'N/A'}</strong> | SKU:{' '}
                                    <strong className="text-slate-700 font-mono">{product.sku || 'N/A'}</strong>
                                </p>
                                <p className="text-xs font-mono font-semibold text-blue-600 mt-1">
                                    Product Code: {product.product_code}
                                </p>
                            </div>
                        </div>

                        {/* Lifecycle & Status Management Controls */}
                        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            {/* If Pending Approval */}
                            {isPending && (
                                <>
                                    <button
                                        onClick={() => setApproveConfirm(true)}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
                                    >
                                        <FiCheck className="w-4 h-4" /> Approve Product
                                    </button>
                                    <button
                                        onClick={() => setRejectModal({ open: true, reason: '' })}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition"
                                    >
                                        <FiX className="w-4 h-4" /> Reject Product
                                    </button>
                                </>
                            )}

                            {/* If Approved: Marketplace Status Management */}
                            {isApprovedOrManaged && (
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                                    <span className="text-xs font-bold text-slate-600 pl-2">Marketplace Status:</span>
                                    <select
                                        value={product.status}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val !== product.status) {
                                                setStatusModal({ open: true, newStatus: val, reason: '' });
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    >
                                        <option value="active">🟢 Active (Live & Orderable)</option>
                                        <option value="inactive">⚪ Inactive (Hidden)</option>
                                        <option value="suspended">🟠 Suspended (Visible, No Orders)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ====== 2. STATS CARDS ====== */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><FiPackage className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{product.stock_quantity || 0}</p>
                                <p className="text-xs text-slate-500">Inventory Stock</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><FiShoppingBag className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{product.stats?.total_orders || orders.length || 0}</p>
                                <p className="text-xs text-slate-500">Total Orders</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><FiTrendingUp className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">₹{product.price || 0}</p>
                                <p className="text-xs text-slate-500">Listing Price</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-yellow-50 rounded-xl text-yellow-600"><FiStar className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{product.stats?.average_rating?.toFixed(1) || '0.0'}</p>
                                <p className="text-xs text-slate-500">Average Rating</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== 3. PRODUCT INFORMATION & SELLER DETAILS ====== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Metadata */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                            <FiFileText className="w-4 h-4 text-blue-600" /> Catalog Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-slate-400">Category</p>
                                <p className="font-semibold text-slate-800 mt-0.5">{product.category_id?.category_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Sub Category</p>
                                <p className="font-semibold text-slate-800 mt-0.5">{product.sub_category_id?.sub_category_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Price (INR)</p>
                                <p className="font-bold text-slate-900 mt-0.5">₹{product.price}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Compare at Price</p>
                                <p className="font-semibold text-slate-700 mt-0.5">₹{product.compare_at_price || product.price}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Current Stock</p>
                                <p className="font-semibold text-slate-800 mt-0.5">{product.stock_quantity || 0} units</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Added Date</p>
                                <p className="font-semibold text-slate-800 mt-0.5">
                                    {product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Seller Details Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <FiUser className="w-4 h-4 text-blue-600" /> Seller Information
                            </h3>
                            {product.seller_id?.seller_code && (
                                <button
                                    onClick={() => navigate(`/admin/sellers/${product.seller_id.seller_code}`)}
                                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    <span>View Seller Profile</span>
                                    <FiExternalLink className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                                {(product.seller_id?.business_name?.[0] || 'S').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">
                                    {product.seller_id?.business_name || 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Seller Code: <strong className="font-mono text-slate-700">{product.seller_id?.seller_code || 'N/A'}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <p className="text-slate-400">Contact Email</p>
                                <p className="font-medium text-slate-800 mt-0.5 truncate">{product.seller_id?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Phone</p>
                                <p className="font-medium text-slate-800 mt-0.5">{product.seller_id?.mobile_number || product.seller_id?.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== 4. DESCRIPTION & IMAGES ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Product Description</h3>
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {product.description || 'No description provided.'}
                    </p>

                    {product.images?.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="font-semibold text-slate-800 text-xs mb-3">Product Media ({product.images.length})</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {product.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`Product Image ${idx + 1}`}
                                        className="w-full h-24 object-cover rounded-xl border border-slate-200 bg-slate-50"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ====== 5. RECENT ORDERS ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Recent Orders</h3>
                    {orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Order #</th>
                                        <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Customer</th>
                                        <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Date</th>
                                        <th className="px-3.5 py-2.5 font-bold text-slate-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((order, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3.5 py-2.5 font-mono font-medium text-slate-900">
                                                {order.order_number || `#${order._id?.slice(-6)}`}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-slate-800">
                                                {order.user_id?.first_name} {order.user_id?.last_name}
                                            </td>
                                            <td className="px-3.5 py-2.5 text-slate-500">
                                                {new Date(order.created_at).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                                    {order.order_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 py-3 text-center">No customer orders recorded for this product yet.</p>
                    )}
                </div>

            </div>

            {/* ====== APPROVE CONFIRM DIALOG ====== */}
            <ConfirmDialog
                isOpen={approveConfirm}
                onClose={() => setApproveConfirm(false)}
                onConfirm={handleApprove}
                title="Approve Product Listing"
                message={`Are you sure you want to approve "${product.product_name}"? Once approved, the product can enter the marketplace lifecycle and be set to Active.`}
                confirmText={actionLoading ? 'Approving...' : 'Approve Product'}
                confirmColor="bg-emerald-600 hover:bg-emerald-700"
            />

            {/* ====== REJECT MODAL ====== */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-600">
                                <FiAlertTriangle className="w-5 h-5" />
                                <h3 className="font-bold text-base text-slate-900">Reject Product Listing</h3>
                            </div>
                            <button
                                onClick={() => setRejectModal({ open: false, reason: '' })}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-600">
                            Rejecting <strong>{product.product_name}</strong> will prevent it from becoming active on the marketplace.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                Rejection Reason <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Explain why this product was rejected..."
                                className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setRejectModal({ open: false, reason: '' })}
                                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={actionLoading || !rejectModal.reason.trim()}
                                className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl text-xs hover:bg-rose-700 disabled:opacity-50 transition"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== MARKETPLACE STATUS MODAL ====== */}
            {statusModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FiShield className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-base text-slate-900">Update Marketplace Status</h3>
                            </div>
                            <button
                                onClick={() => setStatusModal({ open: false, newStatus: '', reason: '' })}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1">
                            <p><strong>Product:</strong> {product.product_name}</p>
                            <p>
                                <strong>Status Change:</strong>{' '}
                                <span className="capitalize font-semibold text-slate-500">{product.status}</span>{' '}
                                → <span className="capitalize font-bold text-blue-600">{statusModal.newStatus}</span>
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                Note / Reason {statusModal.newStatus === 'suspended' ? <span className="text-orange-600">*</span> : '(Optional)'}
                            </label>
                            <input
                                type="text"
                                value={statusModal.reason}
                                onChange={(e) => setStatusModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder={statusModal.newStatus === 'suspended' ? "Reason for suspension..." : "Optional admin note..."}
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setStatusModal({ open: false, newStatus: '', reason: '' })}
                                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleStatusChange}
                                disabled={actionLoading || (statusModal.newStatus === 'suspended' && !statusModal.reason.trim())}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                                {actionLoading ? 'Updating...' : 'Confirm Status Change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;