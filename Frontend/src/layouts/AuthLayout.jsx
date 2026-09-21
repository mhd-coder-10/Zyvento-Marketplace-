// import React from 'react';
// import { Outlet, Navigate } from 'react-router-dom';
// import { useAppSelector } from '../store/hooks';
// import LoadingSpinner from '../components/common/LoadingSpinner';

// const AuthLayout = () => {
//     const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

//     if (loading) {
//         return <LoadingSpinner fullPage text="Loading..." />;
//     }

//     if (isAuthenticated) {
//         return <Navigate to="/" replace />;
//     }

//     return (
//         <div className="auth-layout">
//             <Outlet />
//         </div>
//     );
// };

// export default AuthLayout;



import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import LoadingSpinner from '../components/common/LoadingSpinner';

const getDashboardPath = (userType) => {
    switch (userType) {
        case 'super_admin':
        case 'sub_admin':
            return '/admin/dashboard';
        case 'seller':
            return '/seller/dashboard';
        case 'customer':
        default:
            return '/';
    }
};

const AuthLayout = () => {
    const { isAuthenticated, user, profileLoading } = useAppSelector((state) => state.auth);

    if (profileLoading) {
        return <LoadingSpinner fullPage text="Loading..." />;
    }

    if (isAuthenticated) {
        const userType = user?.user_type || user?.role?.role_type || 'customer';
        return <Navigate to={getDashboardPath(userType)} replace />;
    }

    return (
        <div className="auth-layout">
            <Outlet />
        </div>
    );
};

export default AuthLayout;