import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiRefreshCw, FiBell, FiUser, FiCheckCircle, FiClock,
    FiTag, FiShield, FiSmartphone, FiMail, FiExternalLink,
    FiCopy, FiCheck, FiTrash2, FiAlertCircle, FiUsers, FiSend,
    FiAlertTriangle, FiRepeat, FiMousePointer, FiPlayCircle, FiXCircle
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

const NotificationDetails = () => {
    const { notificationCode } = useParams();
    const navigate = useNavigate();
    const [notification, setNotification] = useState(null);
    const [deliveryLogs, setDeliveryLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [retryingLogId, setRetryingLogId] = useState(null);

    useEffect(() => {
        fetchNotificationData();
    }, [notificationCode]);

    const fetchNotificationData = async () => {
        setLoading(true);
        try {
            const [notifRes, logsRes] = await Promise.allSettled([
                ApiService.getNotificationByCode(notificationCode),
                ApiService.getDeliveryLogs({ notification_code: notificationCode, limit: 50 })
            ]);

            if (notifRes.status === 'fulfilled' && notifRes.value.data?.success) {
                setNotification(notifRes.value.data.data);
            } else {
                toast.error('Notification not found');
                navigate('/admin/notifications');
                return;
            }

            if (logsRes.status === 'fulfilled' && logsRes.value.data?.success) {
                setDeliveryLogs(logsRes.value.data.data || []);
            }
        } catch (error) {
            console.error('Failed to load notification details', error);
            toast.error('Failed to load notification details');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!notificationCode) return;
        navigator.clipboard.writeText(notificationCode);
        setCopiedCode(true);
        toast.info(`Copied notification code "${notificationCode}"`);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleMarkAsRead = async () => {
        try {
            await ApiService.markNotificationAsRead(notificationCode);
            toast.success('Notification marked as read');
            setNotification(prev => ({ ...prev, is_read: true, status: 'read', read_at: new Date() }));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleSendNow = async () => {
        try {
            await ApiService.sendNotificationNow(notificationCode);
            toast.success('Notification dispatched immediately');
            fetchNotificationData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to dispatch notification');
        }
    };

    const handleCancelScheduled = async () => {
        try {
            await ApiService.cancelScheduledNotification(notificationCode);
            toast.success('Scheduled broadcast cancelled');
            fetchNotificationData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel scheduled notification');
        }
    };

    const handleRetryLog = async (logId) => {
        setRetryingLogId(logId);
        try {
            const res = await ApiService.retryDeliveryLog(logId);
            if (res.data?.success) {
                toast.success('Delivery retry succeeded');
                fetchNotificationData();
            } else {
                toast.error(res.data?.message || 'Delivery retry failed');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to retry delivery');
        } finally {
            setRetryingLogId(null);
        }
    };

    const handleDelete = async () => {
        try {
            await ApiService.deleteNotification(notificationCode);
            toast.success('Notification deleted successfully');
            navigate('/admin/notifications');
        } catch (error) {
            toast.error('Failed to delete notification');
        } finally {
            setDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-sky-600 w-8 h-8 mx-auto" />
                    <p className="text-xs font-medium text-slate-600">Loading notification telemetry & delivery logs...</p>
                </div>
            </div>
        );
    }

    if (!notification) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xs border border-slate-200 max-w-md w-full space-y-3">
                    <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h2 className="text-base font-bold text-slate-800">Notification Not Found</h2>
                    <p className="text-slate-500 text-xs">The notification code "{notificationCode}" does not exist or has been deleted.</p>
                    <button
                        onClick={() => navigate('/admin/notifications')}
                        className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold text-xs hover:bg-sky-700 transition"
                    >
                        Return to Notification Center
                    </button>
                </div>
            </div>
        );
    }

    const isScheduled = (notification.status || '').toLowerCase() === 'scheduled';
    const isDraft = (notification.status || '').toLowerCase() === 'draft';
    const metrics = notification.delivery_metrics || {
        sent_count: notification.sent_at ? 1 : 0,
        delivered_count: notification.delivered_at ? 1 : 0,
        read_count: notification.read_at ? 1 : 0,
        click_count: notification.is_clicked ? 1 : 0,
        failure_count: (notification.status || '').toLowerCase() === 'failed' ? 1 : 0
    };

    // Calculate Activity Timeline steps
    const timelineSteps = [
        { label: 'Created', done: true, time: notification.createdAt, desc: 'Notification record initialized' },
        { label: 'Scheduled', done: !!notification.scheduled_for, time: notification.scheduled_for, desc: isScheduled ? 'Awaiting dispatch trigger' : 'Trigger set' },
        { label: 'Sent', done: !!notification.sent_at || ['sent', 'delivered', 'read'].includes((notification.status || '').toLowerCase()), time: notification.sent_at, desc: 'Dispatched through channels' },
        { label: 'Delivered', done: !!notification.delivered_at || notification.is_read || ['delivered', 'read'].includes((notification.status || '').toLowerCase()), time: notification.delivered_at, desc: 'Received at client endpoints' },
        { label: 'Read / Clicked', done: !!notification.is_read || !!notification.is_clicked, time: notification.read_at || notification.clicked_at, desc: notification.is_clicked ? 'Clicked by recipient' : notification.is_read ? 'Opened & read' : 'Unopened' }
    ];

    const channels = Array.isArray(notification.channels) && notification.channels.length > 0
        ? notification.channels
        : [notification.channel || 'in_app'];

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Notification Details"
                subtitle={`${notification.title} (${notification.notification_code})`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/admin/notifications')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-all shadow-xs text-xs sm:text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Back to Notifications
                        </button>
                        {(isScheduled || isDraft) && (
                            <button
                                onClick={handleSendNow}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm"
                            >
                                <FiPlayCircle className="w-4 h-4" />
                                <span>Send Now</span>
                            </button>
                        )}
                        {isScheduled && (
                            <button
                                onClick={handleCancelScheduled}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm"
                            >
                                <FiXCircle className="w-4 h-4" />
                                <span>Cancel Schedule</span>
                            </button>
                        )}
                        {!notification.is_read && (
                            <button
                                onClick={handleMarkAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm"
                            >
                                <FiCheck className="w-4 h-4 text-emerald-600" />
                                <span>Mark Read</span>
                            </button>
                        )}
                        <button
                            onClick={() => setDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 font-medium rounded-xl hover:bg-rose-50 transition shadow-xs text-xs sm:text-sm"
                            title="Delete Notification"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">
                {/* 5 Delivery Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <FiSend className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{metrics.sent_count}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Dispatched</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                                <FiCheckCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{metrics.delivered_count}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Delivered</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <FiCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{metrics.read_count}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Read / Viewed</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                <FiMousePointer className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{metrics.click_count}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Clicked Links</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                                <FiAlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{metrics.failure_count}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Failed Dispatches</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Notification Content & Timeline (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Notification Content Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                        {notification.category || notification.notification_type || 'GENERAL'} ALERT
                                    </span>
                                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                                        {notification.title}
                                    </h2>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${
                                    notification.priority === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                    notification.priority === 'high' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                    {notification.priority || 'Normal'} Priority
                                </span>
                            </div>

                            {/* Message Body */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                {notification.message}
                            </div>

                            {/* Action / Deep Link */}
                            {notification.action_url && (
                                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 flex items-center justify-between">
                                    <div className="text-xs">
                                        <span className="text-slate-500">Deep Link Action:</span>{' '}
                                        <span className="font-semibold text-sky-700 font-mono">{notification.action_url}</span>
                                    </div>
                                    <a
                                        href={notification.action_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-sky-600 text-white text-xs font-semibold rounded-lg hover:bg-sky-700 transition"
                                    >
                                        <span>{notification.action_label || 'Test Link'}</span>
                                        <FiExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            )}

                            {/* Related Entity Notice if linked */}
                            {notification.related_entity && (
                                <div className="text-xs text-slate-600 p-3 bg-slate-100/60 rounded-xl border border-slate-200/80">
                                    <span className="font-semibold">Associated Business Entity:</span>{' '}
                                    <span className="font-mono text-slate-800 font-bold capitalize">
                                        {notification.related_entity.entity_type}: {notification.related_entity.entity_id}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Visual Activity Timeline */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <FiClock className="w-4 h-4 text-sky-600" />
                                <span>Activity & Delivery Timeline</span>
                            </h3>

                            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                {timelineSteps.map((step, idx) => (
                                    <div key={idx} className="relative flex items-start gap-3">
                                        <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${
                                            step.done
                                                ? 'border-emerald-500 text-emerald-600'
                                                : 'border-slate-300 text-slate-300'
                                        }`}>
                                            {step.done ? <FiCheck className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <p className={`font-semibold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                                                    {step.label}
                                                </p>
                                                {step.time && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(step.time).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Metadata Specs (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Specs Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5 text-xs">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                                Notification Specifications
                            </h3>

                            <div className="space-y-2.5 divide-y divide-slate-100">
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-slate-500">Tracking Code</span>
                                    <button
                                        onClick={handleCopy}
                                        className="font-mono text-slate-800 font-semibold flex items-center gap-1 hover:text-sky-600"
                                    >
                                        <span>{notification.notification_code}</span>
                                        {copiedCode ? <FiCheck className="text-emerald-600" /> : <FiCopy className="text-slate-400" />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-500">Delivery Status</span>
                                    <span className="font-semibold capitalize text-slate-800">
                                        {notification.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-500">Audience</span>
                                    <span className="font-semibold capitalize text-slate-800">
                                        {(notification.audience || notification.receiver_type || 'Customer').replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-500">Active Channels</span>
                                    <div className="flex items-center gap-1.5">
                                        {channels.map(ch => (
                                            <span key={ch} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-mono text-[10px] font-bold">
                                                {ch}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-500">Created Date</span>
                                    <span className="text-slate-700 font-medium">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </span>
                                </div>

                                {notification.scheduled_for && (
                                    <div className="flex items-center justify-between pt-2 text-indigo-700">
                                        <span className="font-medium">Scheduled Time</span>
                                        <span className="font-semibold">
                                            {new Date(notification.scheduled_for).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-500">Origin Type</span>
                                    <span className="font-semibold text-slate-800 capitalize">
                                        {notification.is_broadcast ? 'Admin Broadcast' : notification.is_automatic ? 'Event-Based Auto' : 'System Engine'}
                                    </span>
                                </div>

                                {notification.failure_reason && (
                                    <div className="pt-2 text-rose-600">
                                        <span className="font-semibold block mb-0.5">Failure Reason:</span>
                                        <span className="text-[11px] font-mono bg-rose-50 p-2 rounded-lg block border border-rose-100">
                                            {notification.failure_reason}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Delivery Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Per-Recipient Delivery Logs</h3>
                            <p className="text-xs text-slate-500">Detailed endpoint response status, channel logs, and retry actions</p>
                        </div>
                        <button
                            onClick={fetchNotificationData}
                            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                            title="Refresh Logs"
                        >
                            <FiRefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {deliveryLogs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            No individual delivery logs recorded for this alert yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="py-2.5 px-3">Recipient</th>
                                        <th className="py-2.5 px-3">Channel</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3">Sent Time</th>
                                        <th className="py-2.5 px-3">Delivered / Read</th>
                                        <th className="py-2.5 px-3">Retries</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {deliveryLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/60">
                                            <td className="py-2.5 px-3 font-medium text-slate-800">
                                                {log.recipient_email || log.recipient_id || 'System Recipient'}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-mono text-[10px] font-bold">
                                                    {log.channel}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                    log.delivery_status === 'sent' || log.delivery_status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                                    log.delivery_status === 'read' ? 'bg-blue-50 text-blue-700' :
                                                    log.delivery_status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {log.delivery_status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                                {log.sent_at ? new Date(log.sent_at).toLocaleTimeString() : '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                                {log.read_at ? `Read at ${new Date(log.read_at).toLocaleTimeString()}` :
                                                 log.delivered_at ? `Delivered at ${new Date(log.delivered_at).toLocaleTimeString()}` : '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600">
                                                {log.retry_count || 0}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                {log.delivery_status === 'failed' && (
                                                    <button
                                                        onClick={() => handleRetryLog(log._id)}
                                                        disabled={retryingLogId === log._id}
                                                        className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[10px] font-semibold transition disabled:opacity-50"
                                                    >
                                                        {retryingLogId === log._id ? 'Retrying...' : 'Retry Delivery'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm}
                title="Delete Notification"
                message="Are you sure you want to delete this notification record? All associated delivery metrics and logs will be permanently deleted."
                confirmText="Delete Alert"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(false)}
            />
        </div>
    );
};

export default NotificationDetails;