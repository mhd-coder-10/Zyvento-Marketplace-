import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiShoppingBag, FiSearch, FiEye, FiRefreshCw,
    FiClock, FiCheckCircle, FiPackage, FiTruck, FiXCircle,
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import AdminTable from '../../../components/admin/AdminTable';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   bg: 'bg-amber-50 text-amber-700 ring-amber-200',     icon: FiClock },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-700 ring-blue-200',         icon: FiCheckCircle },
    packed:    { label: 'Packed',    bg: 'bg-indigo-50 text-indigo-700 ring-indigo-200',   icon: FiPackage },
    shipped:   { label: 'Shipped',   bg: 'bg-cyan-50 text-cyan-700 ring-cyan-200',         icon: FiTruck },
    out_for_delivery: { label: 'Out for Delivery', bg: 'bg-teal-50 text-teal-700 ring-teal-200', icon: FiTruck },
    delivered: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: FiCheckCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 ring-rose-200',         icon: FiXCircle },
    returned:  { label: 'Returned',  bg: 'bg-slate-100 text-slate-600 ring-slate-200',     icon: FiXCircle },
};

const formatCurrency = (v) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const SellerOrders = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const mounted = useRef(true);

    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

    useEffect(() => { fetchOrders(); }, [pagination.page, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSellerMyOrders({
                page: pagination.page,
                limit: pagination.limit,
                status: statusFilter || undefined,
                search: search || undefined,
            });
            if (!mounted.current) return;
            if (res?.data?.success) {
                const list = res.data.data?.orders || (Array.isArray(res.data.data) ? res.data.data : []);
                setOrders(list);
                const pag = res.data.pagination || res.data.data?.pagination;
                if (pag) setPagination((p) => ({ ...p, total: pag.total, totalPages: pag.totalPages }));
            }
        } catch (err) {
            console.error('Orders error:', err);
            toast.error('Failed to load orders');
        } finally {
            if (mounted.current) setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((p) => ({ ...p, page: 1 }));
        fetchOrders();
    };

    const columns = [
        {
            key: 'order_number', label: 'Order #',
            render: (v, row) => (
                <span className="font-semibold text-slate-800">#{v || row.order_id || row._id?.slice(-6)?.toUpperCase() || '—'}</span>
            ),
        },
        {
            key: 'customer', label: 'Customer',
            render: (_, row) => (
                <div>
                    <p className="font-medium text-slate-800">
                        {row.customer_name || (row.user ? `${row.user.first_name || ''} ${row.user.last_name || ''}`.trim() : 'Customer')}
                    </p>
                </div>
            ),
        },
        {
            key: 'items_count', label: 'Items',
            render: (v, row) => <span className="text-sm text-slate-600">{v || row.items?.length || row.order_items?.length || '—'}</span>,
        },
        {
            key: 'total_amount', label: 'Amount',
            render: (v) => <span className="font-bold text-blue-700">{formatCurrency(v)}</span>,
        },
        {
            key: 'order_status', label: 'Status',
            render: (v) => {
                const s = v || 'pending';
                const meta = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
                const Icon = meta.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.bg}`}>
                        <Icon className="h-3.5 w-3.5" />{meta.label}
                    </span>
                );
            },
        },
        {
            key: 'created_at', label: 'Date',
            render: (v) => (
                <span className="text-xs text-slate-500">
                    {v ? new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
            ),
        },
    ];

    const actions = [
        { label: 'View', icon: <FiEye className="h-4 w-4 text-blue-600" />, onClick: (row) => navigate(`/seller/orders/${row._id || row.id}`) },
    ];

    return (
        <div className="space-y-6">
            <AdminTopbar
                title="Order Management"
                subtitle="View and process incoming customer orders"
                actions={
                    <button onClick={fetchOrders} disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:opacity-50">
                        <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                }
            />

            <div className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search orders by ID or customer..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </form>
                <select value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none">
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                </select>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                <AdminTable columns={columns} data={orders} loading={loading} pagination={pagination}
                    onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
                    actions={actions} emptyMessage="No orders found." />
            </div>
        </div>
    );
};

export default SellerOrders;
