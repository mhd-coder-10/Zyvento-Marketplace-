import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiGrid, FiEye,
    FiPackage, FiCheckCircle, FiXCircle, FiLayers, FiRefreshCw,
    FiX, FiUserX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const TABS = [
    { id: 'overview', label: 'Overview', icon: FiLayers },
    { id: 'active', label: 'Active', icon: FiCheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'inactive', label: 'Inactive', icon: FiUserX, color: 'text-gray-600 bg-gray-50' },
    { id: 'all_categories', label: 'All Categories', icon: FiGrid },
];

const Categories = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
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

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            let queryStatus;
            if (activeTab === 'overview' || activeTab === 'all_categories') {
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

            const res = await ApiService.getAllCategories(params);
            if (res.data.success) {
                const data = res.data.data || [];
                setCategories(Array.isArray(data) ? data : []);
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
            console.error('Failed to load categories', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab, search, statusFilter, pagination.page, pagination.limit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const totalProductsCount = useMemo(() => {
        return categories.reduce((acc, cat) => acc + (cat.product_count || 0), 0);
    }, [categories]);

    const getTabCount = (tabId) => {
        switch (tabId) {
            case 'active': return stats.active || 0;
            case 'inactive': return stats.inactive || 0;
            case 'all_categories':
            case 'overview': return stats.total || 0;
            default: return 0;
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.code) return;
        try {
            await ApiService.deleteCategory(deleteConfirm.code);
            toast.success(`Category "${deleteConfirm.name || deleteConfirm.code}" deleted successfully`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        } finally {
            setDeleteConfirm({ open: false, code: null, name: '' });
        }
    };

    if (loading && !isRefreshing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading categories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Category Management"
                subtitle="Organize and monitor root product categories across the marketplace"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchData()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                            title="Refresh categories"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => navigate('/admin/categories/create')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-xs transition"
                        >
                            <FiPlus className="w-4 h-4" /> Add Category
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
                                <FiGrid className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Total Categories</p>
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
                                <p className="text-xs text-slate-500 font-medium">Active Categories</p>
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
                                <p className="text-xs text-slate-500 font-medium">Inactive Categories</p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                placeholder="Search categories by name or code..."
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

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                disabled={activeTab !== 'overview' && activeTab !== 'all_categories'}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-xs sm:text-sm bg-white text-slate-700 disabled:opacity-50 disabled:bg-slate-50 cursor-pointer"
                            >
                                <option value="all">
                                    {activeTab === 'overview' || activeTab === 'all_categories' ? 'All Statuses' : `Status: ${activeTab}`}
                                </option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ====== CATEGORIES TABLE & MOBILE VIEW ====== */}
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
                            <table className="w-full min-w-[950px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-5 py-4 min-w-[260px]">Category</th>
                                        <th className="px-4 py-4 min-w-[140px]">Code</th>
                                        <th className="px-4 py-4 min-w-[120px] text-center">Sub-Categories</th>
                                        <th className="px-4 py-4 min-w-[150px] text-center">Products Included</th>
                                        <th className="px-4 py-4 min-w-[100px] text-center">Orders</th>
                                        <th className="px-4 py-4 min-w-[110px]">Status</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap min-w-[140px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-16 text-center">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
                                                    <FiGrid className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">No categories found</p>
                                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                                    {search || statusFilter !== 'all'
                                                        ? 'No categories match your search or filter criteria.'
                                                        : 'Start by creating your first root product category.'}
                                                </p>
                                                {(search || statusFilter !== 'all') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearch('');
                                                            setStatusFilter('all');
                                                        }}
                                                        className="mt-3 text-xs text-blue-600 font-semibold hover:underline"
                                                    >
                                                        Clear all filters
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((cat) => (
                                            <tr
                                                key={cat._id}
                                                onClick={() => navigate(`/admin/categories/${cat.category_code}`)}
                                                className="transition-colors hover:bg-slate-50/80 cursor-pointer group"
                                            >
                                                {/* Category Info */}
                                                <td className="px-5 py-3.5 min-w-[260px]">
                                                    <div className="flex items-center gap-3">
                                                        {cat.category_image ? (
                                                            <img
                                                                src={cat.category_image}
                                                                alt={cat.category_name}
                                                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                                                                {(cat.category_name?.[0] || 'C').toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 max-w-xs">
                                                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate" title={cat.category_name}>
                                                                {cat.category_name}
                                                            </p>
                                                            <p className="text-xs text-slate-400 truncate mt-0.5" title={cat.description}>
                                                                {cat.description || 'No description provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category Code */}
                                                <td className="px-4 py-3.5 min-w-[140px]">
                                                    <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                                        {cat.category_code}
                                                    </span>
                                                </td>

                                                {/* Sub-Categories */}
                                                <td className="px-4 py-3.5 text-center min-w-[120px]">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-100">
                                                        <FiLayers className="w-3.5 h-3.5" />
                                                        {cat.sub_category_count || 0}
                                                    </span>
                                                </td>

                                                {/* Products Included */}
                                                <td className="px-4 py-3.5 text-center min-w-[150px]">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-100">
                                                        <FiPackage className="w-3.5 h-3.5" />
                                                        {cat.product_count || 0} products
                                                    </span>
                                                </td>

                                                {/* Orders */}
                                                <td className="px-4 py-3.5 text-center min-w-[100px] font-bold text-slate-800">
                                                    {cat.order_count || 0}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 min-w-[110px]">
                                                    {cat.status === 'active' ? (
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
                                                            onClick={() => navigate(`/admin/categories/${cat.category_code}`)}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-all shadow-2xs"
                                                            title="View Details"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/admin/categories/${cat.category_code}/edit`)}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 transition-all shadow-2xs"
                                                            title="Edit Category"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm({ open: true, code: cat.category_code, name: cat.category_name })}
                                                            className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 transition-all shadow-2xs"
                                                            title="Delete Category"
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
                            {categories.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-xs">
                                    No categories found.
                                </div>
                            ) : (
                                categories.map((cat) => (
                                    <div
                                        key={cat._id}
                                        onClick={() => navigate(`/admin/categories/${cat.category_code}`)}
                                        className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white shadow-xs cursor-pointer hover:border-blue-200 transition"
                                    >
                                        <div className="flex items-start gap-3">
                                            {cat.category_image ? (
                                                <img src={cat.category_image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                    {(cat.category_name?.[0] || 'C').toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">{cat.category_name}</h4>
                                                    {cat.status === 'active' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-mono text-xs text-slate-500">{cat.category_code}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs border-t border-b border-slate-100 py-2.5 text-center">
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Sub-Cats</span>
                                                <span className="font-bold text-blue-600">{cat.sub_category_count || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Products</span>
                                                <span className="font-bold text-purple-600">{cat.product_count || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Orders</span>
                                                <span className="font-bold text-slate-900">{cat.order_count || 0}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => navigate(`/admin/categories/${cat.category_code}`)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                                            >
                                                <FiEye className="w-3.5 h-3.5 text-blue-600" /> View
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/categories/${cat.category_code}/edit`)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                                            >
                                                <FiEdit2 className="w-3.5 h-3.5 text-slate-600" /> Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ open: true, code: cat.category_code, name: cat.category_name })}
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
                                    of <span className="font-semibold text-slate-700">{pagination.total}</span> categories
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
                title="Delete Category"
                message={`Are you sure you want to delete category "${deleteConfirm.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={handleDelete}
                onClose={() => setDeleteConfirm({ open: false, code: null, name: '' })}
            />
        </div>
    );
};

export default Categories;