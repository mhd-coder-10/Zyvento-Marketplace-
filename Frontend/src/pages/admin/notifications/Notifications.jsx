import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch, FiEye, FiTrash2, FiCheckCircle, FiBell, FiClock,
    FiRefreshCw, FiSend, FiTag, FiZap, FiSliders, FiX,
    FiChevronLeft, FiChevronRight, FiUsers, FiMail, FiMessageSquare,
    FiSmartphone, FiShield, FiAlertCircle, FiInfo, FiCopy, FiCheck, FiEdit2,
    FiArchive, FiAlertTriangle, FiCalendar, FiPlayCircle, FiXCircle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const TABS = [
    { id: 'all', label: 'All', icon: FiBell },
    { id: 'unread', label: 'Unread', icon: FiAlertCircle, color: 'text-amber-600 bg-amber-50' },
    { id: 'scheduled', label: 'Scheduled', icon: FiClock, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'sent', label: 'Sent', icon: FiCheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'draft', label: 'Drafts', icon: FiEdit2, color: 'text-slate-600 bg-slate-50' },
    { id: 'failed', label: 'Failed', icon: FiAlertTriangle, color: 'text-rose-600 bg-rose-50' },
    { id: 'archived', label: 'Archived', icon: FiArchive, color: 'text-zinc-600 bg-zinc-50' },
];

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'order', label: 'Order & Shipping' },
    { value: 'product', label: 'Product & Stock' },
    { value: 'seller', label: 'Seller & Verification' },
    { value: 'customer', label: 'Customer & Account' },
    { value: 'finance', label: 'Finance & Payments' },
    { value: 'admin', label: 'Admin & System Alerts' },
];

const AUDIENCES = [
    { value: 'all', label: 'All Audiences' },
    { value: 'all_customers', label: 'Customers' },
    { value: 'all_sellers', label: 'Sellers' },
    { value: 'all_admins', label: 'All Admins' },
    { value: 'specific_seller', label: 'Specific Seller' },
    { value: 'specific_customer', label: 'Specific Customer' },
];

const Notifications = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Active tab directly from URL param
    const activeTab = searchParams.get('tab') || 'all';

    const [allNotifications, setAllNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [audienceFilter, setAudienceFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [channelFilter, setChannelFilter] = useState('all');
    const [dateRangeFilter, setDateRangeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, code: null });
    const [copiedCode, setCopiedCode] = useState(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 150);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchNotifications = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setIsRefreshing(true);
        try {
            const res = await ApiService.getAllNotifications({ limit: 300 });
            if (res.data?.success) {
                const data = res.data.data || [];
                setAllNotifications(data);
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications(true);
    }, [fetchNotifications]);

    // Handle instant tab change
    const handleTabChange = (tabId) => {
        setSearchParams(tabId === 'all' ? {} : { tab: tabId });
        setCurrentPage(1);
    };

    const handleMarkAsRead = async (e, code) => {
        e.stopPropagation();
        try {
            await ApiService.markNotificationAsRead(code);
            toast.success('Notification marked as read');
            setAllNotifications(prev => prev.map(n =>
                n.notification_code === code ? { ...n, is_read: true, status: 'read', read_at: new Date() } : n
            ));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await ApiService.markAllNotificationsAsRead();
            toast.success('All notifications marked as read');
            setAllNotifications(prev => prev.map(n => ({ ...n, is_read: true, status: 'read', read_at: new Date() })));
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleSendNow = async (e, code) => {
        e.stopPropagation();
        try {
            await ApiService.sendNotificationNow(code);
            toast.success('Notification broadcast dispatched immediately');
            fetchNotifications(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to dispatch notification');
        }
    };

    const handleCancelScheduled = async (e, code) => {
        e.stopPropagation();
        try {
            await ApiService.cancelScheduledNotification(code);
            toast.success('Scheduled broadcast cancelled');
            fetchNotifications(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel scheduled notification');
        }
    };

    const handleRowClick = (code) => {
        navigate(`/admin/notifications/${code}`);
    };

    const handleCopyCode = (e, code) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.info(`Copied: ${code}`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleDelete = async () => {
        try {
            await ApiService.deleteNotification(deleteConfirm.code);
            toast.success('Notification deleted successfully');
            setAllNotifications(prev => prev.filter(n => n.notification_code !== deleteConfirm.code));
        } catch (error) {
            toast.error('Failed to delete notification');
        } finally {
            setDeleteConfirm({ open: false, code: null });
        }
    };

    // Calculate real 6 KPI stats directly from actual notifications
    const stats = useMemo(() => {
        const counts = {
            total: allNotifications.length,
            sent: 0,
            scheduled: 0,
            failed: 0,
            drafts: 0,
            critical: 0
        };
        allNotifications.forEach(n => {
            const st = (n.status || '').toLowerCase();
            if (st === 'sent' || st === 'delivered' || st === 'read') counts.sent++;
            else if (st === 'scheduled') counts.scheduled++;
            else if (st === 'failed' || st === 'partially_failed') counts.failed++;
            else if (st === 'draft') counts.drafts++;

            if (n.priority === 'critical' || n.alert_severity === 'critical') {
                counts.critical++;
            }
        });
        return counts;
    }, [allNotifications]);

    // Filtering logic
    const filteredNotifications = useMemo(() => {
        return allNotifications.filter(n => {
            const st = (n.status || '').toLowerCase();
            // 1. Tab Status
            if (activeTab === 'unread') {
                if (n.is_read) return false;
            } else if (activeTab === 'scheduled') {
                if (st !== 'scheduled') return false;
            } else if (activeTab === 'sent') {
                if (st !== 'sent' && st !== 'delivered' && st !== 'read') return false;
            } else if (activeTab === 'draft') {
                if (st !== 'draft') return false;
            } else if (activeTab === 'failed') {
                if (st !== 'failed' && st !== 'partially_failed') return false;
            } else if (activeTab === 'archived') {
                if (st !== 'archived') return false;
            }

            // 2. Category Filter
            if (categoryFilter !== 'all') {
                const cat = (n.category || n.notification_type || '').toLowerCase();
                if (!cat.includes(categoryFilter)) return false;
            }

            // 3. Audience Filter
            if (audienceFilter !== 'all') {
                const aud = (n.audience || n.receiver_type || '').toLowerCase();
                if (!aud.includes(audienceFilter)) return false;
            }

            // 4. Priority Filter
            if (priorityFilter !== 'all' && (n.priority || 'normal').toLowerCase() !== priorityFilter) {
                return false;
            }

            // 5. Channel Filter
            if (channelFilter !== 'all') {
                const chs = Array.isArray(n.channels) && n.channels.length > 0 ? n.channels : [n.channel || 'in_app'];
                if (!chs.includes(channelFilter)) return false;
            }

            // 6. Date Range Filter
            if (dateRangeFilter !== 'all' && n.createdAt) {
                const createdTime = new Date(n.createdAt).getTime();
                const now = Date.now();
                if (dateRangeFilter === 'today' && now - createdTime > 24 * 3600 * 1000) return false;
                if (dateRangeFilter === '7d' && now - createdTime > 7 * 24 * 3600 * 1000) return false;
                if (dateRangeFilter === '30d' && now - createdTime > 30 * 24 * 3600 * 1000) return false;
            }

            // 7. Search Filter
            if (debouncedSearch.trim()) {
                const q = debouncedSearch.trim().toLowerCase();
                const titleMatch = (n.title || '').toLowerCase().includes(q);
                const messageMatch = (n.message || '').toLowerCase().includes(q);
                const codeMatch = (n.notification_code || '').toLowerCase().includes(q);
                if (!titleMatch && !messageMatch && !codeMatch) return false;
            }

            return true;
        });
    }, [allNotifications, activeTab, categoryFilter, audienceFilter, priorityFilter, channelFilter, dateRangeFilter, debouncedSearch]);

    // Pagination
    const totalItems = filteredNotifications.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const paginatedNotifications = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredNotifications.slice(start, start + pageSize);
    }, [filteredNotifications, currentPage, pageSize]);

    const getTabCount = (tabId) => {
        if (tabId === 'all') return allNotifications.length;
        if (tabId === 'unread') return allNotifications.filter(n => !n.is_read).length;
        if (tabId === 'scheduled') return allNotifications.filter(n => (n.status || '').toLowerCase() === 'scheduled').length;
        if (tabId === 'sent') return allNotifications.filter(n => ['sent', 'delivered', 'read'].includes((n.status || '').toLowerCase())).length;
        if (tabId === 'draft') return allNotifications.filter(n => (n.status || '').toLowerCase() === 'draft').length;
        if (tabId === 'failed') return allNotifications.filter(n => ['failed', 'partially_failed'].includes((n.status || '').toLowerCase())).length;
        if (tabId === 'archived') return allNotifications.filter(n => (n.status || '').toLowerCase() === 'archived').length;
        return 0;
    };

    const getStatusBadge = (status) => {
        const map = {
            draft: { label: 'Draft', bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
            scheduled: { label: 'Scheduled', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
            processing: { label: 'Processing', bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500 animate-pulse' },
            sent: { label: 'Sent', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
            delivered: { label: 'Delivered', bg: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
            read: { label: 'Read', bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
            failed: { label: 'Failed', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
            partially_failed: { label: 'Partially Failed', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
            cancelled: { label: 'Cancelled', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-400' },
            archived: { label: 'Archived', bg: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
        };
        const config = map[(status || '').toLowerCase()] || map.sent;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                {config.label}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const map = {
            low: { label: 'Low', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
            normal: { label: 'Normal', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
            medium: { label: 'Normal', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
            high: { label: 'High', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
            critical: { label: 'Critical', bg: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold' }
        };
        const config = map[(priority || 'normal').toLowerCase()] || map.normal;
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
                {config.label}
            </span>
        );
    };

    const renderChannels = (notification) => {
        const chs = Array.isArray(notification.channels) && notification.channels.length > 0
            ? notification.channels
            : [notification.channel || 'in_app'];

        return (
            <div className="flex items-center gap-1.5">
                {chs.includes('in_app') && (
                    <span className="p-1 rounded bg-indigo-50 text-indigo-600" title="In-App">
                        <FiBell className="w-3.5 h-3.5" />
                    </span>
                )}
                {chs.includes('push') && (
                    <span className="p-1 rounded bg-purple-50 text-purple-600" title="Push Notification">
                        <FiSmartphone className="w-3.5 h-3.5" />
                    </span>
                )}
                {chs.includes('email') && (
                    <span className="p-1 rounded bg-blue-50 text-blue-600" title="Email Notification">
                        <FiMail className="w-3.5 h-3.5" />
                    </span>
                )}
            </div>
        );
    };

    const getCategoryIcon = (category) => {
        switch ((category || '').toLowerCase()) {
            case 'order': return <FiCheckCircle className="w-4 h-4 text-emerald-600" />;
            case 'product': return <FiTag className="w-4 h-4 text-purple-600" />;
            case 'seller': return <FiUsers className="w-4 h-4 text-indigo-600" />;
            case 'customer': return <FiUsers className="w-4 h-4 text-sky-600" />;
            case 'finance': return <FiShield className="w-4 h-4 text-teal-600" />;
            case 'admin':
            case 'system': return <FiAlertTriangle className="w-4 h-4 text-amber-600" />;
            default: return <FiBell className="w-4 h-4 text-blue-600" />;
        }
    };

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Notification Center"
                subtitle="Monitor platform alerts, manage broadcast campaigns, and track multi-channel delivery"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchNotifications(false)}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                            title="Refresh data"
                        >
                            <FiRefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                        >
                            <FiCheck className="w-4 h-4 text-emerald-600" />
                            <span>Mark All Read</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/notifications/send')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-blue-200 text-sm"
                        >
                            <FiSend className="w-4 h-4" />
                            <span>Create Broadcast</span>
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">
                {/* 6 KPI Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                                <FiBell className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Total Alerts</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                                <FiCheckCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{stats.sent}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Sent & Delivered</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <FiClock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{stats.scheduled}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Scheduled</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                                <FiAlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{stats.failed}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Failed</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                <FiEdit2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{stats.drafts}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Drafts</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                                <FiZap className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{stats.critical}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Critical Alerts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7 Filter Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto">
                    <div className="flex items-center gap-1 min-w-max">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const count = getTabCount(tab.id);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                isActive
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

                {/* Search & Filter Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Search */}
                        <div className="relative lg:col-span-2">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title, message, code..."
                                className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <FiX className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                value={categoryFilter}
                                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer transition"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Audience Filter */}
                        <div>
                            <select
                                value={audienceFilter}
                                onChange={(e) => { setAudienceFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer transition"
                            >
                                {AUDIENCES.map(a => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <select
                                value={priorityFilter}
                                onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer transition"
                            >
                                <option value="all">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="normal">Normal</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Channel Filter */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-medium">Channel:</span>
                                {['all', 'in_app', 'push', 'email'].map((ch) => (
                                    <button
                                        key={ch}
                                        onClick={() => { setChannelFilter(ch); setCurrentPage(1); }}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                            channelFilter === ch
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {ch === 'all' ? 'All' : ch === 'in_app' ? 'In-App' : ch === 'push' ? 'Push' : 'Email'}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-medium">Period:</span>
                                {[
                                    { id: 'all', label: 'All Time' },
                                    { id: 'today', label: 'Today' },
                                    { id: '7d', label: '7 Days' },
                                    { id: '30d', label: '30 Days' }
                                ].map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => { setDateRangeFilter(d.id); setCurrentPage(1); }}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                            dateRangeFilter === d.id
                                                ? 'bg-sky-100 text-sky-700'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(categoryFilter !== 'all' || audienceFilter !== 'all' || priorityFilter !== 'all' || channelFilter !== 'all' || dateRangeFilter !== 'all' || search) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setCategoryFilter('all');
                                    setAudienceFilter('all');
                                    setPriorityFilter('all');
                                    setChannelFilter('all');
                                    setDateRangeFilter('all');
                                }}
                                className="text-rose-600 hover:text-rose-700 font-semibold"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List / Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center space-y-3">
                            <FiRefreshCw className="animate-spin text-sky-600 w-8 h-8 mx-auto" />
                            <p className="text-xs font-medium text-slate-500">Loading notifications from telemetry server...</p>
                        </div>
                    ) : paginatedNotifications.length === 0 ? (
                        <div className="p-16 text-center max-w-sm mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                                <FiBell className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">No Notifications Found</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                No notifications match your active filter criteria. Adjust your search or filters to see results.
                            </p>
                            <button
                                onClick={() => navigate('/admin/notifications/send')}
                                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
                            >
                                Create Broadcast
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Notification / Title</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Audience</th>
                                            <th className="py-3 px-4">Channels</th>
                                            <th className="py-3 px-4">Priority</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Schedule / Date</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {paginatedNotifications.map((n) => {
                                            const isScheduled = (n.status || '').toLowerCase() === 'scheduled';
                                            const isDraft = (n.status || '').toLowerCase() === 'draft';
                                            return (
                                                <tr
                                                    key={n._id || n.notification_code}
                                                    onClick={() => handleRowClick(n.notification_code)}
                                                    className={`hover:bg-sky-50/40 cursor-pointer transition ${
                                                        !n.is_read ? 'bg-sky-50/20' : ''
                                                    }`}
                                                >
                                                    <td className="py-3 px-4 max-w-xs">
                                                        <div className="flex items-start gap-2.5">
                                                            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 flex-shrink-0 mt-0.5">
                                                                {getCategoryIcon(n.category || n.notification_type)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className={`font-semibold truncate ${!n.is_read ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                                                                        {n.title}
                                                                    </p>
                                                                    {!n.is_read && (
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                                                    {n.message}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span
                                                                        onClick={(e) => handleCopyCode(e, n.notification_code)}
                                                                        className="text-[10px] font-mono text-slate-400 hover:text-sky-600 flex items-center gap-1"
                                                                        title="Click to copy code"
                                                                    >
                                                                        {n.notification_code}
                                                                        <FiCopy className="w-2.5 h-2.5" />
                                                                    </span>
                                                                    {n.is_broadcast && (
                                                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 uppercase">
                                                                            Broadcast
                                                                        </span>
                                                                    )}
                                                                    {n.is_automatic && (
                                                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 uppercase">
                                                                            Event
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-medium text-slate-700 capitalize">
                                                            {n.category || n.notification_type || 'General'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center gap-1 text-slate-600 capitalize">
                                                            <FiUsers className="w-3 h-3 text-slate-400" />
                                                            {(n.audience || n.receiver_type || 'Customer').replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {renderChannels(n)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {getPriorityBadge(n.priority)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {getStatusBadge(n.status)}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                        {isScheduled && n.scheduled_for ? (
                                                            <div className="text-indigo-600 font-medium">
                                                                <p className="flex items-center gap-1">
                                                                    <FiClock className="w-3 h-3" />
                                                                    {new Date(n.scheduled_for).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">
                                                                    {new Date(n.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p>{new Date(n.createdAt).toLocaleDateString()}</p>
                                                                <p className="text-[10px] text-slate-400">
                                                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {(isScheduled || isDraft) && (
                                                                <button
                                                                    onClick={(e) => handleSendNow(e, n.notification_code)}
                                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                                    title="Send Immediately"
                                                                >
                                                                    <FiPlayCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {isScheduled && (
                                                                <button
                                                                    onClick={(e) => handleCancelScheduled(e, n.notification_code)}
                                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                                    title="Cancel Schedule"
                                                                >
                                                                    <FiXCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {!n.is_read && (
                                                                <button
                                                                    onClick={(e) => handleMarkAsRead(e, n.notification_code)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                    title="Mark as Read"
                                                                >
                                                                    <FiCheck className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => navigate(`/admin/notifications/${n.notification_code}`)}
                                                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                                                                title="View Details"
                                                            >
                                                                <FiEye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ open: true, code: n.notification_code })}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                                                title="Delete"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile / Tablet Cards View */}
                            <div className="lg:hidden divide-y divide-slate-100">
                                {paginatedNotifications.map((n) => {
                                    const isScheduled = (n.status || '').toLowerCase() === 'scheduled';
                                    const isDraft = (n.status || '').toLowerCase() === 'draft';
                                    return (
                                        <div
                                            key={n._id || n.notification_code}
                                            onClick={() => handleRowClick(n.notification_code)}
                                            className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/50"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="p-2 rounded-xl bg-slate-50 text-slate-600 mt-0.5">
                                                        {getCategoryIcon(n.category || n.notification_type)}
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                            {n.title}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                                                    </div>
                                                </div>
                                                {getPriorityBadge(n.priority)}
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(n.status)}
                                                    {renderChannels(n)}
                                                </div>
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {(isScheduled || isDraft) && (
                                                        <button
                                                            onClick={(e) => handleSendNow(e, n.notification_code)}
                                                            className="p-1 text-emerald-600"
                                                        >
                                                            <FiPlayCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setDeleteConfirm({ open: true, code: n.notification_code })}
                                                        className="p-1 text-rose-500"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Toolbar */}
                            <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                                <div>
                                    Showing <span className="font-semibold">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</span> to{' '}
                                    <span className="font-semibold">{Math.min(totalItems, currentPage * pageSize)}</span> of{' '}
                                    <span className="font-semibold">{totalItems}</span> notifications
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                    >
                                        <option value={10}>10 per page</option>
                                        <option value={15}>15 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <FiChevronLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <FiChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                title="Delete Notification"
                message="Are you sure you want to delete this notification record? This will permanently remove its delivery metrics and logs."
                confirmText="Delete Alert"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({ open: false, code: null })}
            />
        </div>
    );
};

export default Notifications;