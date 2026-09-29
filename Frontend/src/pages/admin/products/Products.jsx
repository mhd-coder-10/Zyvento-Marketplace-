import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiEye, FiTrash2, FiRefreshCw,
    FiSearch, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle,
    FiClock, FiPackage, FiAlertCircle, FiUserX, FiDownload, FiLayers, FiShield, FiX
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const TABS = [
    { id: 'overview', label: 'Overview', icon: FiLayers },
    { id: 'pending', label: 'Pending', icon: FiClock, color: 'text-amber-600 bg-amber-50' },
    { id: 'approved', label: 'Approved', icon: FiCheckCircle, color: 'text-blue-600 bg-blue-50' },
    { id: 'active', label: 'Active', icon: FiCheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'inactive', label: 'Inactive', icon: FiUserX, color: 'text-gray-600 bg-gray-50' },
    { id: 'suspended', label: 'Suspended', icon: FiAlertCircle, color: 'text-orange-600 bg-orange-50' },
    { id: 'deleted', label: 'Deleted', icon: FiTrash2, color: 'text-rose-600 bg-rose-50' },
    { id: 'all_products', label: 'All Products', icon: FiPackage },
];

const Products = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sellerFilter, setSellerFilter] = useState('all');

    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);

    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        suspended: 0,
        inactive: 0,
        deleted: 0
    });

    // Modals / Dialogs
    const [approveConfirm, setApproveConfirm] = useState({ open: false, product: null });
    const [rejectModal, setRejectModal] = useState({ open: false, product: null, reason: '' });
    const [statusModal, setStatusModal] = useState({ open: false, product: null, newStatus: '', reason: '' });
    const [actionLoading, setActionLoading] = useState(false);

    // Sync tab with URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && TABS.some(t => t.id === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Fetch Products
    const fetchProducts = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // Determine backend status param according to active tab
            let queryStatus;
            if (activeTab === 'overview') {
                queryStatus = statusFilter !== 'all' ? statusFilter : 'overview';
            } else if (activeTab === 'all_products') {
                queryStatus = statusFilter !== 'all' ? statusFilter : 'all_products';
            } else {
                queryStatus = activeTab;
            }

            const params = {
                admin: true,
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery || undefined,
                status: queryStatus,
                category: categoryFilter !== 'all' ? categoryFilter : undefined,
                seller_id: sellerFilter !== 'all' ? sellerFilter : undefined,
            };

            const response = await ApiService.getAllProducts(params);
            if (response.data.success) {
                const prodData = response.data.data?.products || response.data.data || [];
                setProducts(Array.isArray(prodData) ? prodData : []);
                const pag = response.data.pagination || {
                    total: response.data.total || prodData.length,
                    totalPages: response.data.totalPages || 1
                };
                setPagination(prev => ({
                    ...prev,
                    total: pag.total || 0,
                    totalPages: pag.totalPages || 1
                }));
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            toast.error(error.response?.data?.message || 'Failed to load products');
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [activeTab, pagination.page, pagination.limit, searchQuery, statusFilter, categoryFilter, sellerFilter]);

    // Fetch Stats
    const fetchStats = async () => {
        try {
            const response = await ApiService.getProductStats();
            if (response.data.success) {
                const data = response.data.data || {};
                setStats({
                    total: data.total || 0,
                    active: data.active || 0,
                    pending: data.pending || 0,
                    approved: data.approved || 0,
                    rejected: data.rejected || 0,
                    suspended: data.suspended || 0,
                    inactive: data.inactive || 0,
                    deleted: data.deleted || 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    // Fetch Categories
    const fetchCategories = async () => {
        try {
            const response = await ApiService.getProductCategories();
            if (response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    // Fetch Sellers for filter
    const fetchSellers = async () => {
        try {
            const response = await ApiService.getAllSellers({ limit: 100 });
            const list = response.data?.data?.sellers || response.data?.data || [];
            setSellers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Failed to fetch sellers:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchStats();
        fetchCategories();
        fetchSellers();
    }, []);

    // Filter Handlers
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleCategoryFilter = (e) => {
        setCategoryFilter(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSellerFilter = (e) => {
        setSellerFilter(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleStatusFilter = (e) => {
        setStatusFilter(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Approve Handler
    const handleApproveProduct = async () => {
        if (!approveConfirm.product) return;
        setActionLoading(true);
        try {
            await ApiService.approveProduct(approveConfirm.product.product_code);
            toast.success(`Product "${approveConfirm.product.product_name}" approved successfully!`);
            setApproveConfirm({ open: false, product: null });
            fetchProducts();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve product');
        } finally {
            setActionLoading(false);
        }
    };

    // Reject Handler
    const handleRejectProduct = async () => {
        if (!rejectModal.product) return;
        if (!rejectModal.reason.trim()) {
            toast.warning('Please enter a rejection reason');
            return;
        }
        setActionLoading(true);
        try {
            await ApiService.rejectProduct(rejectModal.product.product_code, {
                rejection_reason: rejectModal.reason.trim()
            });
            toast.success(`Product "${rejectModal.product.product_name}" rejected`);
            setRejectModal({ open: false, product: null, reason: '' });
            fetchProducts();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject product');
        } finally {
            setActionLoading(false);
        }
    };

    // Status Change Handler (Active, Inactive, Suspended)
    const handleStatusChange = async () => {
        if (!statusModal.product || !statusModal.newStatus) return;
        setActionLoading(true);
        try {
            await ApiService.updateProductStatus(statusModal.product.product_code, {
                status: statusModal.newStatus,
                reason: statusModal.reason.trim()
            });
            toast.success(`Product marketplace status changed to ${statusModal.newStatus}`);
            setStatusModal({ open: false, product: null, newStatus: '', reason: '' });
            fetchProducts();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product status');
        } finally {
            setActionLoading(false);
        }
    };

    // Export Products
    const handleExport = async () => {
        try {
            const response = await ApiService.exportProducts({ search: searchQuery });
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Products exported successfully');
        } catch (error) {
            toast.error('Failed to export products');
        }
    };

    // Status Badge Component
    const getStatusBadge = (status, approvalStatus) => {
        if (status === 'deleted') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-rose-50 text-rose-800 border-rose-300">
                    <FiTrash2 className="w-3 h-3" /> Deleted
                </span>
            );
        }
        if (approvalStatus === 'pending' || status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-amber-50 text-amber-800 border-amber-300">
                    <FiClock className="w-3 h-3" /> Pending Approval
                </span>
            );
        }
        if (approvalStatus === 'rejected' || status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-rose-50 text-rose-800 border-rose-300">
                    <FiXCircle className="w-3 h-3" /> Rejected
                </span>
            );
        }
        if (status === 'suspended') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-orange-50 text-orange-800 border-orange-300">
                    <FiAlertCircle className="w-3 h-3" /> Suspended
                </span>
            );
        }
        if (status === 'inactive') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-300">
                    <FiUserX className="w-3 h-3" /> Inactive
                </span>
            );
        }
        if (status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-800 border-blue-300">
                    <FiCheckCircle className="w-3 h-3" /> Approved
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-300">
                <FiCheckCircle className="w-3 h-3" /> Active
            </span>
        );
    };

    const getTabCount = (tabId) => {
        switch (tabId) {
            case 'pending': return stats.pending;
            case 'approved': return stats.approved;
            case 'active': return stats.active;
            case 'inactive': return stats.inactive;
            case 'suspended': return stats.suspended;
            case 'deleted': return stats.deleted;
            case 'all_products': return (stats.total || 0) + (stats.deleted || 0);
            case 'overview': return stats.total;
            default: return 0;
        }
    };

    if (loading && !isRefreshing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Product Management"
                subtitle="Review, approve, and manage marketplace product lifecycle"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                        >
                            <FiDownload className="w-4 h-4 text-blue-600" /> Export
                        </button>
                        <button
                            onClick={() => { fetchProducts(); fetchStats(); }}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                            title="Refresh data"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">

                {/* ====== TABS NAVIGATION ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                        {TABS.map((tab) => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const count = getTabCount(tab.id);

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4 shrink-0" />
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ====== SEARCH & FILTERS BAR ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search by name, SKU, or code..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white"
                            />
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                value={categoryFilter}
                                onChange={handleCategoryFilter}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Seller Filter */}
                        <div>
                            <select
                                value={sellerFilter}
                                onChange={handleSellerFilter}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700"
                            >
                                <option value="all">All Sellers</option>
                                {sellers.map((seller) => (
                                    <option key={seller._id || seller.id} value={seller._id || seller.id}>
                                        {seller.business_name || seller.owner_name || seller.seller_code}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter (Active on Overview or All Products) */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={handleStatusFilter}
                                disabled={activeTab !== 'overview' && activeTab !== 'all_products'}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700 disabled:opacity-50 disabled:bg-slate-50"
                            >
                                <option value="all">
                                    {activeTab === 'overview' || activeTab === 'all_products' ? 'All Statuses' : `Status: ${activeTab}`}
                                </option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                                <option value="deleted">Deleted</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ====== PRODUCTS TABLE ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="relative">
                        {isRefreshing && (
                            <div className="absolute top-0 left-0 right-0 bg-blue-500/10 backdrop-blur-[1px] z-10 flex justify-center py-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white px-3 py-1 rounded-full shadow-sm">
                                    <FiRefreshCw className="animate-spin w-3.5 h-3.5 text-blue-600" />
                                    Updating...
                                </div>
                            </div>
                        )}

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto scrollbar-thin">
                            <table className="w-full min-w-[1100px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-5 py-4 min-w-[260px]">Product</th>
                                        <th className="px-4 py-4 min-w-[170px]">Seller</th>
                                        <th className="px-4 py-4 min-w-[120px]">Category</th>
                                        <th className="px-4 py-4 min-w-[100px]">Price</th>
                                        <th className="px-4 py-4 min-w-[90px] text-center">Stock</th>
                                        <th className="px-4 py-4 min-w-[130px]">Status</th>
                                        <th className="px-4 py-4 min-w-[120px]">Created</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap min-w-[160px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                    {products.map((product) => {
                                        const isDeleted = product.status === 'deleted';
                                        const isPending = product.status === 'pending' || product.approval_status === 'pending';
                                        const isApprovedOrManaged = product.approval_status === 'approved' && !isDeleted;

                                        return (
                                            <tr
                                                key={product._id}
                                                className={`transition-colors hover:bg-slate-50/80 ${isDeleted ? 'bg-slate-50/40 opacity-75' : ''}`}
                                            >
                                                {/* Product Info */}
                                                <td className="px-5 py-3.5 min-w-[260px]">
                                                    <div className="flex items-center gap-3">
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.product_name}
                                                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                                                                {(product.product_name?.[0] || 'P').toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 max-w-xs">
                                                            <p className="font-semibold text-slate-900 truncate" title={product.product_name}>
                                                                {product.product_name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                                    {product.product_code || 'N/A'}
                                                                </span>
                                                                {product.sku && <span className="truncate">SKU: {product.sku}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Seller */}
                                                <td className="px-4 py-3.5 min-w-[170px]">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                                                            {product.seller_id?.business_name || 'N/A'}
                                                        </p>
                                                        {product.seller_id?.seller_code && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/admin/sellers/${product.seller_id.seller_code}`)}
                                                                className="text-[11px] text-blue-600 hover:underline hover:text-blue-700 font-mono mt-0.5 inline-block whitespace-nowrap font-medium"
                                                            >
                                                                {product.seller_id.seller_code}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td className="px-4 py-3.5 text-slate-600 min-w-[120px]">
                                                    {product.category_id?.category_name || 'N/A'}
                                                </td>

                                                {/* Price */}
                                                <td className="px-4 py-3.5 min-w-[100px]">
                                                    <span className="font-bold text-slate-900">₹{product.price || 0}</span>
                                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                                        <span className="block text-[11px] text-slate-400 line-through">₹{product.compare_at_price}</span>
                                                    )}
                                                </td>

                                                {/* Stock */}
                                                <td className="px-4 py-3.5 text-center min-w-[90px]">
                                                    <span className={`inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-full text-xs font-bold ${(product.stock_quantity || 0) <= 0
                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        : (product.stock_quantity || 0) <= 5
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        }`}>
                                                        {product.stock_quantity || 0}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 min-w-[130px]">
                                                    {getStatusBadge(product.status, product.approval_status)}
                                                </td>

                                                {/* Created Date */}
                                                <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap min-w-[120px]">
                                                    {product.created_at
                                                        ? new Date(product.created_at).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : 'N/A'}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-3.5 text-right whitespace-nowrap min-w-[160px]">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* View Details */}
                                                        <button
                                                            onClick={() => navigate(`/admin/products/${product.product_code || product._id}`)}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-all shadow-2xs"
                                                            title="View Product Details"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>

                                                        {/* Actions for Pending Products */}
                                                        {isPending && (
                                                            <>
                                                                <button
                                                                    onClick={() => setApproveConfirm({ open: true, product })}
                                                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition-all shadow-2xs"
                                                                    title="Approve Product"
                                                                >
                                                                    <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectModal({ open: true, product, reason: '' })}
                                                                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 transition-all shadow-2xs"
                                                                    title="Reject Product"
                                                                >
                                                                    <FiXCircle className="w-3.5 h-3.5 text-rose-600" /> Reject
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Marketplace Status Manager for Approved Products */}
                                                        {isApprovedOrManaged && (
                                                            <div className="relative inline-block">
                                                                <select
                                                                    value={product.status}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        if (val !== product.status) {
                                                                            setStatusModal({
                                                                                open: true,
                                                                                product,
                                                                                newStatus: val,
                                                                                reason: ''
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs transition-all"
                                                                >
                                                                    <option value="active">🟢 Active</option>
                                                                    <option value="inactive">⚪ Inactive</option>
                                                                    <option value="suspended">🟠 Suspended</option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* Deleted Product Badge (No Actions) */}
                                                        {isDeleted && (
                                                            <span
                                                                className="text-[11px] font-semibold text-slate-400 italic px-2.5 py-1 bg-slate-100 rounded-xl border border-slate-200"
                                                                title="Product was deleted by the seller. Historical record preserved."
                                                            >
                                                                Deleted by Seller
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile & Tablet Card View */}
                        <div className="lg:hidden divide-y divide-slate-100 p-4 space-y-4">
                            {products.map((product) => {
                                const isDeleted = product.status === 'deleted';
                                const isPending = product.status === 'pending' || product.approval_status === 'pending';
                                const isApprovedOrManaged = product.approval_status === 'approved' && !isDeleted;

                                return (
                                    <div
                                        key={product._id}
                                        className={`rounded-xl border border-slate-200 p-4 space-y-3 bg-white shadow-xs ${isDeleted ? 'opacity-70 bg-slate-50' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.product_name}
                                                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {(product.product_name?.[0] || 'P').toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-bold text-slate-900 text-sm truncate">
                                                        {product.product_name}
                                                    </p>
                                                    {getStatusBadge(product.status, product.approval_status)}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                        {product.product_code}
                                                    </span>
                                                    <span>Seller: <strong className="text-slate-800">{product.seller_id?.business_name || 'N/A'}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-2.5">
                                            <div>
                                                <span className="text-slate-400">Category:</span>{' '}
                                                <span className="font-semibold text-slate-700">{product.category_id?.category_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Stock:</span>{' '}
                                                <span className="font-semibold text-slate-700">{product.stock_quantity || 0} units</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Price:</span>{' '}
                                                <span className="font-bold text-slate-900">₹{product.price || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Date:</span>{' '}
                                                <span className="font-medium text-slate-600">
                                                    {product.created_at ? new Date(product.created_at).toLocaleDateString('en-IN') : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions Bar */}
                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <button
                                                onClick={() => navigate(`/admin/products/${product.product_code}`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                                            >
                                                <FiEye className="w-3.5 h-3.5 text-blue-600" /> View Details
                                            </button>

                                            {isPending && (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setApproveConfirm({ open: true, product })}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ open: true, product, reason: '' })}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs hover:bg-rose-100 transition"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}

                                            {isApprovedOrManaged && (
                                                <select
                                                    value={product.status}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val !== product.status) {
                                                            setStatusModal({
                                                                open: true,
                                                                product,
                                                                newStatus: val,
                                                                reason: ''
                                                            });
                                                        }
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            )}

                                            {isDeleted && (
                                                <span className="text-xs text-slate-400 italic">
                                                    No actions (Deleted)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {products.length === 0 && !isRefreshing && (
                            <div className="text-center py-16 px-4">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                                    <FiPackage className="w-8 h-8" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">No products found</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                    {searchQuery || categoryFilter !== 'all' || sellerFilter !== 'all'
                                        ? 'No products matched your search or filter criteria. Try adjusting your filters.'
                                        : `No products currently in the "${activeTab.replace(/_/g, ' ')}" status.`}
                                </p>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {pagination.totalPages > 1 && (
                            <div className="px-4 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
                                <div>
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    <span className="font-bold text-slate-900">{pagination.total}</span> products
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                                    >
                                        <FiChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-3 py-1 font-semibold text-slate-800">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                                    >
                                        <FiChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ====== APPROVE CONFIRM DIALOG ====== */}
            <ConfirmDialog
                isOpen={approveConfirm.open}
                onClose={() => setApproveConfirm({ open: false, product: null })}
                onConfirm={handleApproveProduct}
                title="Approve Product Listing"
                message={`Are you sure you want to approve "${approveConfirm.product?.product_name}"? Once approved, the product can enter the marketplace lifecycle and be set to Active.`}
                confirmText={actionLoading ? 'Approving...' : 'Approve Product'}
                confirmColor="bg-emerald-600 hover:bg-emerald-700"
            />

            {/* ====== REJECT MODAL WITH REASON ====== */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-600">
                                <FiAlertTriangle className="w-5 h-5" />
                                <h3 className="font-bold text-base text-slate-900">Reject Product Listing</h3>
                            </div>
                            <button
                                onClick={() => setRejectModal({ open: false, product: null, reason: '' })}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-600">
                            Rejecting <strong>{rejectModal.product?.product_name}</strong> will keep it out of the customer catalog. The seller will be notified of the rejection reason.
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                Rejection Reason <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Explain why this product was rejected (e.g. Incomplete description, inappropriate imagery, trademark violation)..."
                                className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setRejectModal({ open: false, product: null, reason: '' })}
                                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRejectProduct}
                                disabled={actionLoading || !rejectModal.reason.trim()}
                                className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl text-xs hover:bg-rose-700 disabled:opacity-50 transition"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== MARKETPLACE STATUS CHANGE MODAL ====== */}
            {statusModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FiShield className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-base text-slate-900">Update Marketplace Status</h3>
                            </div>
                            <button
                                onClick={() => setStatusModal({ open: false, product: null, newStatus: '', reason: '' })}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1">
                            <p><strong>Product:</strong> {statusModal.product?.product_name}</p>
                            <p>
                                <strong>Status Change:</strong>{' '}
                                <span className="capitalize font-semibold text-slate-500">{statusModal.product?.status}</span>{' '}
                                → <span className="capitalize font-bold text-blue-600">{statusModal.newStatus}</span>
                            </p>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1.5">
                            {statusModal.newStatus === 'active' && (
                                <p className="text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                                    ✓ <strong>Active:</strong> Product will be live on customer marketplace and customers can place orders.
                                </p>
                            )}
                            {statusModal.newStatus === 'inactive' && (
                                <p className="text-slate-700 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                                    ✗ <strong>Inactive:</strong> Product will be hidden from customer search and cannot be ordered.
                                </p>
                            )}
                            {statusModal.newStatus === 'suspended' && (
                                <p className="text-orange-800 bg-orange-50 p-2.5 rounded-lg border border-orange-200">
                                    ⚠️ <strong>Suspended:</strong> Product remains visible on website, but ordering is blocked.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                Note / Reason {statusModal.newStatus === 'suspended' ? <span className="text-orange-600">*</span> : '(Optional)'}
                            </label>
                            <input
                                type="text"
                                value={statusModal.reason}
                                onChange={(e) => setStatusModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder={statusModal.newStatus === 'suspended' ? "Enter reason for suspension..." : "Optional admin note..."}
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setStatusModal({ open: false, product: null, newStatus: '', reason: '' })}
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

export default Products;