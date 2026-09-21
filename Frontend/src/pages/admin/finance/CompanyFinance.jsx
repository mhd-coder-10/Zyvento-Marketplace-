import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
    FiPlus, FiEdit2, FiTrash2, FiDownload, FiTrendingUp, FiTrendingDown, FiPercent,
    FiDollarSign, FiSearch, FiFilter, FiCalendar, FiRefreshCw, FiCheckCircle,
    FiClock, FiAlertCircle, FiX, FiChevronLeft, FiChevronRight, FiFileText,
    FiLayers, FiCreditCard, FiArrowUpRight, FiArrowDownRight, FiPieChart,
    FiCopy, FiEye, FiCheck
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

// Pre-defined enterprise marketplace categories
const INCOME_CATEGORIES = [
    'Marketplace Commission',
    'Logistics & Shipping Fee',
    'Sponsored Ads & Promotions',
    'Seller Subscription Fees',
    'Payment Gateway Margin',
    'Direct Sales Revenue',
    'Listing & Registration Fee',
    'Other Income'
];

const EXPENSE_CATEGORIES = [
    'Seller Settlement Payout',
    'Logistics & Delivery Partner',
    'Cloud Infrastructure',
    'Payment Gateway Fees',
    'Digital Marketing & Google Ads',
    'Salaries & Payroll',
    'Office Rent & Utilities',
    'Customer Refund Compensations',
    'GST Remittance',
    'Software Licenses & Tools',
    'Legal & Professional Fees',
    'Other Expense'
];

const PAYMENT_METHODS = [
    { value: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS)' },
    { value: 'upi', label: 'UPI / QR Code' },
    { value: 'gateway', label: 'Payment Gateway (Razorpay)' },
    { value: 'credit_card', label: 'Corporate Card' },
    { value: 'escrow', label: 'Seller Escrow Account' },
    { value: 'cash', label: 'Cash / Petty Cash' },
    { value: 'other', label: 'Other' }
];

const CompanyFinance = () => {
    // Analytics & KPI State
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // Ledger Data State
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0, totalTax: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [tableLoading, setTableLoading] = useState(true);

    // Filter States
    const [timeframe, setTimeframe] = useState('all'); // all, today, 7d, month, quarter, year, custom
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, income, expense
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [sortBy, setSortBy] = useState('entry_date');
    const [sortOrder, setSortOrder] = useState('desc');

    // UI States
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);
    const exportMenuRef = useRef(null);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Details Modal State
    const [viewEntry, setViewEntry] = useState(null);

    // Form State
    const initialFormState = {
        entry_type: 'income',
        amount: '',
        category: 'Marketplace Commission',
        party_name: '',
        payment_method: 'bank_transfer',
        payment_reference: '',
        tax_rate: 18,
        status: 'completed',
        entry_date: new Date().toISOString().split('T')[0],
        description: '',
        notes: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Close export dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate start/end date from timeframe
    const getDateRange = useCallback(() => {
        const now = new Date();
        let start = null;
        let end = null;

        if (timeframe === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
        } else if (timeframe === '7d') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            start = d.toISOString();
            end = now.toISOString();
        } else if (timeframe === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            end = now.toISOString();
        } else if (timeframe === 'quarter') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString();
            end = now.toISOString();
        } else if (timeframe === 'year') {
            start = new Date(now.getFullYear(), 0, 1).toISOString();
            end = now.toISOString();
        } else if (timeframe === 'custom') {
            if (customStartDate) start = new Date(customStartDate).toISOString();
            if (customEndDate) {
                const e = new Date(customEndDate);
                e.setHours(23, 59, 59, 999);
                end = e.toISOString();
            }
        }

        return { startDate: start, endDate: end };
    }, [timeframe, customStartDate, customEndDate]);

    // Fetch Executive Analytics & KPIs
    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const { startDate, endDate } = getDateRange();
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await ApiService.getFinanceAnalytics(params);
            if (res.data && res.data.success) {
                setAnalytics(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load finance analytics:', error);
            toast.error('Failed to load financial KPIs');
        } finally {
            setAnalyticsLoading(false);
        }
    }, [getDateRange]);

    // Fetch General Ledger Entries
    const fetchEntries = useCallback(async () => {
        setTableLoading(true);
        try {
            const { startDate, endDate } = getDateRange();
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy,
                sortOrder
            };

            if (typeFilter !== 'all') params.type = typeFilter;
            if (categoryFilter !== 'all') params.category = categoryFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (methodFilter !== 'all') params.payment_method = methodFilter;
            if (search.trim()) params.search = search.trim();
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await ApiService.getFinanceEntries(params);
            if (res.data && res.data.success) {
                setEntries(res.data.data || []);
                if (res.data.pagination) setPagination(res.data.pagination);
                if (res.data.summary) setSummary(res.data.summary);
            }
        } catch (error) {
            console.error('Failed to load finance entries:', error);
            toast.error('Failed to load ledger records');
        } finally {
            setTableLoading(false);
        }
    }, [getDateRange, pagination.page, pagination.limit, sortBy, sortOrder, typeFilter, categoryFilter, statusFilter, methodFilter, search]);

    // Re-fetch on filter change
    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    // Modal Handlers
    const openAddModal = (type = 'income') => {
        setIsEditMode(false);
        setSelectedEntryId(null);
        setFormData({
            ...initialFormState,
            entry_type: type,
            category: type === 'income' ? 'Marketplace Commission' : 'Cloud Infrastructure'
        });
        setShowModal(true);
    };

    const openEditModal = (entry) => {
        setIsEditMode(true);
        setSelectedEntryId(entry._id);
        setFormData({
            entry_type: entry.entry_type || 'income',
            amount: entry.amount || '',
            category: entry.category || '',
            party_name: entry.party_name || '',
            payment_method: entry.payment_method || 'bank_transfer',
            payment_reference: entry.payment_reference || '',
            tax_rate: entry.tax_rate !== undefined ? entry.tax_rate : 18,
            status: entry.status || 'completed',
            entry_date: entry.entry_date ? new Date(entry.entry_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            description: entry.description || '',
            notes: entry.notes || ''
        });
        setShowModal(true);
    };

    // Save Voucher
    const handleSaveEntry = async (e) => {
        e.preventDefault();
        if (!formData.amount || Number(formData.amount) <= 0) {
            toast.warning('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
                tax_rate: Number(formData.tax_rate || 0),
            };

            if (isEditMode) {
                await ApiService.updateFinanceEntry(selectedEntryId, payload);
                toast.success('Journal voucher updated successfully');
            } else {
                await ApiService.addFinanceEntry(payload);
                toast.success('Journal voucher created successfully');
            }
            setShowModal(false);
            fetchAnalytics();
            fetchEntries();
        } catch (error) {
            console.error('Error saving finance entry:', error);
            toast.error(error.response?.data?.message || 'Failed to save voucher');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Voucher
    const handleDelete = async (id, code) => {
        if (!window.confirm(`Are you sure you want to delete voucher ${code}? This action will be recorded in the audit log.`)) {
            return;
        }
        try {
            await ApiService.deleteFinanceEntry(id);
            toast.success(`Voucher ${code} deleted successfully`);
            fetchAnalytics();
            fetchEntries();
        } catch (error) {
            console.error('Error deleting finance entry:', error);
            toast.error('Failed to delete voucher');
        }
    };

    // One-Click Multi-Format Export Handler
    const handleExport = async (format) => {
        setExporting(true);
        setShowExportMenu(false);
        try {
            const { startDate, endDate } = getDateRange();
            const params = { format };
            if (typeFilter !== 'all') params.type = typeFilter;
            if (categoryFilter !== 'all') params.category = categoryFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (methodFilter !== 'all') params.payment_method = methodFilter;
            if (search.trim()) params.search = search.trim();
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await ApiService.exportFinance(params);

            // Extract filename from header or build fallback
            const disposition = res.headers['content-disposition'];
            let filename = `Zyvento-Financial-Ledger-${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : format}`;
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = disposition.match(/filename="?([^";]+)"?/);
                if (matches && matches[1]) filename = matches[1];
            }

            const blob = new Blob([res.data], {
                type: res.headers['content-type'] || 'application/octet-stream'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`Financial report exported as ${format.toUpperCase()} successfully!`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error(`Failed to export as ${format.toUpperCase()}`);
        } finally {
            setExporting(false);
        }
    };

    // Copy Voucher Code
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(text);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Format Indian Rupee currency
    const formatINR = (val) => {
        const num = Number(val || 0);
        return '₹' + num.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
    };

    // Format Short INR (e.g. ₹1.4L or ₹25K)
    const formatCompactINR = (val) => {
        const num = Number(val || 0);
        if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
        if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + ' L';
        if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + ' K';
        return '₹' + num.toFixed(0);
    };

    // Status Badge Component
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><FiCheckCircle className="text-xs" /> Completed</span>;
            case 'reconciled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><FiCheckCircle className="text-xs" /> Reconciled</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><FiClock className="text-xs" /> Pending</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><FiX className="text-xs" /> Cancelled</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
        }
    };

    // Calculate real-time tax breakdown in modal
    const calculatedTax = (Number(formData.amount || 0) * Number(formData.tax_rate || 0)) / 100;
    const calculatedNet = Number(formData.amount || 0) - calculatedTax;

    const kpis = analytics?.kpis || {};
    const monthlyTrends = analytics?.monthlyTrends || analytics?.monthlyCashFlow || [];
    const incomeCategories = analytics?.categories?.income || analytics?.categoryBreakdown?.income || [];
    const expenseCategories = analytics?.categories?.expense || analytics?.categoryBreakdown?.expense || [];

    return (
        <div className="min-h-screen bg-slate-50/60 pb-16 font-sans antialiased text-slate-800 w-full max-w-full min-w-0 overflow-x-hidden">
            {/* Topbar */}
            <AdminTopbar
                title="Corporate Finance & Treasury Hub"
                subtitle="Double-entry General Ledger, Amazon-Scale Escrow & Cash Flow Analytics"
                actions={
                    <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                        {/* Refresh Button */}
                        <button
                            onClick={() => { fetchAnalytics(); fetchEntries(); }}
                            title="Refresh Data"
                            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition shadow-sm"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${(analyticsLoading || tableLoading) ? 'animate-spin text-blue-600' : ''}`} />
                        </button>

                        {/* Export Dropdown */}
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={exporting}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition shadow-sm text-sm"
                            >
                                <FiDownload className="w-4 h-4 text-slate-500" />
                                {exporting ? 'Exporting...' : 'Export Data'}
                            </button>

                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Select Export Format
                                    </div>
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">XLS</span>
                                        <div>
                                            <p className="font-semibold text-xs leading-none">Microsoft Excel (.xlsx)</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">2 Sheets with KPI Overview</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">CSV</span>
                                        <div>
                                            <p className="font-semibold text-xs leading-none">Standard CSV (.csv)</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">For Tally, QuickBooks, Zoho</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 transition"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">PDF</span>
                                        <div>
                                            <p className="font-semibold text-xs leading-none">Official PDF Statement</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Executive branded layout</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleExport('json')}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 transition"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">{'{ }'}</span>
                                        <div>
                                            <p className="font-semibold text-xs leading-none">Structured JSON (.json)</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Full audit payload backup</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Record Journal Voucher Action */}
                        <button
                            onClick={() => openAddModal('income')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-md shadow-blue-500/20 text-sm"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Record Voucher</span>
                        </button>
                    </div>
                }
            />

            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 space-y-6 mt-4 w-full max-w-full min-w-0">

                {/* ========================================================================= */}
                {/* 1. TIMEFRAME & AUDIT BAR */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full max-w-full min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5" /> Timeframe:
                        </span>
                        {[
                            { key: 'all', label: 'All Time' },
                            { key: 'today', label: 'Today' },
                            { key: '7d', label: 'Last 7 Days' },
                            { key: 'month', label: 'This Month' },
                            { key: 'quarter', label: 'This Quarter' },
                            { key: 'year', label: 'This Year' },
                            { key: 'custom', label: 'Custom' },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTimeframe(t.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${timeframe === t.key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {timeframe === 'custom' && (
                        <div className="flex items-center gap-2 text-xs w-full md:w-auto">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Audited by Super Admin</span>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 2. EXECUTIVE FINANCIAL KPIS (AMAZON-GRADE 6 CARDS) */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full max-w-full min-w-0">
                    {/* CARD 1: GMV */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Gross Sales (GMV)</span>
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
                                <FiLayers />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                            {formatINR(kpis.gmv || 0)}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Marketplace Orders</span>
                            <span className="font-semibold text-slate-700">{kpis.totalOrders || kpis.orderCount || 0} orders</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 opacity-60"></div>
                    </div>

                    {/* CARD 2: NET PLATFORM REVENUE */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Platform Revenue</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                                <FiArrowUpRight />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-emerald-600 mt-2 tracking-tight">
                            {formatINR(kpis.totalIncome || kpis.recordedIncome || 0)}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Take Rate</span>
                            <span className="font-semibold text-emerald-700">~{kpis.commissionRate || kpis.platformCommissionRate || 10}% Commission</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 opacity-70"></div>
                    </div>

                    {/* CARD 3: OPERATING EXPENSES */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-rose-200 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Operating Expenses</span>
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm">
                                <FiArrowDownRight />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-rose-600 mt-2 tracking-tight">
                            {formatINR(kpis.totalExpense || kpis.recordedExpense || 0)}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Cloud, Logistics, Ops</span>
                            <span className="font-semibold text-slate-700">OPEX</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 opacity-70"></div>
                    </div>

                    {/* CARD 4: NET PROFIT (EBITDA) */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-200 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Net Profit (EBITDA)</span>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                                <FiTrendingUp />
                            </div>
                        </div>
                        <p className={`text-xl font-bold mt-2 tracking-tight ${(kpis.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            {formatINR(kpis.netProfit || 0)}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Operating Margin</span>
                            <span className={`font-semibold ${(kpis.netProfit || 0) >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                                {kpis.profitMargin || 0}%
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-70"></div>
                    </div>

                    {/* CARD 5: SELLER ESCROW LIABILITY */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-amber-200 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Seller Escrow Hold</span>
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                                <FiCreditCard />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-amber-600 mt-2 tracking-tight">
                            {formatINR(kpis.sellerEscrowLiability || 0)}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>Merchant Payable</span>
                            <span className="font-semibold text-amber-700">Pending Settlement</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 opacity-70"></div>
                    </div>

                    {/* CARD 6: GST LIABILITY */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-purple-200 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Tax & GST Accrual</span>
                            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
                                <FiPercent />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-purple-600 mt-2 tracking-tight">
                            {formatINR(kpis.totalTaxCollected || kpis.netGstLiability || 0)}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span>GSTR-3B Compliant</span>
                            <span className="font-semibold text-purple-700">18% Standard</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 opacity-70"></div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 3. VISUAL CHARTS & CATEGORY DISTRIBUTION */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-full min-w-0">

                    {/* CASH FLOW BAR VISUALIZER (2 COLUMNS) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm w-full max-w-full min-w-0 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Cash Flow & Revenue Trends</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Rolling 6-month comparison of corporate income vs operating expenses</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs flex-wrap">
                                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Income
                                </span>
                                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Expense
                                </span>
                                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Net Margin
                                </span>
                            </div>
                        </div>

                        {/* Visual Bar Columns */}
                        {monthlyTrends && monthlyTrends.length > 0 ? (
                            <div className="h-48 pt-4 flex items-end justify-between gap-2 border-b border-slate-100 pb-2 w-full max-w-full overflow-x-auto min-w-0">
                                {monthlyTrends.map((m, idx) => {
                                    // Find max value to scale heights proportionately
                                    const maxVal = Math.max(
                                        ...monthlyTrends.map(t => Math.max(t.income || 0, t.expense || 0, Math.abs(t.net || 0))),
                                        1000
                                    );
                                    const incHeight = Math.min(100, Math.max(6, ((m.income || 0) / maxVal) * 100));
                                    const expHeight = Math.min(100, Math.max(6, ((m.expense || 0) / maxVal) * 100));

                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                            {/* Tooltip info on hover */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none shadow-md z-10 whitespace-nowrap">
                                                +{formatCompactINR(m.income)} | -{formatCompactINR(m.expense)}
                                            </div>

                                            {/* Bars Pair */}
                                            <div className="w-full flex items-end justify-center gap-1.5 h-36">
                                                {/* Income Bar */}
                                                <div
                                                    style={{ height: `${incHeight}%` }}
                                                    className="w-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300 shadow-sm"
                                                    title={`Income: ${formatINR(m.income)}`}
                                                ></div>
                                                {/* Expense Bar */}
                                                <div
                                                    style={{ height: `${expHeight}%` }}
                                                    className="w-3.5 bg-rose-500 hover:bg-rose-600 rounded-t-md transition-all duration-300 shadow-sm"
                                                    title={`Expense: ${formatINR(m.expense)}`}
                                                ></div>
                                            </div>

                                            {/* Month Label */}
                                            <span className="text-[11px] font-semibold text-slate-500 tracking-tight">
                                                {m.label}
                                            </span>
                                            {/* Net Margin indicator */}
                                            <span className={`text-[10px] font-bold ${Number(m.net || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatCompactINR(m.net || 0)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
                                No historical cash flow data available for this timeframe
                            </div>
                        )}
                    </div>

                    {/* CATEGORY BREAKDOWN (1 COLUMN) */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between w-full max-w-full min-w-0 overflow-hidden">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Revenue & Expense Mix</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Top contributors across financial ledgers</p>
                        </div>

                        {/* Top Income streams */}
                        <div className="mt-4 space-y-3">
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Primary Revenue Streams
                            </p>
                            {incomeCategories.slice(0, 3).map((cat, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium text-slate-700">{cat._id || cat.category}</span>
                                        <span className="font-bold text-slate-900">{formatINR(cat.total)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${Math.min(100, ((cat.total || 0) / (kpis.totalIncome || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}

                            {/* Top Expense heads */}
                            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1 pt-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Primary Expense Heads
                            </p>
                            {expenseCategories.slice(0, 3).map((cat, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium text-slate-700">{cat._id || cat.category}</span>
                                        <span className="font-bold text-slate-900">{formatINR(cat.total)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-rose-500 rounded-full"
                                            style={{ width: `${Math.min(100, ((cat.total || 0) / (kpis.totalExpense || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Double-Entry Reconciled</span>
                            <span className="font-semibold text-blue-600">100% Audited</span>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* 4. GENERAL LEDGER JOURNAL TABLE */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full max-w-full min-w-0">

                    {/* Table Header & Advanced Filters */}
                    <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FiFileText className="text-blue-600" /> General Accounting Ledger
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Official journal vouchers for corporate revenue, payouts, and compliance
                                </p>
                            </div>

                            {/* Quick Add Income / Add Expense */}
                            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                                <button
                                    onClick={() => openAddModal('income')}
                                    className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                                >
                                    <FiPlus className="w-3.5 h-3.5" /> Credit (Income)
                                </button>
                                <button
                                    onClick={() => openAddModal('expense')}
                                    className="flex-1 sm:flex-none justify-center px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                                >
                                    <FiPlus className="w-3.5 h-3.5" /> Debit (Expense)
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                            {/* Search */}
                            <div className="relative md:col-span-2">
                                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search by Voucher #, Counterparty, UTR, Description..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <FiX className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Type Filter */}
                            <div>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="all">All Types (Income & Expense)</option>
                                    <option value="income">Credits (Income Only)</option>
                                    <option value="expense">Debits (Expense Only)</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="all">All Categories</option>
                                    <optgroup label="Income Streams">
                                        {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                    <optgroup label="Operating Expenses">
                                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </optgroup>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="reconciled">Reconciled</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto w-full max-w-full block">
                        <table className="min-w-[850px] w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-4 py-3.5">Voucher Code</th>
                                    <th className="px-4 py-3.5 text-center">Date</th>
                                    <th className="px-4 py-3.5 text-center">Type & Category</th>
                                    <th className="px-4 py-3.5 text-center">Counterparty</th>
                                    <th className="px-4 py-3.5">Method & Ref</th>
                                    <th className="px-4 py-3.5 text-center">Tax (GST)</th>
                                    <th className="px-4 py-3.5 text-center">Gross Amount</th>
                                    <th className="px-4 py-3.5 text-center">Status</th>
                                    <th className="px-4 py-3.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {tableLoading ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-16 text-center text-slate-500">
                                            <FiRefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                                            <span>Loading financial journal records...</span>
                                        </td>
                                    </tr>
                                ) : entries.length > 0 ? (
                                    entries.map((entry) => {
                                        const isIncome = entry.entry_type === 'income';
                                        return (
                                            <tr key={entry._id} className="hover:bg-slate-50/80 transition-colors group">
                                                {/* Voucher Code */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/60">
                                                            {entry.entry_code || 'FIN-GEN'}
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(entry.entry_code)}
                                                            title="Copy Code"
                                                            className="text-slate-400 hover:text-slate-600 transition"
                                                        >
                                                            {copiedCode === entry.entry_code ? (
                                                                <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                            ) : (
                                                                <FiCopy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                                                    {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    }) : '-'}
                                                </td>

                                                {/* Type & Category */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                                            <span className={`w-2 h-2 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                            {entry.category}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 capitalize pl-3.5">
                                                            {isIncome ? 'Credit / Income' : 'Debit / Expense'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Counterparty */}
                                                <td className="px-4 py-3.5 text-slate-700 font-medium max-w-[180px] truncate" title={entry.party_name}>
                                                    {entry.party_name || '-'}
                                                </td>

                                                {/* Method & Ref */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-700 capitalize">
                                                            {(entry.payment_method || 'bank_transfer').replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-slate-400 max-w-[140px] truncate" title={entry.payment_reference}>
                                                            {entry.payment_reference || '-'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Tax */}
                                                <td className="px-4 py-3.5 text-right text-slate-600">
                                                    <div>
                                                        <span className="font-medium">{formatINR(entry.tax_amount || 0)}</span>
                                                        <span className="text-[10px] text-slate-400 block">({entry.tax_rate || 0}%)</span>
                                                    </div>
                                                </td>

                                                {/* Gross Amount */}
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <span className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isIncome ? '+' : '-'}{formatINR(entry.amount)}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                    {renderStatusBadge(entry.status)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setViewEntry(entry)}
                                                            title="View Voucher Details"
                                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(entry)}
                                                            title="Edit Voucher"
                                                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry._id, entry.entry_code)}
                                                            title="Soft Delete"
                                                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-16 text-center text-slate-500">
                                            <FiLayers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                            <p className="font-semibold text-slate-700">No accounting vouchers found</p>
                                            <p className="text-xs text-slate-400 mt-1">Try adjusting your date filters or search terms</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer: Summary & Pagination */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs w-full max-w-full min-w-0">
                        <div className="flex items-center gap-4 text-slate-600 flex-wrap justify-center sm:justify-start">
                            <span>
                                Showing <strong>{entries.length}</strong> of <strong>{pagination.total || entries.length}</strong> vouchers
                            </span>
                            <span className="hidden md:inline-block text-slate-300">|</span>
                            <span className="hidden md:inline-flex items-center gap-3">
                                <span>Filtered Income: <strong className="text-emerald-600">{formatINR(summary.totalIncome)}</strong></span>
                                <span>Filtered Expenses: <strong className="text-rose-600">{formatINR(summary.totalExpense)}</strong></span>
                                <span>Net: <strong className={summary.netBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}>{formatINR(summary.netBalance)}</strong></span>
                            </span>
                        </div>

                        {/* Page navigation */}
                        <div className="flex items-center gap-2 justify-center w-full sm:w-auto">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page <= 1 || tableLoading}
                                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition"
                            >
                                <FiChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 font-medium text-slate-700">
                                Page {pagination.page} of {pagination.totalPages || 1}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.min(pagination.totalPages || 1, p.page + 1) }))}
                                disabled={pagination.page >= (pagination.totalPages || 1) || tableLoading}
                                className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:pointer-events-none transition"
                            >
                                <FiChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* ========================================================================= */}
            {/* 5. ADD / EDIT JOURNAL VOUCHER MODAL */}
            {/* ========================================================================= */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {isEditMode ? 'Edit General Ledger Voucher' : 'Record New Journal Voucher'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Double-entry accounting transaction with automated tax & net calculations
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSaveEntry} className="p-6 space-y-4 overflow-y-auto">

                            {/* Entry Type Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Voucher Type *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, entry_type: 'income', category: 'Marketplace Commission' })}
                                        className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${formData.entry_type === 'income'
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        <FiTrendingUp className="w-4 h-4" /> Credit / Corporate Revenue (+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, entry_type: 'expense', category: 'Cloud Infrastructure' })}
                                        className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${formData.entry_type === 'expense'
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        <FiTrendingDown className="w-4 h-4" /> Debit / Operating Expense (-)
                                    </button>
                                </div>
                            </div>

                            {/* Amount & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Gross Amount (₹) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full pl-8 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Accounting Category *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        {formData.entry_type === 'income'
                                            ? INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                                            : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                                        }
                                    </select>
                                </div>
                            </div>

                            {/* Tax Rate & Real-Time Calculation Preview */}
                            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Applicable GST / Tax Rate
                                        </label>
                                        <select
                                            value={formData.tax_rate}
                                            onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                                        >
                                            <option value={0}>0% (Tax Exempt / Nil)</option>
                                            <option value={5}>5% GST (Reduced)</option>
                                            <option value={12}>12% GST (Standard)</option>
                                            <option value={18}>18% GST (Services & Standard)</option>
                                            <option value={28}>28% GST (Luxury)</option>
                                        </select>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[11px] text-slate-500 block">Calculated Tax Amount</span>
                                        <span className="text-sm font-bold text-slate-800">{formatINR(calculatedTax)}</span>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[11px] text-slate-500 block">Net Amount (Excl. Tax)</span>
                                        <span className="text-sm font-bold text-blue-600">{formatINR(calculatedNet)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Counterparty & Payment Method */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Counterparty / Vendor / Merchant Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. AWS, Delhivery, Merchant Name"
                                        value={formData.party_name}
                                        onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Reference / UTR & Date & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Payment Reference / UTR #
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="UTR / Cheque / Txn ID"
                                        value={formData.payment_reference}
                                        onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Voucher Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.entry_date}
                                        onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Reconciliation Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="completed">Completed</option>
                                        <option value="reconciled">Reconciled</option>
                                        <option value="pending">Pending</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Description & Internal Auditor Memo */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Description / Line Item Purpose
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="Brief business description of this income or expense..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Auditor Notes (Internal Only)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Internal compliance remarks, tax challan notes, etc."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving Voucher...' : (isEditMode ? 'Update Voucher' : 'Record Voucher')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 6. VIEW DETAILS MODAL */}
            {/* ========================================================================= */}
            {viewEntry && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600 text-sm bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                    {viewEntry.entry_code}
                                </span>
                                {renderStatusBadge(viewEntry.status)}
                            </div>
                            <button onClick={() => setViewEntry(null)} className="p-1 text-slate-400 hover:text-slate-600">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                                <div>
                                    <span className="text-slate-400 block">Gross Transaction</span>
                                    <span className={`text-base font-bold ${viewEntry.entry_type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatINR(viewEntry.amount)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Voucher Type</span>
                                    <span className="font-bold text-slate-800 capitalize">{viewEntry.entry_type}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <span className="text-slate-400 block">Category</span>
                                    <span className="font-semibold text-slate-800">{viewEntry.category}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Counterparty</span>
                                    <span className="font-semibold text-slate-800">{viewEntry.party_name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Payment Method</span>
                                    <span className="font-semibold text-slate-800 capitalize">{(viewEntry.payment_method || '').replace(/_/g, ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Reference / UTR</span>
                                    <span className="font-mono text-slate-800">{viewEntry.payment_reference || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">GST / Tax Component</span>
                                    <span className="font-semibold text-slate-800">{formatINR(viewEntry.tax_amount)} ({viewEntry.tax_rate}%)</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Net Realized</span>
                                    <span className="font-semibold text-slate-800">{formatINR(viewEntry.net_amount)}</span>
                                </div>
                            </div>

                            {viewEntry.description && (
                                <div className="pt-2">
                                    <span className="text-slate-400 block">Description</span>
                                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg mt-0.5">{viewEntry.description}</p>
                                </div>
                            )}

                            {viewEntry.notes && (
                                <div className="pt-1">
                                    <span className="text-slate-400 block">Auditor Notes</span>
                                    <p className="text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50 mt-0.5">{viewEntry.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setViewEntry(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CompanyFinance;