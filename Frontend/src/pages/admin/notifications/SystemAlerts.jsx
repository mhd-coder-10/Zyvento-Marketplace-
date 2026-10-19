import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiSearch, FiShield,
    FiCheck, FiX, FiClock, FiActivity, FiServer, FiLock
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const SystemAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [resolveModal, setResolveModal] = useState({ open: false, alert: null, note: '' });

    const fetchSystemAlerts = async () => {
        setLoading(true);
        try {
            const params = {
                limit: 100,
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(severityFilter !== 'all' && { severity: severityFilter }),
            };
            const res = await ApiService.getSystemAlerts(params);
            if (res.data?.success) {
                setAlerts(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load system alerts', err);
            toast.error('Failed to load system alerts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemAlerts();
    }, [statusFilter, severityFilter]);

    const handleAcknowledge = async (alertCode) => {
        try {
            await ApiService.acknowledgeSystemAlert(alertCode);
            toast.success('Alert marked as acknowledged / investigating');
            setAlerts(prev => prev.map(a =>
                a.alert_code === alertCode ? { ...a, status: 'acknowledged', acknowledged_at: new Date() } : a
            ));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to acknowledge alert');
        }
    };

    const handleResolve = async (e) => {
        e.preventDefault();
        if (!resolveModal.alert) return;

        try {
            await ApiService.resolveSystemAlert(resolveModal.alert.alert_code, {
                resolution_note: resolveModal.note
            });
            toast.success('System alert marked as resolved');
            setResolveModal({ open: false, alert: null, note: '' });
            fetchSystemAlerts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resolve alert');
        }
    };

    // Calculate real status counts
    const counts = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        active: alerts.filter(a => a.status === 'active').length,
        resolved: alerts.filter(a => a.status === 'resolved').length,
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'critical':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">Critical</span>;
            case 'high':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">High</span>;
            case 'medium':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Medium</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Low</span>;
        }
    };

    const getSubsystemIcon = (subsystem) => {
        switch ((subsystem || '').toLowerCase()) {
            case 'payment_gateway': return <FiActivity className="w-4 h-4 text-purple-600" />;
            case 'email_service': return <FiServer className="w-4 h-4 text-blue-600" />;
            case 'database': return <FiServer className="w-4 h-4 text-emerald-600" />;
            case 'security': return <FiLock className="w-4 h-4 text-rose-600" />;
            default: return <FiShield className="w-4 h-4 text-amber-600" />;
        }
    };

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="System Alerts & Incidents"
                subtitle="Automated incident detection, payment gateway failures, service errors, and technical alerts"
                actions={
                    <button
                        onClick={fetchSystemAlerts}
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
                        <p className="text-xs text-slate-500 font-medium">Logged Incidents</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-2xl font-bold text-rose-600">{counts.critical}</p>
                        <p className="text-xs text-slate-500 font-medium">Critical Severity</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-2xl font-bold text-amber-600">{counts.active}</p>
                        <p className="text-xs text-slate-500 font-medium">Active / Unresolved</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-2xl font-bold text-emerald-600">{counts.resolved}</p>
                        <p className="text-xs text-slate-500 font-medium">Resolved Incidents</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Status:</span>
                        {['all', 'active', 'acknowledged', 'resolved'].map(st => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1.5 rounded-xl font-medium capitalize transition ${
                                    statusFilter === st
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Severity:</span>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                {/* Alerts List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center">
                            <FiRefreshCw className="animate-spin text-sky-600 w-8 h-8 mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Checking system telemetry...</p>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="p-16 text-center max-w-sm mx-auto space-y-2">
                            <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                            <h3 className="text-sm font-bold text-slate-900">All Systems Normal</h3>
                            <p className="text-xs text-slate-500">No active technical incidents or alerts recorded.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {alerts.map((a) => {
                                const isActive = a.status === 'active';
                                const isAck = a.status === 'acknowledged';
                                const isResolved = a.status === 'resolved';

                                return (
                                    <div key={a._id || a.alert_code} className="p-5 space-y-3 hover:bg-slate-50/50 transition">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
                                                    {getSubsystemIcon(a.subsystem)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                                                        {getSeverityBadge(a.severity)}
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">{a.message}</p>
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                                                        <span className="font-mono text-slate-500">{a.alert_code}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{a.subsystem?.replace('_', ' ')}</span>
                                                        <span>•</span>
                                                        <span>{new Date(a.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isActive && (
                                                    <button
                                                        onClick={() => handleAcknowledge(a.alert_code)}
                                                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                )}
                                                {!isResolved && (
                                                    <button
                                                        onClick={() => setResolveModal({ open: true, alert: a, note: '' })}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold transition shadow-xs"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                                {isResolved && (
                                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs flex items-center gap-1">
                                                        <FiCheck className="w-3.5 h-3.5" />
                                                        Resolved
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Technical Payload / Stack Preview if present */}
                                        {a.technical_details && Object.keys(a.technical_details).length > 0 && (
                                            <details className="mt-2 text-xs">
                                                <summary className="text-[11px] font-semibold text-sky-600 cursor-pointer hover:underline">
                                                    View Technical Diagnostics & Stack
                                                </summary>
                                                <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto">
                                                    {JSON.stringify(a.technical_details, null, 2)}
                                                </pre>
                                            </details>
                                        )}

                                        {a.resolution_note && (
                                            <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                                                <span className="font-semibold">Resolution Note:</span> {a.resolution_note}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Resolve Incident Modal */}
            {resolveModal.open && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Resolve Incident</h3>
                            <button onClick={() => setResolveModal({ open: false, alert: null, note: '' })}>
                                <FiX className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleResolve} className="space-y-4 text-xs">
                            <div>
                                <p className="font-semibold text-slate-800 mb-1">{resolveModal.alert?.title}</p>
                                <p className="text-slate-500 text-[11px]">{resolveModal.alert?.message}</p>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Resolution Notes / Corrective Action
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={resolveModal.note}
                                    onChange={(e) => setResolveModal({ ...resolveModal, note: e.target.value })}
                                    placeholder="Explain how the incident was diagnosed and resolved..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setResolveModal({ open: false, alert: null, note: '' })}
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700"
                                >
                                    Mark as Resolved
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemAlerts;
