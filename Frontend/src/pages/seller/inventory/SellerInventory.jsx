import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiBox,
    FiSearch,
    FiRefreshCw,
    FiCheckCircle,
    FiAlertTriangle,
    FiXCircle,
    FiPlus,
    FiMinus,
    FiEdit3,
    FiHome,
    FiPackage,
    FiChevronLeft,
    FiChevronRight,
    FiLoader,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerInventory = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [allProducts, setAllProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;
    const [search, setSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('all');

    // Inline row quick saving state
    const [savingRowId, setSavingRowId] = useState(null);

    // Quick stock edit modal state
    const [editingProduct, setEditingProduct] = useState(null);
    const [tempStock, setTempStock] = useState(0);
    const [savingStock, setSavingStock] = useState(false);

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchInventory();
        return () => {
            mounted.current = false;
        };
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerMyProducts({
                page: 1,
                limit: 200,
            });

            if (!mounted.current) return;

            if (res?.data?.success) {
                const list = res.data.data?.products || (Array.isArray(res.data.data) ? res.data.data : []);
                setAllProducts(list);
            }
        } catch (err) {
            console.error('Inventory fetch error:', err);
            toast.error('Failed to load inventory');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    // Calculate global stats across all products regardless of active filter
    const stats = useMemo(() => {
        const totalSKUs = allProducts.length;
        const inStockCount = allProducts.filter((p) => (p.stock_quantity ?? 0) > 5).length;
        const lowStockCount = allProducts.filter((p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= 5).length;
        const outOfStockCount = allProducts.filter((p) => (p.stock_quantity ?? 0) <= 0).length;
        return { totalSKUs, inStockCount, lowStockCount, outOfStockCount };
    }, [allProducts]);

    // Filter & Search
    const filteredProducts = useMemo(() => {
        return allProducts.filter((p) => {
            const qty = p.stock_quantity ?? 0;
            // Filter by stock
            if (stockFilter === 'low' && (qty <= 0 || qty > 5)) return false;
            if (stockFilter === 'out' && qty > 0) return false;
            if (stockFilter === 'in_stock' && qty <= 5) return false;

            // Search by name, sku, brand
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                const name = (p.product_name || '').toLowerCase();
                const sku = (p.sku || '').toLowerCase();
                const brand = (p.brand || '').toLowerCase();
                if (!name.includes(q) && !sku.includes(q) && !brand.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [allProducts, stockFilter, search]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredProducts.slice(start, start + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    // Reset page when filter or search changes
    const handleFilterChange = (filter) => {
        setStockFilter(filter);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    // Inline quick adjustment (+1 or -1)
    const handleQuickAdjust = async (item, delta) => {
        const pId = item._id || item.id;
        const currentQty = item.stock_quantity ?? 0;
        const newQty = Math.max(0, currentQty + delta);
        if (newQty === currentQty) return;

        // Optimistic UI update
        setAllProducts((prev) =>
            prev.map((p) => ((p._id === pId || p.id === pId) ? { ...p, stock_quantity: newQty } : p))
        );
        setSavingRowId(pId);

        try {
            await ApiService.updateSellerProduct(pId, { stock_quantity: newQty });
            toast.success(`Stock updated: ${item.product_name} (${newQty} units)`);
        } catch (err) {
            console.error('Failed to update stock:', err);
            toast.error(err.response?.data?.message || 'Failed to update stock');
            // Revert on error
            fetchInventory();
        } finally {
            if (mounted.current) setSavingRowId(null);
        }
    };

    // Save stock from Modal
    const handleSaveStock = async () => {
        if (!editingProduct) return;
        const pId = editingProduct._id || editingProduct.id;
        const newQty = Math.max(0, parseInt(tempStock, 10) || 0);

        setSavingStock(true);
        // Optimistic update
        setAllProducts((prev) =>
            prev.map((p) => ((p._id === pId || p.id === pId) ? { ...p, stock_quantity: newQty } : p))
        );

        try {
            await ApiService.updateSellerProduct(pId, { stock_quantity: newQty });
            toast.success(`Stock updated for ${editingProduct.product_name} (${newQty} units)`);
            setEditingProduct(null);
        } catch (err) {
            console.error('Failed to update stock:', err);
            toast.error(err.response?.data?.message || 'Failed to update stock');
            fetchInventory();
        } finally {
            if (mounted.current) setSavingStock(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumb */}
            <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                    <button
                        onClick={() => navigate('/seller/dashboard')}
                        className="p-1 rounded-md hover:bg-sky-50 text-blue-600 transition-colors"
                    >
                        <FiHome className="w-4 h-4" />
                    </button>
                    <span>/</span>
                    <span className="bg-sky-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold text-xs">
                        Inventory
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FiBox className="text-blue-600 w-7 h-7" />
                            <span>Inventory Management</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Monitor stock levels, set low inventory warnings, and adjust quantities in real time. Changes automatically sync to Marketplace and Admin catalog.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchInventory}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* 4 Inventory Metric Cards (Always show true global totals) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => handleFilterChange('all')}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'all'
                            ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                            : 'border-sky-100 hover:border-blue-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total SKUs</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stats.totalSKUs}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FiPackage className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleFilterChange('in_stock')}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'in_stock'
                            ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md'
                            : 'border-sky-100 hover:border-emerald-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Stock (&gt;5)</p>
                            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.inStockCount}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleFilterChange('low')}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'low'
                            ? 'border-amber-500 ring-2 ring-amber-100 shadow-md'
                            : 'border-sky-100 hover:border-amber-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock (≤5)</p>
                            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats.lowStockCount}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FiAlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleFilterChange('out')}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'out'
                            ? 'border-rose-500 ring-2 ring-rose-100 shadow-md'
                            : 'border-sky-100 hover:border-rose-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
                            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{stats.outOfStockCount}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <FiXCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search SKU, brand or product name..."
                        value={search}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <span className="text-xs text-slate-500">Filter Stock:</span>
                    <select
                        value={stockFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    >
                        <option value="all">All Products ({stats.totalSKUs})</option>
                        <option value="in_stock">In Stock ({stats.inStockCount})</option>
                        <option value="low">Low Stock ({stats.lowStockCount})</option>
                        <option value="out">Out of Stock ({stats.outOfStockCount})</option>
                    </select>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Product</th>
                                <th className="py-3.5 px-4">SKU</th>
                                <th className="py-3.5 px-4">Price</th>
                                <th className="py-3.5 px-4">Stock on Hand</th>
                                <th className="py-3.5 px-4">Inventory Status</th>
                                <th className="py-3.5 px-4 text-right">Quick Adjust</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                        <span>Loading inventory...</span>
                                    </td>
                                </tr>
                            ) : paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <FiBox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="font-bold text-slate-700 text-sm">No items in this filter</p>
                                        <p className="text-xs text-slate-400 mt-1">Try switching filters or clearing your search query.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map((item) => {
                                    const pId = item._id || item.id;
                                    const qty = item.stock_quantity ?? 0;
                                    const isOut = qty <= 0;
                                    const isLow = qty > 0 && qty <= 5;
                                    const isRowSaving = savingRowId === pId;
                                    const imageSrc = item.images?.[0] || 'https://placehold.co/80x80?text=Product';

                                    return (
                                        <tr key={pId} className="hover:bg-sky-50/30 transition-colors">
                                            {/* Product Info */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={imageSrc}
                                                        alt={item.product_name}
                                                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                                                        onError={(e) => {
                                                             e.target.src = 'https://placehold.co/80x80?text=Product';
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate max-w-xs">{item.product_name}</p>
                                                        <p className="text-[11px] text-slate-400">{item.brand || 'Zyvento'}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SKU */}
                                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                                                {item.sku || 'N/A'}
                                            </td>

                                            {/* Price */}
                                            <td className="py-3.5 px-4 font-bold text-slate-800">
                                                {formatCurrency(item.price || item.final_price)}
                                            </td>

                                            {/* Stock on Hand with Inline +/- Buttons */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        title="Decrease stock by 1"
                                                        disabled={isRowSaving || qty <= 0}
                                                        onClick={() => handleQuickAdjust(item, -1)}
                                                        className="w-7 h-7 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <FiMinus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span
                                                        className={`min-w-[42px] text-center font-extrabold text-sm ${
                                                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                                                        }`}
                                                    >
                                                        {isRowSaving ? (
                                                            <FiLoader className="w-3.5 h-3.5 animate-spin mx-auto text-blue-600" />
                                                        ) : (
                                                            `${qty}`
                                                        )}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        title="Increase stock by 1"
                                                        disabled={isRowSaving}
                                                        onClick={() => handleQuickAdjust(item, 1)}
                                                        className="w-7 h-7 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <FiPlus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="text-[11px] font-normal text-slate-400">units</span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4">
                                                {isOut ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <FiXCircle className="w-3 h-3" />
                                                        <span>Out of Stock</span>
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <FiAlertTriangle className="w-3 h-3" />
                                                        <span>Low Stock</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <FiCheckCircle className="w-3 h-3" />
                                                        <span>Optimal</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Quick Adjust Modal Button */}
                                            <td className="py-3.5 px-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(item);
                                                        setTempStock(qty);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 text-blue-700 hover:bg-sky-50 font-semibold text-xs transition-colors"
                                                >
                                                    <FiEdit3 className="w-3.5 h-3.5" />
                                                    <span>Update Stock</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Showing {(currentPage - 1) * pageSize + 1} to{' '}
                            {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} items
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 font-semibold text-slate-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stock Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sky-100 text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <FiBox className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-900">Update Stock Quantity</h3>
                                <p className="text-xs text-slate-500 truncate">{editingProduct.product_name}</p>
                            </div>
                        </div>

                        <div className="space-y-4 my-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Stock Quantity (units)
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTempStock((s) => Math.max(0, (parseInt(s, 10) || 0) - 1))}
                                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold active:scale-95 transition"
                                    >
                                        <FiMinus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="number"
                                        min="0"
                                        value={tempStock}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTempStock(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
                                        }}
                                        className="w-full text-center py-2 text-base font-bold rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setTempStock((s) => (parseInt(s, 10) || 0) + 1)}
                                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold active:scale-95 transition"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {[+5, +10, +25, +50].map((delta) => (
                                    <button
                                        key={delta}
                                        type="button"
                                        onClick={() => setTempStock((s) => (parseInt(s, 10) || 0) + delta)}
                                        className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-blue-200 hover:text-blue-700 text-xs font-semibold active:scale-95 transition"
                                    >
                                        +{delta}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                disabled={savingStock}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveStock}
                                disabled={savingStock}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 transition disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {savingStock ? (
                                    <>
                                        <FiLoader className="w-3.5 h-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerInventory;
