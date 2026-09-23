import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiPackage,
    FiRefreshCw,
    FiExternalLink,
    FiChevronLeft,
    FiChevronRight,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiHome,
    FiAlertTriangle,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const STATUS_BADGES = {
    active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FiCheckCircle },
    inactive: { label: 'Inactive', bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: FiXCircle },
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiClock },
    draft: { label: 'Draft', bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: FiClock },
};

const SellerProducts = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState([]);

    // Delete Modal State
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        fetchCategories();
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [pagination.page, statusFilter, categoryFilter]);

    const fetchCategories = async () => {
        try {
            const res = await ApiService.getPublicCategories({ status: 'active' });
            if (res?.data?.data) {
                setCategories(Array.isArray(res.data.data) ? res.data.data : res.data.data.categories || []);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerMyProducts({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                status: statusFilter || undefined,
                category: categoryFilter || undefined,
            });

            if (!mounted.current) return;

            if (res?.data?.success) {
                const list = res.data.data?.products || (Array.isArray(res.data.data) ? res.data.data : []);
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
            console.error('Products fetch error:', err);
            toast.error('Failed to load products');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((p) => ({ ...p, page: 1 }));
        fetchProducts();
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setDeleting(true);
        try {
            const prodId = productToDelete._id || productToDelete.id;
            await ApiService.deleteSellerProduct(prodId);
            toast.success('Product deleted successfully');
            setProductToDelete(null);
            fetchProducts();
        } catch (err) {
            console.error('Failed to delete product:', err);
            toast.error(err.response?.data?.message || 'Failed to delete product');
        } finally {
            setDeleting(false);
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
                        My Products
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FiPackage className="text-blue-600 w-7 h-7" />
                            <span>My Products</span>
                            {pagination.total > 0 && (
                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
                                    {pagination.total} items
                                </span>
                            )}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Manage your product catalog, pricing, and store visibility.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={fetchProducts}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/seller/products/create')}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all active:scale-95"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Add Product</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search product name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    />
                </form>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name || cat.category_name}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPagination((p) => ({ ...p, page: 1 }));
                        }}
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3.5 px-4">Product</th>
                                <th className="py-3.5 px-4">SKU</th>
                                <th className="py-3.5 px-4">Price</th>
                                <th className="py-3.5 px-4">Stock</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                        <span>Loading products...</span>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <FiPackage className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                        <p className="font-bold text-slate-700 text-sm">No products found</p>
                                        <p className="text-xs text-slate-400 mt-1">Get started by creating your first product listing.</p>
                                        <button
                                            onClick={() => navigate('/seller/products/create')}
                                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 transition"
                                        >
                                            <FiPlus className="w-4 h-4" />
                                            <span>Add New Product</span>
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                products.map((item) => {
                                    const pId = item._id || item.id;
                                    const statusKey = item.status?.toLowerCase() || 'pending';
                                    const statusBadge = STATUS_BADGES[statusKey] || STATUS_BADGES.pending;
                                    const StatusIcon = statusBadge.icon;
                                    const imageSrc = item.images?.[0] || item.image || 'https://placehold.co/80x80?text=Product';

                                    return (
                                        <tr key={pId} className="hover:bg-sky-50/30 transition-colors">
                                            {/* Product Info */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={imageSrc}
                                                        alt={item.product_name}
                                                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/80x80?text=Zyvento';
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate max-w-xs sm:max-w-sm">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {item.brand || item.category_id?.name || 'Zyvento Store'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SKU */}
                                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                                                {item.sku || 'N/A'}
                                            </td>

                                            {/* Price */}
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-slate-900">
                                                    {formatCurrency(item.price || item.final_price)}
                                                </span>
                                                {item.mrp && item.mrp > item.price && (
                                                    <span className="block text-[11px] text-slate-400 line-through">
                                                        {formatCurrency(item.mrp)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Stock */}
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                        (item.stock_quantity || 0) <= 5
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}
                                                >
                                                    {item.stock_quantity ?? 0} in stock
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadge.bg}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    <span>{statusBadge.label}</span>
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => navigate(`/seller/products/edit/${pId}`)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Edit Product"
                                                    >
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => setProductToDelete(item)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
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

            {/* Delete Confirmation Modal */}
            {productToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-4">
                            <FiAlertTriangle className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">
                            Delete Product?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2">
                            Are you sure you want to delete <span className="font-semibold text-slate-800">"{productToDelete.product_name}"</span>? This will remove the product permanently from your store, search results, and admin management.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setProductToDelete(null)}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteProduct}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerProducts;
