import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiHelpCircle, FiPlus, FiRefreshCw, FiSearch,
    FiCheckCircle, FiClock, FiEye, FiMessageSquare, FiChevronLeft,
    FiChevronRight, FiPackage, FiX, FiSend, FiAlertCircle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const REQUEST_TYPES = [
    { value: 'product_status_change', label: 'Product Status Change (Activate / Inactivate / Unsuspend)' },
    { value: 'product_approval', label: 'Product Approval Inquiry' },
    { value: 'category_request', label: 'New Category / Brand Approval' },
    { value: 'inventory_query', label: 'Inventory / Stock Query' },
    { value: 'account_support', label: 'Account / Store Support' },
    { value: 'other', label: 'Other Request' },
];

const STATUS_TABS = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'read', label: 'Read by Admin', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'in_progress', label: 'In Progress', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { id: 'solved', label: 'Solved', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
];

const SellerRequests = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    // Products for dropdown
    const [myProducts, setMyProducts] = useState([]);

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createForm, setCreateForm] = useState({
        product_id: searchParams.get('product') || '',
        request_type: 'product_status_change',
        requested_status: 'active',
        reason: '',
        message: '',
    });

    // Detail Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Fetch Seller's Products for selection
    const fetchMyProducts = async () => {
        try {
            const res = await ApiService.getSellerMyProducts({ limit: 100 });
            const list = res?.data?.data?.products || res?.data?.data || [];
            setMyProducts(Array.isArray(list) ? list : []);
        } catch (_) {}
    };

    // Fetch Requests
    const fetchRequests = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                search: searchQuery || undefined,
            };
            const res = await ApiService.getMySellerRequests(params);
            if (res.data?.success) {
                const list = res.data?.data || [];
                setRequests(Array.isArray(list) ? list : []);
                const pag = res.data?.pagination || { total: list.length, totalPages: 1 };
                setPagination(prev => ({
                    ...prev,
                    total: pag.total || 0,
                    totalPages: pag.totalPages || 1
                }));
            }
        } catch (error) {
            console.error('Failed to fetch seller requests:', error);
            toast.error(error.response?.data?.message || 'Failed to load requests');
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, searchQuery]);

    useEffect(() => {
        fetchMyProducts();
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Handle Create Request
    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (!createForm.reason.trim()) {
            toast.warning('Please provide a reason for the request');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                product_id: createForm.product_id || null,
                request_type: createForm.request_type,
                requested_status: createForm.request_type === 'product_status_change' ? createForm.requested_status : 'none',
                reason: createForm.reason.trim(),
                message: createForm.message.trim(),
            };

            const res = await ApiService.createSellerRequest(payload);
            if (res.data?.success) {
                toast.success('Request submitted successfully to Admin!');
                setShowCreateModal(false);
                setCreateForm({
                    product_id: '',
                    request_type: 'product_status_change',
                    requested_status: 'active',
                    reason: '',
                    message: '',
                });
                fetchRequests();
            } else {
                toast.error(res.data?.message || 'Failed to submit request');
            }
        } catch (err) {
            console.error('Submit request error:', err);
            toast.error(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <FiClock className="w-3 h-3" /> Pending Review
                    </span>
                );
            case 'read':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        <FiEye className="w-3 h-3" /> Read by Admin
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                        <FiRefreshCw className="w-3 h-3 animate-spin" /> In Progress
                    </span>
                );
            case 'solved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <FiCheckCircle className="w-3 h-3" /> Solved
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <span>Seller Central</span>
                        <span>/</span>
                        <span className="font-bold text-slate-800">Requests</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                        <FiMessageSquare className="text-blue-600 w-6 h-6" />
                        Seller Requests to Admin
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Submit and track requests for product status changes, approvals, and administrative assistance.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => { fetchRequests(); }}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition"
                        title="Refresh"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-200 hover:from-sky-600 hover:to-blue-700 transition"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span>New Request</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl border border-sky-100 p-2 shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setStatusFilter(tab.id);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs">
                <div className="relative">
                    <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        placeholder="Search by request code, reason, or message..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs sm:text-sm bg-white"
                    />
                </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {loading && !isRefreshing ? (
                    <div className="bg-white rounded-2xl border border-sky-100 p-12 text-center text-slate-400">
                        <FiRefreshCw className="animate-spin text-blue-600 w-7 h-7 mx-auto mb-2" />
                        <p className="text-xs font-medium">Loading your requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-sky-100 p-12 text-center">
                        <div className="w-14 h-14 bg-sky-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <FiMessageSquare className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">No requests found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                            {searchQuery || statusFilter !== 'all'
                                ? 'No requests match your current filters.'
                                : 'You have not submitted any requests to Super Admin yet.'}
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                        >
                            Create Your First Request
                        </button>
                    </div>
                ) : (
                    requests.map((req) => {
                        const isSolved = req.status === 'solved';

                        return (
                            <div
                                key={req._id}
                                className="bg-white rounded-2xl border border-sky-100 p-5 shadow-xs space-y-4 hover:border-sky-200 transition"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-bold bg-sky-50 text-blue-700 px-2.5 py-1 rounded-lg border border-sky-100">
                                            {req.request_code}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700 capitalize">
                                            {req.request_type?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(req.status)}
                                        <span className="text-[11px] text-slate-400">
                                            {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            }) : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Associated Product */}
                                    {req.product_id ? (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                            {req.product_id.images?.[0] ? (
                                                <img
                                                    src={req.product_id.images[0]}
                                                    alt={req.product_id.product_name}
                                                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                    {(req.product_id.product_name?.[0] || 'P').toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate" title={req.product_id.product_name}>
                                                    {req.product_id.product_name}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-mono">
                                                    {req.product_id.product_code}
                                                </p>
                                                <span className="text-[10px] capitalize font-semibold text-slate-600">
                                                    Current Status: {req.product_id.status}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-500">
                                            <FiPackage className="w-4 h-4 text-slate-400" />
                                            <span>General Request (No Product)</span>
                                        </div>
                                    )}

                                    {/* Reason & Requested Status */}
                                    <div className="md:col-span-2 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason:</span>
                                            <p className="text-xs font-semibold text-slate-800">{req.reason}</p>
                                            {req.requested_status && req.requested_status !== 'none' && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                    Requested: {req.requested_status}
                                                </span>
                                            )}
                                        </div>
                                        {req.message && (
                                            <p className="text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 whitespace-pre-line">
                                                {req.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Admin Response / Solution Banner */}
                                {req.admin_response && (
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                                                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Admin Solution / Response:</span>
                                            </div>
                                            {req.responded_at && (
                                                <span className="text-[10px] text-emerald-700 font-medium">
                                                    {new Date(req.responded_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-emerald-900 leading-relaxed font-medium pl-6">
                                            "{req.admin_response}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="p-4 bg-white rounded-2xl border border-sky-100 flex items-center justify-between text-xs text-slate-600">
                    <span>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total requests)
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <FiChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <FiChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ====== CREATE REQUEST MODAL ====== */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-blue-600">
                                <FiMessageSquare className="w-5 h-5" />
                                <h3 className="font-bold text-base text-slate-900">Create Request to Admin</h3>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className="space-y-4">
                            {/* Product Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Select Product (Optional)
                                </label>
                                <select
                                    value={createForm.product_id}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, product_id: e.target.value }))}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:outline-none bg-white text-slate-700"
                                >
                                    <option value="">General Request / No specific product</option>
                                    {myProducts.map((p) => (
                                        <option key={p._id || p.id} value={p._id || p.id}>
                                            {p.product_name} ({p.product_code}) - Current: {p.status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Request Type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Request Type <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={createForm.request_type}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, request_type: e.target.value }))}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:outline-none bg-white text-slate-700"
                                >
                                    {REQUEST_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Requested Status (if product_status_change) */}
                            {createForm.request_type === 'product_status_change' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                        Desired Marketplace Status
                                    </label>
                                    <select
                                        value={createForm.requested_status}
                                        onChange={(e) => setCreateForm(prev => ({ ...prev, requested_status: e.target.value }))}
                                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:outline-none bg-white text-slate-700"
                                    >
                                        <option value="active">Active (Make live for customer purchases)</option>
                                        <option value="inactive">Inactive (Hide temporarily from store)</option>
                                        <option value="suspended">Suspended (Keep visible, block ordering)</option>
                                    </select>
                                </div>
                            )}

                            {/* Reason */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Reason <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={createForm.reason}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="e.g. Product is ready for customer orders / Need reactivation after restock"
                                    required
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            {/* Additional Details */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                                    Additional Message / Details
                                </label>
                                <textarea
                                    rows={3}
                                    value={createForm.message}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Please provide any extra context or details for the admin..."
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl text-xs hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 transition shadow-sm"
                                >
                                    <FiSend className="w-3.5 h-3.5" />
                                    <span>{submitting ? 'Submitting...' : 'Send Request'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerRequests;
