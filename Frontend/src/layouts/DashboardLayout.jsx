import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Sidebar from '../components/common/Sidebar';
import DashboardHeader from '../components/common/DashboardHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardLayout = () => {
    const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (loading) {
        return <LoadingSpinner fullPage text="Loading dashboard..." />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user?.role?.roleName || user?.role_name || 'customer';
    const isAdmin = ['super_admin', 'sub_admin'].includes(userRole);
    const isSeller = ['seller', 'seller_employee'].includes(userRole);

    if (!isAdmin && !isSeller) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className={`transition-all duration-300 w-full max-w-full min-w-0 overflow-x-hidden ${sidebarOpen ? 'lg:ml-64 lg:w-[calc(100%-16rem)]' : 'lg:ml-0'}`}>
                <DashboardHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="pt-16 w-full max-w-full min-w-0 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 w-full max-w-full min-w-0">
                        <Outlet />
                    </div>
                </main>
            </div>
            
        </div>
    );
};

export default DashboardLayout;