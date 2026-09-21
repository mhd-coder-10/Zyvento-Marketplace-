import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiEye,
    FiPackage,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiAlertCircle,
    FiRefreshCw,
    FiFilter,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import AdminTable from '../../../components/admin/AdminTable';

const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const SellerProducts = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState([]);
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
        // eslint-disable-next-line
    }, [pagination.page, statusFilter, categoryFilter]);

    const fetchCategories = async () => {
        try {
            const res = await ApiService.getAllCategories({ limit: 100 });
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
                const productList = res.data.data?.products || (Array.isArray(res.data.data) ? res.data.data : []);
                setProducts(productList);
                const pag = res.data.pagination || res.data.data?.pagination;
                if (pag) {
                    setPagination((prev) => ({
                        ...prev,
                        total: pag.total || productList.length,
                        totalPages: pag.totalPages || 1,
                    }));
                }
            }
        } catch (err) {
            console.error('Products load error:', err);
            toast.error('Failed to load products');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchProducts();
    };

    const columns = [
        {
            key: 'product_name',
            label: 'Product',
            render: (value, row) => {
                const img = row.images?.[0]?.url || row.images?.[0] || row.image;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {img ? (
                                <img src={img} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <FiPackage className="h-5 w-5 text-slate-400" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate max-w-xs">{value || row.title}</p>
                            <p className="text-xs text-slate-400">SKU: {row.sku || '—'}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'category_id',
            label: 'Category',
            render: (value, row) => (
                <span className="text-xs font-medium text-slate-600">
                    {row.category_id?.category_name || row.category?.name || row.category || '—'}
                </span>
            ),
        },
        {
            key: 'price',
            label: 'Price',
            render: (value, row) => (
                <div>
                    <span className="font-bold text-blue-700">{formatCurrency(value)}</span>
                    {row.compare_at_price && row.compare_at_price > value && (
                        <p className="text-xs text-slate-400 line-through">{formatCurrency(row.compare_at_price)}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'stock',
            label: 'Stock',
            render: (value, row) => {
                const qty = value ?? row.quantity ?? row.stock_quantity ?? 0;
                return (
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            qty > 10
                                ? 'bg-emerald-50 text-emerald-700'
                                : qty > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                        }`}
                    >
                        {qty} in stock
                    </span>
                );
            },
        },
        {
            key: 'approval_status',
            label: 'Approval',
            render: (value, row) => {
                const s = row.approval_status || value || 'approved';
                const styles = {
                    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
                    rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
                };
                return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize ${styles[s] || styles.approved}`}>
                        {s}
                    </span>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: (value) => {
                const s = value || 'active';
                const isActive = s === 'active';
                return (
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                            isActive ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                    >
                        {s}
                    </span>
                );
            },
        },
    ];

    const actions = [
        {
            label: 'Edit',
            icon: <FiEdit2 className="h-4 w-4 text-blue-600" />,
            onClick: (row) => navigate(`/seller/products/edit/${row._id || row.id}`),
        },
    ];

    return (
        <div className="space-y-6">
            <AdminTopbar
                title="Products Catalog"
                subtitle="Manage your inventory, pricing, and product listings"
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchProducts}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
                        >
                            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={() => navigate('/seller/products/create')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-sky-600 hover:to-blue-700"
                        >
                            <FiPlus className="h-4 w-4" />
                            <span>Add Product</span>
                        </button>
                    </div>
                }
            />

            {/* Filter Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search products by title or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                </form>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c._id || c.id} value={c._id || c.id}>
                                {c.category_name || c.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPagination((prev) => ({ ...prev, page: 1 }));
                        }}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                <AdminTable
                    columns={columns}
                    data={products}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
                    actions={actions}
                    emptyMessage="No products in your catalog yet. Click 'Add Product' to get started."
                />
            </div>
        </div>
    );
};

export default SellerProducts;
