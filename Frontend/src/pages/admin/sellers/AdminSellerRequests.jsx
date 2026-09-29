import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiMessageSquare, FiRefreshCw, FiSearch, FiCheckCircle,
    FiClock, FiEye, FiUser, FiPackage, FiChevronLeft,
    FiChevronRight, FiX, FiCheck, FiSend, FiExternalLink,
    FiAlertCircle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const STATUS_TABS = [
    { id: 'all', label: 'All Requests' },
    { id: 'pending', label: 'Pending', countKey: 'pending' },
    { id: 'read', label: 'Read', countKey: 'read' },
    { id: 'in_progress', label: 'In Progress', countKey: 'in_progress' },
    { id: 'solved', label: 'Solved', countKey: 'solved' },
];

const AdminSellerRequests = () => {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sellerFilter, setSellerFilter] = useState('all');
    const [sellers, setSellers] = useState([]);

    const [stats, setStats] = useState({ total: 0, pending: 0, read: 0, in_progress: 0, solved: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    // Manage / Solve Modal State
    const [manageModal, setManageModal] = useState({
        open: false,
        request: null,
        status: '',
        admin_response: '',
        update_product_status: true,
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch Stats
    const fetchStats = async () => {
        try {
            const res = await ApiService.getAdminSellerRequestStats();
            if (res.data?.success) {
                setStats(res.data.data || {});
            }
        } catch (_) {}
    };

    // Fetch Sellers list for filter
    const fetchSellers = async () => {
        try {
            const res = await ApiService.getAllSellers({ limit: 100 });
            const list = res?.data?.data?.sellers || res?.data?.data || [];
            setSellers(Array.isArray(list) ? list : []);
        } catch (_) {}
    };

    // Fetch Requests
    const fetchRequests = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                status: activeTab !== 'all' ? activeTab : undefined,
                request_type: typeFilter !== 'all' ? typeFilter : undefined,
                seller_id: sellerFilter !== 'all' ? sellerFilter : undefined,
                search: searchQuery || undefined,
            };

            const res = await ApiService.getAdminSellerRequests(params);
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
            console.error('Failed to load seller requests:', error);
            toast.error(error.response?.data?.message || 'Failed to load seller requests');
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, activeTab, typeFilter, sellerFilter, searchQuery]);

    useEffect(() => {
        fetchStats();
        fetchSellers();
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Open Manage Modal
    const openManageModal = (req) => {
        setManageModal({
            open: true,
            request: req,
            status: req.status === 'pending' ? 'read' : req.status,
            admin_response: req.admin_response || '',
            update_product_status: Boolean(req.product_id && req.requested_status && req.requested_status !== 'none'),
        });
    };

    // Submit Status Update / Solution
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!manageModal.request) return;

        if (manageModal.status === 'solved' && !manageModal.admin_response.trim()) {
            toast.warning('Please enter a response / solution message for the seller');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                status: manageModal.status,
                admin_response: manageModal.admin_response.trim(),
                update_product_status: manageModal.update_product_status,
            };

            const res = await ApiService.updateAdminSellerRequestStatus(manageModal.request.request_code, payload);
            if (res.data?.success) {
                toast.success(`Request ${manageModal.request.request_code} updated to ${manageModal.status}`);
                setManageModal({ open: false, request: null, status: '', admin_response: '', update_product_status: true });
                fetchRequests();
                fetchStats();
            } else {
                toast.error(res.data?.message || 'Failed to update request status');
            }
        } catch (err) {
            console.error('Update request error:', err);
            toast.error(err.response?.data?.message || 'Failed to update request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <FiClock className="w-3 h-3" /> Pending
                    </span>
                );
            case 'read':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        <FiEye className="w-3 h-3" /> Read
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
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Seller Requests"
                subtitle="Review and resolve seller status change, approval, and support requests"
                actions={
                    <button
                        onClick={() => { fetchRequests(); fetchStats(); }}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                        title="Refresh"
                    >
                        <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                }
            />

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* ====== STATS CARDS ====== */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Total Requests</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-amber-100 p-4 shadow-xs">
                        <p className="text-xs font-semibold text-amber-700 uppercase">Pending</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pending || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-xs">
                        <p className="text-xs font-semibold text-blue-700 uppercase">Read</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">{stats.read || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs">
                        <p className="text-xs font-semibold text-purple-700 uppercase">In Progress</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">{stats.in_progress || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs col-span-2 md:col-span-1">
                        <p className="text-xs font-semibold text-emerald-700 uppercase">Solved</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.solved || 0}</p>
                    </div>
                </div>

                {/* ====== TABS NAVIGATION ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                        {STATUS_TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const count = tab.id === 'all' ? stats.total : stats[tab.countKey] || 0;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
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

                {/* ====== FILTERS BAR ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white"
                            />
                        </div>

                        <div>
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700"
                            >
                                <option value="all">All Request Types</option>
                                <option value="product_status_change">Product Status Change</option>
                                <option value="product_approval">Product Approval</option>
                                <option value="category_request">Category / Brand Request</option>
                                <option value="inventory_query">Inventory Query</option>
                                <option value="account_support">Account Support</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={sellerFilter}
                                onChange={(e) => {
                                    setSellerFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700"
                            >
                                <option value="all">All Sellers</option>
                                {sellers.map((s) => (
                                    <option key={s._id || s.id} value={s._id || s.id}>
                                        {s.business_name || s.owner_name} ({s.seller_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ====== REQUESTS TABLE ====== */}
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

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-4 py-3.5">Request ID</th>
                                        <th className="px-4 py-3.5">Seller</th>
                                        <th className="px-4 py-3.5">Type & Product</th>
                                        <th className="px-4 py-3.5">Reason & Details</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5">Created</th>
                                        <th className="px-4 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                    {requests.map((req) => {
                                        const seller = req.seller_id;
                                        const product = req.product_id;

                                        return (
                                            <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Request Code */}
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-md">
                                                        {req.request_code}
                                                    </span>
                                                </td>

                                                {/* Seller + View Seller Action */}
                                                <td className="px-4 py-3.5">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{seller?.business_name || 'N/A'}</p>
                                                        <p className="text-xs text-slate-500">{seller?.email || 'N/A'}</p>
                                                        {seller?.seller_code && (
                                                            <button
                                                                onClick={() => navigate(`/admin/sellers/${seller.seller_code}`)}
                                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline mt-1"
                                                                title="Open Seller Profile"
                                                            >
                                                                <span>View Seller</span>
                                                                <FiExternalLink className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Type & Product */}
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-1">
                                                        <span className="inline-block text-[11px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded capitalize">
                                                            {req.request_type?.replace(/_/g, ' ')}
                                                        </span>
                                                        {product ? (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                                                <FiPackage className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                <span
                                                                    className="truncate max-w-[180px] font-medium hover:text-blue-600 cursor-pointer"
                                                                    onClick={() => navigate(`/admin/products/${product.product_code}`)}
                                                                    title={product.product_name}
                                                                >
                                                                    {product.product_name}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 block">General</span>
                                                        )}
                                                        {req.requested_status && req.requested_status !== 'none' && (
                                                            <div className="text-[11px] text-slate-600">
                                                                Target:{' '}
                                                                <strong className="text-blue-700 uppercase font-mono">
                                                                    {req.requested_status}
                                                                </strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Reason & Details */}
                                                <td className="px-4 py-3.5 max-w-xs">
                                                    <p className="font-semibold text-slate-800 line-clamp-1">{req.reason}</p>
                                                    {req.message && (
                                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{req.message}</p>
                                                    )}
                                                    {req.admin_response && (
                                                        <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 line-clamp-1 border border-emerald-100">
                                                            ✓ Solution: {req.admin_response}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {getStatusBadge(req.status)}
                                                </td>

                                                {/* Created Date */}
                                                <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                                                    {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {seller?.seller_code && (
                                                            <button
                                                                onClick={() => navigate(`/admin/sellers/${seller.seller_code}`)}
                                                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                                                                title="View Seller Profile"
                                                            >
                                                                <FiUser className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openManageModal(req)}
                                                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
                                                        >
                                                            Manage
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {requests.length === 0 && !isRefreshing && (
                            <div className="text-center py-16 px-4">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                                    <FiMessageSquare className="w-7 h-7" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">No requests found</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                    {searchQuery || activeTab !== 'all' || typeFilter !== 'all' || sellerFilter !== 'all'
                                        ? 'No requests match your selected filters.'
                                        : 'There are currently no seller requests submitted.'}
                                </p>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {pagination.totalPages > 1 && (
                            <div className="px-4 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
                                <div>
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                    <span className="font-bold text-slate-900">{pagination.total}</span> requests
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40"
                                    >
                                        <FiChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-3 py-1 font-semibold text-slate-800">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40"
                                    >
                                        <FiChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ====== MANAGE / SOLVE REQUEST MODAL ====== */}
            {manageModal.open && manageModal.request && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                    <FiMessageSquare className="w-5 h-5 text-blue-600" />
                                    Manage Seller Request
                                </h3>
                                <p className="text-xs font-mono text-slate-500 mt-0.5">
                                    {manageModal.request.request_code}
                                </p>
                            </div>
                            <button
                                onClick={() => setManageModal({ open: false, request: null, status: '', admin_response: '', update_product_status: true })}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Request Summary Card */}
                        <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700 border border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-500 uppercase tracking-wider">Seller:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{manageModal.request.seller_id?.business_name}</span>
                                    {manageModal.request.seller_id?.seller_code && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/admin/sellers/${manageModal.request.seller_id.seller_code}`)}
                                            className="text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
                                        >
                                            View Profile <FiExternalLink className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {manageModal.request.product_id && (
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                    <span className="font-semibold text-slate-500 uppercase tracking-wider">Product:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900">{manageModal.request.product_id.product_name}</span>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/admin/products/${manageModal.request.product_id.product_code}`)}
                                            className="text-blue-600 hover:underline flex items-center gap-0.5"
                                        >
                                            View <FiExternalLink className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                <span className="font-semibold text-slate-500 uppercase tracking-wider">Reason:</span>
                                <span className="font-bold text-slate-800">{manageModal.request.reason}</span>
                            </div>

                            {manageModal.request.requested_status && manageModal.request.requested_status !== 'none' && (
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                    <span className="font-semibold text-slate-500 uppercase tracking-wider">Requested Status:</span>
                                    <span className="font-bold text-blue-600 uppercase font-mono">{manageModal.request.requested_status}</span>
                                </div>
                            )}

                            {manageModal.request.message && (
                                <div className="pt-2 border-t border-slate-200/60">
                                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Seller Message:</p>
                                    <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-line">
                                        {manageModal.request.message}
                                    </p>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            {/* Workflow Status Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Update Request Status <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={manageModal.status}
                                    onChange={(e) => setManageModal(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-slate-800 font-semibold"
                                >
                                    <option value="read">👀 Read (Under administrative review)</option>
                                    <option value="in_progress">⚙️ In Progress (Investigating / resolving)</option>
                                    <option value="solved">✅ Solved (Action completed with response message)</option>
                                </select>
                            </div>

                            {/* Auto product update checkbox if product status request */}
                            {manageModal.request.product_id && manageModal.request.requested_status && manageModal.request.requested_status !== 'none' && manageModal.status === 'solved' && (
                                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={manageModal.update_product_status}
                                        onChange={(e) => setManageModal(prev => ({ ...prev, update_product_status: e.target.checked }))}
                                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="text-xs text-blue-900 leading-snug">
                                        <p className="font-bold">Automatically update product status to "{manageModal.request.requested_status.toUpperCase()}"</p>
                                        <p className="text-[11px] text-blue-700 mt-0.5">
                                            This will immediately change product "{manageModal.request.product_id.product_name}" status on the marketplace.
                                        </p>
                                    </div>
                                </label>
                            )}

                            {/* Admin Response / Solution Message */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Response / Solution Message {manageModal.status === 'solved' ? <span className="text-rose-500">*</span> : '(Optional)'}
                                </label>
                                <textarea
                                    rows={3}
                                    value={manageModal.admin_response}
                                    onChange={(e) => setManageModal(prev => ({ ...prev, admin_response: e.target.value }))}
                                    placeholder={
                                        manageModal.status === 'solved'
                                            ? "e.g. Your product activation request has been successfully completed. The product is now Active on the marketplace."
                                            : "Add notes or a message for the seller..."
                                    }
                                    required={manageModal.status === 'solved'}
                                    className="w-full p-3 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    This message will be visible to the seller and recorded in the Seller Activity log.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setManageModal({ open: false, request: null, status: '', admin_response: '', update_product_status: true })}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    {submitting ? 'Saving...' : 'Update & Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSellerRequests;
