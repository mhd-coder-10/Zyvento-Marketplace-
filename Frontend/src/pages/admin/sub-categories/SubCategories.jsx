import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiLayers, FiEye,
    FiPackage, FiCheckCircle, FiXCircle, FiRefreshCw, FiGrid,
    FiX, FiUserX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const TABS = [
    { id: 'overview', label: 'Overview', icon: FiLayers },
    { id: 'active', label: 'Active', icon: FiCheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'inactive', label: 'Inactive', icon: FiUserX, color: 'text-gray-600 bg-gray-50' },
    { id: 'all_subcategories', label: 'All Sub-Categories', icon: FiGrid },
];

const SubCategories = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, code: null, name: '' });

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

    // Load parent categories for filter dropdown
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await ApiService.getAllCategories({ limit: 100 });
                if (res.data.success) {
                    setCategories(res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load parent categories for filter', err);
            }
        };
        loadCategories();
    }, []);

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            let queryStatus;
            if (activeTab === 'overview' || activeTab === 'all_subcategories') {
                queryStatus = statusFilter !== 'all' ? statusFilter : undefined;
            } else {
                queryStatus = activeTab;
            }

            const params = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (search.trim()) params.search = search.trim();
            if (queryStatus) params.status = queryStatus;
            if (categoryFilter !== 'all') params.categoryId = categoryFilter;

            const res = await ApiService.getAllSubCategories(params);
            if (res.data.success) {
                const data = res.data.data || [];
                setSubCategories(Array.isArray(data) ? data : []);
                setStats(res.data.stats || { total: 0, active: 0, inactive: 0 });
                const pag = res.data.pagination || {
                    total: res.data.total || data.length,
                    totalPages: res.data.totalPages || 1
                };
                setPagination(prev => ({
                    ...prev,
                    total: pag.total || data.length,
                    totalPages: pag.totalPages || 1
                }));
            }
        } catch (error) {
            console.error('Failed to load sub-categories', error);
            toast.error('Failed to load sub-categories');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab, search, statusFilter, categoryFilter, pagination.page, pagination.limit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const totalProductsCount = useMemo(() => {
        return subCategories.reduce((acc, sub) => acc + (sub.product_count || 0), 0);
    }, [subCategories]);

    const getTabCount = (tabId) => {
        switch (tabId) {
            case 'active': return stats.active || 0;
            case 'inactive': return stats.inactive || 0;
            case 'all_subcategories':
            case 'overview': return stats.total || 0;
            default: return 0;
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.code) return;
        try {
            await ApiService.deleteSubCategory(deleteConfirm.code);
            toast.success(`Sub-Category "${deleteConfirm.name || deleteConfirm.code}" deleted successfully`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete sub-category');
        } finally {
            setDeleteConfirm({ open: false, code: null, name: '' });
        }
    };

    if (loading && !isRefreshing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading sub-categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Sub-Category Management"
                subtitle="Organize secondary product classifications under root categories"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchData()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                            title="Refresh sub-categories"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => navigate('/admin/sub-categories/create')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition"
                        >
                            <FiPlus className="w-4 h-4" /> Add Sub-Category
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

                {/* ====== 4 STAT CARDS ====== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <FiLayers className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Total Sub-Categories</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                <FiCheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.active || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Active Sub-Categories</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.inactive || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Inactive Sub-Categories</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition hover:shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                <FiPackage className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{totalProductsCount}</p>
                                <p className="text-xs text-slate-500 font-medium">Linked Products</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== SEARCH & FILTERS BAR ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                placeholder="Search sub-categories by name or code..."
                                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Parent Category Filter */}
                        <div>
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700 cursor-pointer"
                            >
                                <option value="all">All Parent Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                disabled={activeTab !== 'overview' && activeTab !== 'all_subcategories'}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700 disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                            >
                                <option value="all">
                                    {activeTab === 'overview' || activeTab === 'all_subcategories' ? 'All Statuses' : `Status: ${activeTab}`}
                                </option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ====== SUB-CATEGORIES TABLE & MOBILE VIEW ====== */}
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
                            <table className="w-full min-w-[1000px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-5 py-4 min-w-[240px]">Sub-Category</th>
                                        <th className="px-4 py-4 min-w-[140px]">Code</th>
                                        <th className="px-4 py-4 min-w-[160px]">Parent Category</th>
                                        <th className="px-4 py-4 min-w-[140px] text-center">Products Included</th>
                                        <th className="px-4 py-4 min-w-[100px] text-center">Orders</th>
                                        <th className="px-4 py-4 min-w-[100px] text-center">Priority</th>
                                        <th className="px-4 py-4 min-w-[110px]">Status</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                    {subCategories.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-16 text-center">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                                                    <FiLayers className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">No sub-categories found</p>
                                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                                    {search || statusFilter !== 'all' || categoryFilter !== 'all'
                                                        ? 'No sub-categories match your search or filter criteria.'
                                                        : 'Start by creating your first sub-category.'}
                                                </p>
                                                {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearch('');
                                                            setStatusFilter('all');
                                                            setCategoryFilter('all');
                                                        }}
                                                        className="mt-3 text-xs text-blue-600 font-semibold hover:underline"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        subCategories.map((sub) => (
                                            <tr
                                                key={sub._id}
                                                onClick={() => navigate(`/admin/sub-categories/${sub.sub_category_code}`)}
                                                className="transition-colors hover:bg-slate-50/80 cursor-pointer group"
                                            >
                                                {/* Sub-Category Info */}
                                                <td className="px-5 py-3.5 min-w-[240px]">
                                                    <div className="flex items-center gap-3">
                                                        {sub.sub_category_image ? (
                                                            <img
                                                                src={sub.sub_category_image}
                                                                alt={sub.sub_category_name}
                                                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                                                {(sub.sub_category_name?.[0] || 'S').toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 max-w-xs">
                                                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate" title={sub.sub_category_name}>
                                                                {sub.sub_category_name}
                                                            </p>
                                                            <p className="text-xs text-slate-400 truncate mt-0.5" title={sub.description}>
                                                                {sub.description || 'No description provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Code */}
                                                <td className="px-4 py-3.5 min-w-[140px]">
                                                    <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                                        {sub.sub_category_code}
                                                    </span>
                                                </td>

                                                {/* Parent Category */}
                                                <td className="px-4 py-3.5 min-w-[160px]">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100">
                                                        <FiGrid className="w-3.5 h-3.5" />
                                                        {sub.category_id?.category_name || 'N/A'}
                                                    </span>
                                                </td>

                                                {/* Products Included */}
                                                <td className="px-4 py-3.5 text-center min-w-[140px]">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-100">
                                                        <FiPackage className="w-3.5 h-3.5" />
                                                        {sub.product_count || 0} products
                                                    </span>
                                                </td>

                                                {/* Orders */}
                                                <td className="px-4 py-3.5 text-center min-w-[100px] font-bold text-slate-800">
                                                    {sub.order_count || 0}
                                                </td>

                                                {/* Priority */}
                                                <td className="px-4 py-3.5 text-center min-w-[100px] font-mono text-xs text-slate-600">
                                                    {sub.display_order ?? 0}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 min-w-[110px]">
                                                    {sub.status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-3.5 text-right whitespace-nowrap min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => navigate(`/admin/sub-categories/${sub.sub_category_code}`)}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-all shadow-2xs"
                                                            title="View Details"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/sub-categories/${sub.sub_category_code}/edit`)}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 transition-all shadow-2xs"
                                                            title="Edit Sub-Category"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm({ open: true, code: sub.sub_category_code, name: sub.sub_category_name })}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 transition-all shadow-2xs"
                                                            title="Delete Sub-Category"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile & Tablet Card View */}
                        <div className="lg:hidden divide-y divide-slate-100 p-4 space-y-4">
                            {subCategories.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-xs">
                                    No sub-categories found.
                                </div>
                            ) : (
                                subCategories.map((sub) => (
                                    <div
                                        key={sub._id}
                                        onClick={() => navigate(`/admin/sub-categories/${sub.sub_category_code}`)}
                                        className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white shadow-xs cursor-pointer hover:border-blue-200 transition"
                                    >
                                        <div className="flex items-start gap-3">
                                            {sub.sub_category_image ? (
                                                <img src={sub.sub_category_image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                    {(sub.sub_category_name?.[0] || 'S').toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">{sub.sub_category_name}</h4>
                                                    {sub.status === 'active' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs">
                                                    <span className="font-mono text-[11px] text-slate-500">{sub.sub_category_code}</span>
                                                    <span className="text-slate-400">•</span>
                                                    <span className="text-blue-600 font-medium truncate">{sub.category_id?.category_name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-100 py-2.5 text-center">
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Products Included</span>
                                                <span className="font-bold text-purple-600">{sub.product_count || 0} products</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Total Orders</span>
                                                <span className="font-bold text-slate-900">{sub.order_count || 0} orders</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => navigate(`/admin/sub-categories/${sub.sub_category_code}`)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                                            >
                                                <FiEye className="w-3.5 h-3.5 text-blue-600" /> View
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/sub-categories/${sub.sub_category_code}/edit`)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                                            >
                                                <FiEdit2 className="w-3.5 h-3.5 text-slate-600" /> Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ open: true, code: sub.sub_category_code, name: sub.sub_category_name })}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5 text-rose-600" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* ====== PAGINATION ====== */}
                        {pagination.totalPages > 1 && (
                            <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                                <div>
                                    Showing <span className="font-semibold text-slate-700">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                                    <span className="font-semibold text-slate-700">
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                                    </span>{' '}
                                    of <span className="font-semibold text-slate-700">{pagination.total}</span> sub-categories
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                        disabled={pagination.page <= 1}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-2xs"
                                    >
                                        <FiChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-3 py-1 font-semibold text-slate-700">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.totalPages) }))}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-2xs"
                                    >
                                        <FiChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                title="Delete Sub-Category"
                message={`Are you sure you want to delete sub-category "${deleteConfirm.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={handleDelete}
                onClose={() => setDeleteConfirm({ open: false, code: null, name: '' })}
            />
        </div>
    );
};

export default SubCategories;