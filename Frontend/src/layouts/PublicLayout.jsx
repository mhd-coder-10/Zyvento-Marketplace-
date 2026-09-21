// PUBLIC LAYOUT
// Description: Layout for public pages with proper spacing
// Features: Header (sticky) + Content + Footer

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PublicLayout = () => {
    const { loading } = useAppSelector((state) => state.auth);

    if (loading) {
        return <LoadingSpinner fullPage text="Loading..." />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 w-full max-w-full overflow-x-hidden">
            <Header />
            <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;