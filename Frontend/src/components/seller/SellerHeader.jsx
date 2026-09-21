import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
    FiMenu, FiBell, FiUser, FiLogOut, FiExternalLink,
    FiSettings, FiChevronDown, FiShield, FiShoppingBag
} from 'react-icons/fi';
import UserAvatar from '../common/UserAvatar';

const SellerHeader = ({ sidebarOpen, setSidebarOpen }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const businessName = user?.seller?.business_name || user?.business_name || user?.first_name 
        ? `${user.first_name}'s Store` 
        : 'Seller Portal';

    const employeeType = user?.employee_type ? user.employee_type.replace(/_/g, ' ').toUpperCase() : null;

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-sky-100 bg-white/95 px-4 backdrop-blur-md transition-all sm:px-6">
            {/* Left: Mobile Sidebar Trigger & Store Identity */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-600 transition-colors lg:hidden"
                >
                    <FiMenu size={20} />
                </button>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm font-bold text-sm">
                        <FiShoppingBag size={16} />
                    </div>
                    <div>
                        <h1 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
                            {businessName}
                        </h1>
                        <p className="text-[11px] font-medium text-emerald-600">
                            {employeeType ? `Staff: ${employeeType}` : 'Merchant Dashboard'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: Quick actions and Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
                <NavLink
                    to="/"
                    target="_blank"
                    className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 transition-all"
                >
                    <span>View Marketplace</span>
                    <FiExternalLink size={13} />
                </NavLink>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-1.5 hover:bg-slate-100 transition-colors"
                    >
                        <UserAvatar
                            src={user?.profile_image || user?.profileImage}
                            name={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Seller Account'}
                            size="sm"
                            shape="square"
                            className="h-8 w-8 text-xs font-bold rounded-lg shadow-sm"
                        />
                        <div className="hidden text-left md:block pr-1">
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Seller Account'}
                            </p>
                            <p className="text-[10px] text-slate-500 capitalize">
                                {user?.user_type === 'seller_employee' ? 'Staff Member' : 'Store Owner'}
                            </p>
                        </div>
                        <FiChevronDown size={14} className="text-slate-400 hidden sm:block" />
                    </button>

                    {dropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                                <div className="border-b border-slate-100 px-3 py-2">
                                    <p className="text-xs font-bold text-slate-800">{user?.first_name} {user?.last_name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                                </div>

                                <div className="py-1">
                                    <NavLink
                                        to="/seller/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <FiUser size={15} className="text-slate-400" />
                                        <span>My Profile</span>
                                    </NavLink>
                                    <NavLink
                                        to="/seller/settings"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <FiSettings size={15} className="text-slate-400" />
                                        <span>Store Settings</span>
                                    </NavLink>
                                </div>

                                <div className="border-t border-slate-100 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        <FiLogOut size={15} />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SellerHeader;
