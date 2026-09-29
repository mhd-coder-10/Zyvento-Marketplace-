import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch, FiPackage, FiAlertTriangle, FiXCircle, FiCheckCircle,
    FiRefreshCw, FiChevronLeft, FiChevronRight, FiX, FiLayers, FiCalendar,
    FiDownload, FiEye, FiClock, FiFilter
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const INVENTORY_TABS = [
    { id: 'all', label: 'All Inventory', icon: FiLayers },
    { id: 'available', label: 'In Stock', icon: FiCheckCircle, color: 'text-emerald-600' },
    { id: 'low_stock', label: 'Low Stock', icon: FiAlertTriangle, color: 'text-amber-600' },
    { id: 'out_of_stock', label: 'Out of Stock', icon: FiXCircle, color: 'text-rose-600' },
];

const Inventory = () => {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState({
        total_products: 0,
        total_stock_units: 0,
        low_stock_items: 0,
        out_of_stock: 0
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const res = await ApiService.getAllInventory({
                search: search.trim() || undefined,
                stockStatus: stockFilter !== 'all' ? stockFilter : undefined,
                page,
                limit
            });
            if (res.data.success) {
                setInventory(res.data.data || []);
                setStats(res.data.stats || {
                    total_products: 0,
                    total_stock_units: 0,
                    low_stock_items: 0,
                    out_of_stock: 0
                });
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            }
        } catch {
            toast.error('Failed to load inventory data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, stockFilter, page, limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleTabChange = (tabId) => {
        setStockFilter(tabId);
        setPage(1);
    };

    const handleClearSearch = () => {
        setSearch('');
        setPage(1);
    };

    const handleClearAllFilters = () => {
        setSearch('');
        setStockFilter('all');
        setPage(1);
    };

    const handleExportCSV = () => {
        if (!inventory.length) {
            toast.info('No inventory data to export');
            return;
        }

        const headers = ['Product Name', 'SKU', 'Seller', 'Category', 'Price (INR)', 'Stock Quantity', 'Stock Status', 'Last Updated'];
        const rows = inventory.map(item => [
            `"${(item.product_name || '').replace(/"/g, '""')}"`,
            `"${item.product_sku || 'N/A'}"`,
            `"${(item.seller_name || '').replace(/"/g, '""')}"`,
            `"${item.category || 'N/A'}"`,
            item.price || 0,
            item.stock_quantity ?? 0,
            item.stock_status || 'N/A',
            item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-IN') : 'N/A'
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Inventory exported successfully');
    };

    const getStatusBadge = (status, stockQuantity, lowStockLimit) => {
        const qty = Number(stockQuantity ?? 0);
        const limitVal = Number(lowStockLimit ?? 5);

        if (status === 'out_of_stock' || qty === 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                    <FiXCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Out of Stock</span>
                </span>
            );
        }
        if (status === 'low_stock' || qty <= limitVal) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                    <FiAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Low Stock</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                <FiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>In Stock</span>
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const totalCount = pagination.total || stats.total_products || 0;
    const totalPages = pagination.totalPages || Math.ceil(totalCount / limit) || 1;
    const inStockCount = Math.max(0, (stats.total_products || 0) - (stats.low_stock_items || 0) - (stats.out_of_stock || 0));

    const getTabBadgeCount = (tabId) => {
        switch (tabId) {
            case 'available':
                return inStockCount;
            case 'low_stock':
                return stats.low_stock_items ?? 0;
            case 'out_of_stock':
                return stats.out_of_stock ?? 0;
            case 'all':
            default:
                return stats.total_products ?? 0;
        }
    };

    const isFilterActive = search.trim() !== '' || stockFilter !== 'all';

    return (
        <div className="w-full space-y-6">
            {/* Topbar matching Products & Reviews modules */}
            <AdminTopbar
                title="Inventory Management"
                subtitle="Real-time product stock, category tracking, and seller inventory visibility"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs text-xs sm:text-sm active:scale-95"
                            title="Export inventory to CSV"
                        >
                            <FiDownload className="w-4 h-4 text-blue-600" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button
                            onClick={() => fetchData(true)}
                            disabled={loading || refreshing}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs text-xs sm:text-sm active:scale-95 disabled:opacity-50"
                            title="Refresh inventory data"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                }
            />

            {/* 4 Interactive Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Total Products */}
                <div
                    onClick={() => handleTabChange('all')}
                    className={`bg-white rounded-2xl border p-4.5 sm:p-5 flex items-center gap-4 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                        stockFilter === 'all'
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200">
                        <FiPackage className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                            {stats.total_products ?? 0}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">Total Products</p>
                    </div>
                </div>

                {/* Total Stock Units */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4.5 sm:p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-sky-200">
                        <FiLayers className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-2xl sm:text-3xl font-black text-sky-600 tracking-tight leading-none">
                            {Number(stats.total_stock_units ?? 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">Total Stock Units</p>
                    </div>
                </div>

                {/* Low Stock Items */}
                <div
                    onClick={() => handleTabChange('low_stock')}
                    className={`bg-white rounded-2xl border p-4.5 sm:p-5 flex items-center gap-4 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                        stockFilter === 'low_stock'
                            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-200">
                        <FiAlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight leading-none">
                            {stats.low_stock_items ?? 0}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">Low Stock Alert</p>
                    </div>
                </div>

                {/* Out of Stock */}
                <div
                    onClick={() => handleTabChange('out_of_stock')}
                    className={`bg-white rounded-2xl border p-4.5 sm:p-5 flex items-center gap-4 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                        stockFilter === 'out_of_stock'
                            ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                            : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                    }`}
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-rose-200">
                        <FiXCircle className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight leading-none">
                            {stats.out_of_stock ?? 0}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate">Out of Stock</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation Bar (matching Products & Reviews) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                    {INVENTORY_TABS.map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = stockFilter === tab.id;
                        const count = getTabBadgeCount(tab.id);

                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                                <TabIcon className="w-4 h-4 shrink-0" />
                                <span>{tab.label}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Search, Filter & Quick Options Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search by Product Name or SKU code..."
                            className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                        />
                        {search && (
                            <button
                                onClick={handleClearSearch}
                                title="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Stock Status Dropdown */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={stockFilter}
                            onChange={(e) => handleTabChange(e.target.value)}
                            className="w-full sm:w-48 px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="available">In Stock</option>
                            <option value="low_stock">Low Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>
                    </div>

                    {/* Per Page Dropdown */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="w-full sm:w-32 px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                            title="Rows per page"
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>
                    </div>
                </div>

                {/* Active Filters Pill Bar */}
                {isFilterActive && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">Active filters:</span>
                        {search && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium">
                                <span>Search: "{search}"</span>
                                <button onClick={handleClearSearch} className="hover:text-blue-900">
                                    <FiX className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {stockFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
                                <span>Status: {INVENTORY_TABS.find(t => t.id === stockFilter)?.label || stockFilter}</span>
                                <button onClick={() => setStockFilter('all')} className="hover:text-indigo-900">
                                    <FiX className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={handleClearAllFilters}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 ml-1 transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Desktop Table View Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
                {/* Refresh Overlay Indicator */}
                {refreshing && (
                    <div className="absolute top-0 left-0 right-0 bg-blue-500/10 backdrop-blur-[1px] z-10 flex justify-center py-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-white px-3 py-1 rounded-full shadow-sm">
                            <FiRefreshCw className="animate-spin w-3.5 h-3.5 text-blue-600" />
                            Updating inventory...
                        </div>
                    </div>
                )}

                {/* Full Width Table for Desktop & Wide screens */}
                <div className="hidden lg:block overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                <th className="px-5 py-4 min-w-[280px]">Product</th>
                                <th className="px-4 py-4 min-w-[170px]">Seller</th>
                                <th className="px-4 py-4 min-w-[140px]">Category</th>
                                <th className="px-4 py-4 min-w-[110px]">Price</th>
                                <th className="px-4 py-4 min-w-[120px] text-center">Stock Level</th>
                                <th className="px-4 py-4 min-w-[140px]">Inventory Status</th>
                                <th className="px-4 py-4 min-w-[130px]">Last Updated</th>
                                <th className="px-5 py-4 text-right min-w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-20 text-center text-slate-400">
                                        <FiRefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-3" />
                                        <p className="font-bold text-slate-700 text-sm">Loading inventory data...</p>
                                        <p className="text-xs text-slate-400 mt-1">Fetching latest stock status from backend</p>
                                    </td>
                                </tr>
                            ) : inventory.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-20 text-center text-slate-400">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                                            <FiPackage className="w-7 h-7" />
                                        </div>
                                        <p className="font-bold text-slate-800 text-base">No inventory records found</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            {isFilterActive
                                                ? 'No items matched your search query or selected stock status filter.'
                                                : 'No inventory items are currently recorded in the system.'}
                                        </p>
                                        {isFilterActive && (
                                            <button
                                                onClick={handleClearAllFilters}
                                                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
                                            >
                                                Reset All Filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                inventory.map((item) => {
                                    const qty = Number(item.stock_quantity ?? 0);
                                    const limitVal = Number(item.low_stock_limit ?? 5);
                                    const isOut = item.stock_status === 'out_of_stock' || qty === 0;
                                    const isLow = !isOut && (item.stock_status === 'low_stock' || qty <= limitVal);

                                    return (
                                        <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Product Info */}
                                            <td className="px-5 py-4 min-w-[280px]">
                                                <div className="flex items-center gap-3.5">
                                                    {item.product_image ? (
                                                        <img
                                                            src={item.product_image}
                                                            alt={item.product_name}
                                                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0 shadow-xs"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://placehold.co/80x80?text=Product';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 shrink-0 shadow-xs">
                                                            <FiPackage className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 max-w-xs">
                                                        <p
                                                            className="font-bold text-slate-900 truncate hover:text-blue-600 cursor-pointer transition-colors"
                                                            title={item.product_name}
                                                            onClick={() => {
                                                                const codeOrId = item.product_code || item.product_id;
                                                                if (codeOrId) navigate(`/admin/products/${codeOrId}`);
                                                            }}
                                                        >
                                                            {item.product_name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                                                SKU: {item.product_sku || 'N/A'}
                                                            </span>
                                                            {item.product_code && (
                                                                <span className="font-mono text-[11px] text-slate-500">
                                                                    #{item.product_code}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Seller */}
                                            <td className="px-4 py-4 min-w-[170px]">
                                                {item.seller_name === 'Admin' ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        Zyvento Official
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-xs sm:text-sm">
                                                            {item.seller_name}
                                                        </p>
                                                        {item.seller_code && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/admin/sellers/${item.seller_code}`)}
                                                                className="text-[11px] text-blue-600 hover:underline hover:text-blue-700 font-mono mt-0.5 inline-block font-semibold"
                                                            >
                                                                {item.seller_code}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Category Column */}
                                            <td className="px-4 py-4 min-w-[140px]">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                                    {item.category && item.category !== 'N/A' ? item.category : 'General'}
                                                </span>
                                            </td>

                                            {/* Price Column */}
                                            <td className="px-4 py-4 min-w-[110px]">
                                                <span className="font-black text-slate-900 text-sm">
                                                    ₹{Number(item.price || 0).toLocaleString('en-IN')}
                                                </span>
                                            </td>

                                            {/* Stock Level Column */}
                                            <td className="px-4 py-4 text-center min-w-[120px]">
                                                <div className="inline-flex flex-col items-center justify-center">
                                                    <span
                                                        className={`inline-flex items-center justify-center min-w-[48px] px-3 py-1 rounded-full text-xs font-extrabold border ${
                                                            isOut
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : isLow
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        }`}
                                                    >
                                                        {qty.toLocaleString('en-IN')} units
                                                    </span>
                                                    {isLow && (
                                                        <span className="text-[10px] font-semibold text-amber-600 mt-1">
                                                            Threshold: ≤ {limitVal}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Inventory Status Column */}
                                            <td className="px-4 py-4 min-w-[140px]">
                                                {getStatusBadge(item.stock_status, item.stock_quantity, item.low_stock_limit)}
                                            </td>

                                            {/* Last Updated Column */}
                                            <td className="px-4 py-4 text-slate-500 whitespace-nowrap text-xs min-w-[130px]">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                                                    <FiClock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{formatDate(item.updated_at)}</span>
                                                </div>
                                            </td>

                                            {/* Actions Column */}
                                            <td className="px-5 py-4 text-right min-w-[100px] whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        const codeOrId = item.product_code || item.product_id;
                                                        if (codeOrId) {
                                                            navigate(`/admin/products/${codeOrId}`);
                                                        } else {
                                                            navigate(`/admin/products?search=${encodeURIComponent(item.product_name)}`);
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold text-xs shadow-xs"
                                                    title="View product details"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                    <span>View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile / Tablet Cards View (< lg screens) */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">
                            <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                            <p className="text-sm font-semibold text-slate-600">Loading inventory data...</p>
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                <FiPackage className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-slate-800 text-sm">No inventory items found</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {isFilterActive
                                    ? 'Try changing your search or filter.'
                                    : 'No inventory items recorded.'}
                            </p>
                        </div>
                    ) : (
                        inventory.map((item) => {
                            const qty = Number(item.stock_quantity ?? 0);
                            const limitVal = Number(item.low_stock_limit ?? 5);
                            const isOut = item.stock_status === 'out_of_stock' || qty === 0;
                            const isLow = !isOut && (item.stock_status === 'low_stock' || qty <= limitVal);

                            return (
                                <div key={item._id} className="p-4 sm:p-5 space-y-3.5 hover:bg-slate-50/50 transition-colors">
                                    {/* Top Row: Thumbnail + Product Name + SKU */}
                                    <div className="flex items-start gap-3.5">
                                        {item.product_image ? (
                                            <img
                                                src={item.product_image}
                                                alt={item.product_name}
                                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/80x80?text=Product';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                                                <FiPackage className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                                                {item.product_name}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    SKU: {item.product_sku || 'N/A'}
                                                </span>
                                                {item.category && item.category !== 'N/A' && (
                                                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle Details Grid */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                        <div>
                                            <span className="text-slate-400 block text-[11px]">Seller</span>
                                            <span className="font-semibold text-slate-800 truncate block">
                                                {item.seller_name}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[11px]">Price</span>
                                            <span className="font-extrabold text-slate-900 block">
                                                ₹{Number(item.price || 0).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stock Level, Status Badge & View Button */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(item.stock_status, item.stock_quantity, item.low_stock_limit)}
                                            <span
                                                className={`text-xs font-bold ${
                                                    isOut
                                                        ? 'text-rose-600'
                                                        : isLow
                                                        ? 'text-amber-600'
                                                        : 'text-slate-700'
                                                }`}
                                            >
                                                ({qty} units)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const codeOrId = item.product_code || item.product_id;
                                                if (codeOrId) {
                                                    navigate(`/admin/products/${codeOrId}`);
                                                } else {
                                                    navigate(`/admin/products?search=${encodeURIComponent(item.product_name)}`);
                                                }
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                                        >
                                            <FiEye className="w-3.5 h-3.5 text-blue-600" />
                                            <span>View</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination Footer matching Products & Reviews */}
                {!loading && inventory.length > 0 && (
                    <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                        <div>
                            Showing <span className="font-bold text-slate-800">{((page - 1) * limit) + 1}</span> to{' '}
                            <span className="font-bold text-slate-800">{Math.min(page * limit, totalCount)}</span> of{' '}
                            <span className="font-bold text-slate-800">{totalCount}</span> items
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                    disabled={page <= 1}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                                    title="Previous Page"
                                >
                                    <FiChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-1 px-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                        .map((p, idx, arr) => (
                                            <React.Fragment key={p}>
                                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                    <span className="text-slate-400 px-1">...</span>
                                                )}
                                                <button
                                                    onClick={() => setPage(p)}
                                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all shadow-xs ${
                                                        p === page
                                                            ? 'bg-blue-600 text-white shadow-blue-200'
                                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                </div>

                                <button
                                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={page >= totalPages}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                                    title="Next Page"
                                >
                                    <FiChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;