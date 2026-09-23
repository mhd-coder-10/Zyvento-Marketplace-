import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerInventory = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('all');

    // Quick stock edit state
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
    }, [pagination.page, stockFilter]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerMyProducts({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
            });

            if (!mounted.current) return;

            if (res?.data?.success) {
                let list = res.data.data?.products || (Array.isArray(res.data.data) ? res.data.data : []);

                // Filter by stock status if requested
                if (stockFilter === 'low') {
                    list = list.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5);
                } else if (stockFilter === 'out') {
                    list = list.filter((p) => (p.stock_quantity || 0) <= 0);
                } else if (stockFilter === 'in_stock') {
                    list = list.filter((p) => (p.stock_quantity || 0) > 5);
                }

                setProducts(list);
                const pag = res.data.pagination || res.data.data?.pagination;
                if (pag) {
                    setPagination((p) => ({
                        ...p,
                        total: pag.total || list.length,
                        totalPages: pag.totalPages || Math.ceil((pag.total || list.length) / p.limit) || 1,
                    }));
                }
            }
        } catch (err) {
            console.error('Inventory fetch error:', err);
            toast.error('Failed to load inventory');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((p) => ({ ...p, page: 1 }));
        fetchInventory();
    };

    const handleSaveStock = async () => {
        if (!editingProduct) return;
        setSavingStock(true);
        try {
            const pId = editingProduct._id || editingProduct.id;
            const newQty = Math.max(0, parseInt(tempStock, 10) || 0);

            // Call backend update
            await ApiService.updateSellerProduct(pId, { stock_quantity: newQty });

            toast.success(`Stock updated for ${editingProduct.product_name}`);
            setEditingProduct(null);
            fetchInventory();
        } catch (err) {
            console.error('Failed to update stock:', err);
            toast.error(err.response?.data?.message || 'Failed to update stock');
        } finally {
            setSavingStock(false);
        }
    };

    // Calculate quick counts
    const inStockCount = products.filter((p) => (p.stock_quantity || 0) > 5).length;
    const lowStockCount = products.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length;
    const outOfStockCount = products.filter((p) => (p.stock_quantity || 0) <= 0).length;

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
                            Monitor stock levels, set low inventory warnings, and adjust quantities in real time.
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

            {/* 4 Inventory Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => {
                        setStockFilter('all');
                        setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'all'
                            ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
                            : 'border-sky-100 hover:border-blue-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total SKUs</p>
                            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{pagination.total}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FiPackage className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setStockFilter('in_stock');
                        setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'in_stock'
                            ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md'
                            : 'border-sky-100 hover:border-emerald-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Stock</p>
                            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{inStockCount}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setStockFilter('low');
                        setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'low'
                            ? 'border-amber-500 ring-2 ring-amber-100 shadow-md'
                            : 'border-sky-100 hover:border-amber-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock (≤5)</p>
                            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{lowStockCount}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FiAlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => {
                        setStockFilter('out');
                        setPagination((p) => ({ ...p, page: 1 }));
                    }}
                    className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                        stockFilter === 'out'
                            ? 'border-rose-500 ring-2 ring-rose-100 shadow-md'
                            : 'border-sky-100 hover:border-rose-200 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
                            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{outOfStockCount}</h3>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <FiXCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search SKU or product name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    />
                </form>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Filter Stock:</span>
                    <select
                        value={stockFilter}
                        onChange={(e) => {
                            setStockFilter(e.target.value);
                            setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    >
                        <option value="all">All Products</option>
                        <option value="in_stock">In Stock (&gt; 5)</option>
                        <option value="low">Low Stock (≤ 5)</option>
                        <option value="out">Out of Stock (0)</option>
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
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <FiBox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="font-bold text-slate-700 text-sm">No items in this filter</p>
                                    </td>
                                </tr>
                            ) : (
                                products.map((item) => {
                                    const pId = item._id || item.id;
                                    const qty = item.stock_quantity ?? 0;
                                    const isOut = qty <= 0;
                                    const isLow = qty > 0 && qty <= 5;
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

                                            {/* Stock on Hand */}
                                            <td className="py-3.5 px-4 font-bold text-sm">
                                                <span
                                                    className={`${
                                                        isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                                                    }`}
                                                >
                                                    {qty} units
                                                </span>
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

                                            {/* Quick Adjust Button */}
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
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page <= 1}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPagination((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                                disabled={pagination.page >= pagination.totalPages}
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
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Update Stock Quantity</h3>
                                <p className="text-xs text-slate-500 truncate max-w-xs">{editingProduct.product_name}</p>
                            </div>
                        </div>

                        <div className="space-y-4 my-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Current Stock Quantity
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTempStock(Math.max(0, parseInt(tempStock || 0, 10) - 1))}
                                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
                                    >
                                        <FiMinus className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="number"
                                        min="0"
                                        value={tempStock}
                                        onChange={(e) => setTempStock(e.target.value)}
                                        className="w-full text-center py-2 text-sm font-bold rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setTempStock(parseInt(tempStock || 0, 10) + 1)}
                                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
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
                                        onClick={() => setTempStock(parseInt(tempStock || 0, 10) + delta)}
                                        className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:text-blue-700 text-xs font-semibold transition"
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
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 transition disabled:opacity-50"
                            >
                                {savingStock ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerInventory;
