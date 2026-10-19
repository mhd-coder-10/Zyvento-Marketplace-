// PUBLIC LAYOUT
// Description: Layout for public pages with proper spacing
// Features: Header (sticky) + Content + Footer

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useSystemSettings } from '../context/SettingsContext';
import { FiAlertTriangle } from 'react-icons/fi';

const PublicLayout = () => {
    const { loading, user } = useAppSelector((state) => state.auth);
    const { settings } = useSystemSettings();
    const isMaintenance = Boolean(settings?.maintenance_mode);
    const isAdmin = user?.user_type === 'super_admin' || user?.user_type === 'sub_admin';

    if (loading) {
        return <LoadingSpinner fullPage text="Loading..." />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 w-full max-w-full overflow-x-hidden">
            {isMaintenance && (
                <div className="bg-rose-600 text-white py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md z-[60]">
                    <FiAlertTriangle className="w-5 h-5 text-amber-300 shrink-0 animate-bounce" />
                    <span>
                        <strong>Platform Notice:</strong> {settings?.site_name || 'Zyvento'} is currently undergoing scheduled maintenance. Storefront purchases are temporarily paused.
                        {isAdmin && <span className="ml-2 bg-black/25 px-2 py-0.5 rounded text-[11px]">Admin Bypass Active</span>}
                    </span>
                </div>
            )}
            <Header />
            <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;