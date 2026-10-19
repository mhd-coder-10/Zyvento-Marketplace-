import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FiBarChart2, FiTrendingUp, FiRefreshCw, FiCalendar, FiFilter,
    FiCheckCircle, FiAlertTriangle, FiMail, FiSmartphone, FiBell,
    FiMousePointer, FiEye, FiUsers, FiPieChart
} from 'react-icons/fi';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

// Register Chart.js modules
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const NotificationAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [daysFilter, setDaysFilter] = useState('30');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [channelFilter, setChannelFilter] = useState('all');

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {
                days: daysFilter,
                ...(categoryFilter !== 'all' && { category: categoryFilter }),
                ...(channelFilter !== 'all' && { channel: channelFilter }),
            };
            const res = await ApiService.getNotificationAnalytics(params);
            if (res.data?.success) {
                setAnalytics(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load analytics', err);
            toast.error('Failed to load notification analytics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [daysFilter, categoryFilter, channelFilter]);

    const summary = analytics?.summary || {
        total_notifications: 0,
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        total_read: 0,
        total_unread: 0,
        total_clicked: 0,
        delivery_rate: 0,
        read_rate: 0,
        click_rate: 0
    };

    // Prepare Delivery Trend Line Chart Data
    const trendList = analytics?.delivery_trend || [];
    const trendLabels = trendList.map(t => t._id || '');
    const trendSent = trendList.map(t => t.count || 0);
    const trendRead = trendList.map(t => t.read_count || 0);
    const trendFailed = trendList.map(t => t.failed_count || 0);

    const deliveryTrendChartData = {
        labels: trendLabels.length > 0 ? trendLabels : ['Today'],
        datasets: [
            {
                label: 'Sent',
                data: trendSent.length > 0 ? trendSent : [summary.total_sent],
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.1)',
                tension: 0.3,
                fill: true,
            },
            {
                label: 'Read',
                data: trendRead.length > 0 ? trendRead : [summary.total_read],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: true,
            },
            {
                label: 'Failed',
                data: trendFailed.length > 0 ? trendFailed : [summary.total_failed],
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    // Channel Performance Doughnut Data
    const channelList = analytics?.channel_performance || [];
    const channelLabels = channelList.map(c => (c._id === 'in_app' ? 'In-App' : c._id === 'push' ? 'Push' : 'Email'));
    const channelCounts = channelList.map(c => c.total || 0);

    const channelChartData = {
        labels: channelLabels.length > 0 ? channelLabels : ['In-App', 'Push', 'Email'],
        datasets: [
            {
                data: channelCounts.length > 0 ? channelCounts : [1, 0, 0],
                backgroundColor: ['#6366f1', '#a855f7', '#3b82f6'],
                hoverOffset: 4,
            },
        ],
    };

    // Audience Performance Bar Data
    const audienceList = analytics?.audience_performance || [];
    const audienceLabels = audienceList.map(a => (a._id || 'general').replace('_', ' ').toUpperCase());
    const audienceCounts = audienceList.map(a => a.count || 0);

    const audienceChartData = {
        labels: audienceLabels.length > 0 ? audienceLabels : ['CUSTOMERS', 'SELLERS', 'ADMINS'],
        datasets: [
            {
                label: 'Alerts Dispatched',
                data: audienceCounts.length > 0 ? audienceCounts : [0, 0, 0],
                backgroundColor: '#38bdf8',
                borderRadius: 8,
            },
        ],
    };

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Notification Analytics"
                subtitle="Performance breakdown, delivery ratios, open rates, and channel effectiveness"
                actions={
                    <button
                        onClick={fetchAnalytics}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-sm"
                        title="Refresh data"
                    >
                        <FiRefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                }
            />

            <div className="w-full space-y-6">
                {/* Filter Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-500 font-semibold">Period:</span>
                        {[
                            { id: '7', label: 'Last 7 Days' },
                            { id: '30', label: 'Last 30 Days' },
                            { id: '90', label: 'Last 90 Days' },
                        ].map(d => (
                            <button
                                key={d.id}
                                onClick={() => setDaysFilter(d.id)}
                                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                                    daysFilter === d.id
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            <option value="order">Order & Shipping</option>
                            <option value="product">Product & Stock</option>
                            <option value="seller">Seller & Payouts</option>
                            <option value="customer">Customer Updates</option>
                            <option value="finance">Finance Alerts</option>
                            <option value="promotion">Marketing & Deals</option>
                        </select>

                        <select
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Channels</option>
                            <option value="in_app">In-App</option>
                            <option value="push">Push Notification</option>
                            <option value="email">Email</option>
                        </select>
                    </div>
                </div>

                {/* 6 Executive Summary KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xl font-bold text-slate-900">{summary.total_sent}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Total Sent</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xl font-bold text-teal-600">{summary.total_delivered}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Delivered ({summary.delivery_rate}%)</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xl font-bold text-emerald-600">{summary.total_read}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Read / Viewed ({summary.read_rate}%)</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xl font-bold text-slate-500">{summary.total_unread}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Unread Alerts</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xl font-bold text-purple-600">{summary.total_clicked}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Clicked ({summary.click_rate}%)</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xl font-bold text-rose-600">{summary.total_failed}</p>
                        <p className="text-[11px] text-slate-500 font-medium">Failed Dispatches</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Delivery & Read Trend (8 cols) */}
                    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <FiTrendingUp className="w-4 h-4 text-sky-600" />
                                    <span>Notification Delivery & Engagement Trend</span>
                                </h3>
                                <p className="text-xs text-slate-400">Daily sent, read, and failure trajectories</p>
                            </div>
                        </div>
                        <div className="h-72">
                            <Line
                                data={deliveryTrendChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'top' } },
                                    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } } }
                                }}
                            />
                        </div>
                    </div>

                    {/* Channel Share Doughnut (4 cols) */}
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FiPieChart className="w-4 h-4 text-purple-600" />
                                <span>Channel Performance</span>
                            </h3>
                            <p className="text-xs text-slate-400">Share across In-App, Push & Email</p>
                        </div>
                        <div className="h-72 flex items-center justify-center">
                            <Doughnut
                                data={channelChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } }
                                }}
                            />
                        </div>
                    </div>

                    {/* Audience Breakdown (6 cols) */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FiUsers className="w-4 h-4 text-sky-600" />
                                <span>Audience Distribution</span>
                            </h3>
                            <p className="text-xs text-slate-400">Recipient segment breakdown</p>
                        </div>
                        <div className="h-64">
                            <Bar
                                data={audienceChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } } }
                                }}
                            />
                        </div>
                    </div>

                    {/* Failure Reasons Breakdown (6 cols) */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FiAlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>Delivery Failure Diagnostics</span>
                            </h3>
                            <p className="text-xs text-slate-400">Root causes recorded by delivery engine</p>
                        </div>
                        <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                            {analytics?.failure_breakdown && analytics.failure_breakdown.length > 0 ? (
                                analytics.failure_breakdown.map((f, i) => (
                                    <div key={i} className="flex items-center justify-between p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-xs">
                                        <span className="font-mono text-slate-700 truncate pr-2">{f._id || 'Unknown delivery failure'}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                            {f.count} incidents
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center text-xs text-slate-400">
                                    <FiCheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    No delivery failures recorded in this period.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationAnalytics;
