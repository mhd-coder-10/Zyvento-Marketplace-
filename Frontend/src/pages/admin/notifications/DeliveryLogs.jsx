import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FiList, FiRefreshCw, FiSearch, FiFilter, FiCheckCircle,
    FiAlertTriangle, FiMail, FiSmartphone, FiBell, FiRepeat,
    FiChevronLeft, FiChevronRight, FiClock, FiEye, FiCheck
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const DeliveryLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [channelFilter, setChannelFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [retryingLogId, setRetryingLogId] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 200);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                limit: 200,
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(channelFilter !== 'all' && { channel: channelFilter }),
                ...(debouncedSearch.trim() && { search: debouncedSearch.trim() })
            };
            const res = await ApiService.getDeliveryLogs(params);
            if (res.data?.success) {
                setLogs(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load delivery logs', err);
            toast.error('Failed to load delivery logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [statusFilter, channelFilter, debouncedSearch]);

    const handleRetry = async (logId) => {
        setRetryingLogId(logId);
        try {
            const res = await ApiService.retryDeliveryLog(logId);
            if (res.data?.success) {
                toast.success('Retry dispatched successfully');
                fetchLogs();
            } else {
                toast.error(res.data?.message || 'Retry failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to retry delivery');
        } finally {
            setRetryingLogId(null);
        }
    };

    // Calculate in-memory KPI counts
    const counts = {
        total: logs.length,
        delivered: logs.filter(l => ['delivered', 'read', 'clicked'].includes(l.delivery_status)).length,
        read: logs.filter(l => ['read', 'clicked'].includes(l.delivery_status)).length,
        failed: logs.filter(l => l.delivery_status === 'failed').length,
    };

    const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Delivery Logs & Audit Trail"
                subtitle="Live endpoint delivery telemetry, open tracking, delivery failures, and automatic retry management"
                actions={
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                        title="Refresh data"
                    >
                        <FiRefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                }
            />

            <div className="w-full space-y-6">
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-2xl font-bold text-slate-900">{counts.total}</p>
                        <p className="text-xs text-slate-500 font-medium">Logged Dispatches</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-2xl font-bold text-teal-600">{counts.delivered}</p>
                        <p className="text-xs text-slate-500 font-medium">Confirmed Delivered</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-2xl font-bold text-emerald-600">{counts.read}</p>
                        <p className="text-xs text-slate-500 font-medium">Read / Opened</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-2xl font-bold text-rose-600">{counts.failed}</p>
                        <p className="text-xs text-slate-500 font-medium">Failed Dispatches</p>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by recipient, alert code..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Delivery Statuses</option>
                            <option value="sent">Sent</option>
                            <option value="delivered">Delivered</option>
                            <option value="read">Read</option>
                            <option value="clicked">Clicked</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Channels</option>
                            <option value="in_app">In-App</option>
                            <option value="push">Push Notification</option>
                            <option value="email">Email</option>
                        </select>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center">
                            <FiRefreshCw className="animate-spin text-sky-600 w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Querying delivery audit logs...</p>
                        </div>
                    ) : paginatedLogs.length === 0 ? (
                        <div className="p-16 text-center max-w-sm mx-auto space-y-2">
                            <FiList className="w-10 h-10 text-slate-300 mx-auto" />
                            <h3 className="text-sm font-bold text-slate-800">No Logs Found</h3>
                            <p className="text-xs text-slate-500">No delivery logs match your filter criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="py-3 px-4">Notification Code</th>
                                        <th className="py-3 px-4">Recipient</th>
                                        <th className="py-3 px-4">Channel</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Sent At</th>
                                        <th className="py-3 px-4">Delivered / Read</th>
                                        <th className="py-3 px-4">Retries</th>
                                        <th className="py-3 px-4">Failure Reason</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                                                {log.notification_code || log.notification_id || '—'}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-800">
                                                {log.recipient_email || log.recipient_id || 'System User'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] uppercase font-bold text-slate-700">
                                                    {log.channel}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                    log.delivery_status === 'sent' || log.delivery_status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                                    log.delivery_status === 'read' ? 'bg-blue-50 text-blue-700' :
                                                    log.delivery_status === 'clicked' ? 'bg-purple-50 text-purple-700' :
                                                    log.delivery_status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {log.delivery_status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                {log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                {log.read_at ? `Read ${new Date(log.read_at).toLocaleTimeString()}` :
                                                 log.delivered_at ? `Delivered ${new Date(log.delivered_at).toLocaleTimeString()}` : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 font-semibold">
                                                {log.retry_count || 0}
                                            </td>
                                            <td className="py-3 px-4 max-w-xs truncate text-rose-600 text-[11px] font-mono">
                                                {log.failure_reason || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {log.delivery_status === 'failed' && (
                                                    <button
                                                        onClick={() => handleRetry(log._id)}
                                                        disabled={retryingLogId === log._id}
                                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                                    >
                                                        {retryingLogId === log._id ? 'Retrying...' : 'Retry'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {logs.length > pageSize && (
                        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <span>Page {currentPage} of {totalPages} ({logs.length} logs total)</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40"
                                >
                                    <FiChevronLeft />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryLogs;
