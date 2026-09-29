import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SellerSidebar from '../components/seller/SellerSidebar';
import SellerHeader from '../components/seller/SellerHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SellerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const hoverTimeoutRef = useRef(null);

    const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Responsive detection
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarOpen(false);
                setIsHovered(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cleanup hover timer
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, loading, navigate]);

    // Sidebar hover handlers
    const handleMouseEnter = () => {
        if (isMobile) return;
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 180);
    };

    // Close sidebar immediately when any module is clicked
    const handleNavigate = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setSidebarOpen(false);
        setIsHovered(false);
    };

    // Toggle pin/collapse from header or close button
    const toggleSidebar = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        if (isExpanded) {
            setSidebarOpen(false);
            setIsHovered(false);
        } else {
            setSidebarOpen(true);
        }
    };

    if (loading) {
        return <LoadingSpinner fullPage text="Loading Seller Panel..." />;
    }

    if (!isAuthenticated) {
        return null;
    }

    const userRole = user?.role?.roleName || user?.role_name || user?.user_type || 'customer';
    const isSeller = userRole === 'seller' || user?.user_type === 'seller';

    if (!isSeller) {
        navigate('/');
        return null;
    }

    const isExpanded = isMobile ? sidebarOpen : (sidebarOpen || isHovered);

    return (
        <div className="min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden text-slate-800 relative">
            {/* Desktop Left Edge Hover Trigger */}
            {!isMobile && (
                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className={`fixed top-0 left-0 h-full z-40 transition-all duration-200 ${
                        isExpanded ? 'pointer-events-none' : 'w-4 hover:w-6 cursor-pointer'
                    }`}
                    title="Hover to open menu"
                >
                    {!isExpanded && (
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 group flex items-center">
                            <div className="w-1.5 h-16 bg-gradient-to-b from-sky-400 to-blue-600 rounded-r-full shadow-md shadow-sky-300/40 transition-all duration-300 opacity-60 group-hover:opacity-100 group-hover:w-2" />
                        </div>
                    )}
                </div>
            )}

            {/* Seller Sidebar */}
            <SellerSidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                isExpanded={isExpanded}
                isMobile={isMobile}
                user={user}
                onNavigate={handleNavigate}
                onClose={() => {
                    setSidebarOpen(false);
                    setIsHovered(false);
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />

            {/* Main Area */}
            <div
                className={`transition-all duration-300 ease-in-out w-full max-w-full min-w-0 overflow-x-hidden ${
                    isExpanded && !isMobile ? 'lg:ml-64 lg:w-[calc(100%-16rem)]' : 'lg:ml-0 lg:w-full'
                }`}
            >
                {/* Header Navbar */}
                <SellerHeader
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    isExpanded={isExpanded}
                    toggleSidebar={toggleSidebar}
                    isMobile={isMobile}
                    user={user}
                />

                <main
                    className="pt-16 w-full max-w-full min-w-0 overflow-x-hidden"
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
                    <div className="w-full max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 min-w-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SellerLayout;
