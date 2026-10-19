import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiDownload, FiCalendar, FiLoader, FiDollarSign,
    FiTrendingUp, FiShoppingBag, FiPackage, FiTag
} from 'react-icons/fi';
import AdminTopbar from '../../../components/admin/AdminTopbar';
import ApiService from '../../../api/ApiService';
import ReportsDateRangePicker from './ReportsDateRangePicker';
import SalesReport from './SalesReport';
import RevenueReport from './RevenueReport';
import OrderReport from './OrderReport';
import ProductReport from './ProductReport';
import CouponReport from './CouponReport';

const validTabs = ['revenue', 'sales', 'orders', 'products', 'coupons'];
const DEFAULT_TAB = 'revenue';
const STORAGE_KEY = 'admin_reports_active_tab';

const REPORT_TABS = [
    { id: 'revenue', label: 'Revenue Report', icon: FiDollarSign, component: RevenueReport },
    { id: 'sales', label: 'Sales Report', icon: FiTrendingUp, component: SalesReport },
    { id: 'orders', label: 'Order Report', icon: FiShoppingBag, component: OrderReport },
    { id: 'products', label: 'Product Report', icon: FiPackage, component: ProductReport },
    { id: 'coupons', label: 'Coupon Report', icon: FiTag, component: CouponReport },
];

const Reports = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Priority: URL query param > last saved tab (sessionStorage) > default ('revenue')
    const getInitialTab = () => {
        const urlType = searchParams.get('type');
        if (validTabs.includes(urlType)) return urlType;

        const savedTab = sessionStorage.getItem(STORAGE_KEY);
        if (validTabs.includes(savedTab)) return savedTab;

        return DEFAULT_TAB;
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [isExporting, setIsExporting] = useState(false);

    // Keep URL in sync + persist tab choice whenever it changes
    useEffect(() => {
        setSearchParams({ type: activeTab });
        sessionStorage.setItem(STORAGE_KEY, activeTab);
    }, [activeTab, setSearchParams]);

    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const activeConfig = REPORT_TABS.find(r => r.id === activeTab) || REPORT_TABS[0];
    const ActiveComponent = activeConfig.component;

    // ==================== EXPORT PDF ====================
    const handleExportPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);
        try {
            toast.info(`Preparing ${activeConfig.label} PDF export...`);
            const response = await ApiService.exportReportPDF(activeTab, dateRange);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${activeTab}-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Report PDF downloaded successfully');
        } catch (err) {
            console.error('Failed to export PDF', err);
            toast.error('Failed to export PDF report');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <AdminTopbar
                title="Reports & Analytics"
                subtitle="Real-time financial performance, sales velocity, order metrics, catalog insights, and coupon ROI"
                actions={
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Modern Date Range Picker Popover */}
                        <ReportsDateRangePicker
                            dateRange={dateRange}
                            onChange={(newRange) => setDateRange(newRange)}
                        />

                        {/* Export Button */}
                        <button
                            type="button"
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                        >
                            {isExporting ? (
                                <>
                                    <FiLoader className="w-4 h-4 animate-spin" /> Exporting...
                                </>
                            ) : (
                                <>
                                    <FiDownload className="w-4 h-4" /> Export PDF
                                </>
                            )}
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">

                {/* ===== NAVIGATION TABS BAR ===== */}
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs overflow-x-auto scrollbar-none">
                    <div className="flex items-center gap-1.5 min-w-max">
                        {REPORT_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ===== ACTIVE REPORT COMPONENT ===== */}
                <div className="w-full">
                    <ActiveComponent dateRange={dateRange} setDateRange={setDateRange} />
                </div>

            </div>
        </div>
    );
};

export default Reports;