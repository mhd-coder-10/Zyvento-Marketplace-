import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SellerSidebar from '../components/seller/SellerSidebar';
import SellerHeader from '../components/seller/SellerHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SellerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, loading, navigate]);

    if (loading) {
        return <LoadingSpinner fullPage text="Loading Seller Portal..." />;
    }

    if (!isAuthenticated) {
        return null;
    }

    const userRole = user?.role?.roleName || user?.role_name || user?.user_type || 'customer';
    const isSeller = userRole === 'seller';

    if (!isSeller) {
        navigate('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <SellerSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isMobile={isMobile}
                user={user}
            />

            <div
                className={`transition-all duration-300 ${
                    sidebarOpen && !isMobile ? 'lg:ml-64' : 'lg:ml-0'
                }`}
            >
                <SellerHeader
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    isMobile={isMobile}
                    user={user}
                />

                <main
                    className="pt-16"
                    style={{
                        overflowY: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <style>{`
                        main::-webkit-scrollbar {
                            display: none !important;
                            width: 0 !important;
                            height: 0 !important;
                        }
                        main {
                            scrollbar-width: none !important;
                            -ms-overflow-style: none !important;
                        }
                    `}</style>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SellerLayout;
