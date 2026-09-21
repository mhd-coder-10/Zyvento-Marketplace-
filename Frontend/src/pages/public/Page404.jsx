import React from 'react';
import { Link } from 'react-router-dom';
import {
    FiHome,
    FiSearch,
    FiShoppingBag,
    FiHelpCircle,
    FiArrowLeft,
    FiChevronRight
} from 'react-icons/fi';

const Page404 = () => {
    const quickLinks = [
        { icon: FiHome, label: 'Go to Homepage', path: '/', desc: 'Start fresh from the main page' },
        { icon: FiShoppingBag, label: 'Browse Products', path: '/products', desc: 'Explore thousands of products' },
        { icon: FiSearch, label: 'Search for Items', path: '/products', desc: 'Find exactly what you need' },
        { icon: FiHelpCircle, label: 'Help Center', path: '/help-center', desc: 'Get support and answers' },
    ];

    return (
        <div className="min-h-[85vh] bg-slate-50 flex items-center justify-center px-4 py-16">
            <div className="max-w-3xl w-full text-center">
                {/* Animated 404 */}
                <div className="relative mx-auto w-48 h-48 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-7xl font-black bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                            404
                        </span>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-lg animate-bounce" style={{ animationDelay: '0.1s' }}>
                        🔍
                    </div>
                    <div className="absolute -bottom-1 -left-3 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-lg animate-bounce" style={{ animationDelay: '0.3s' }}>
                        📦
                    </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
                    Oops! Page Not Found
                </h1>
                <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
                    The page you're looking for doesn't exist, may have been moved, or is temporarily unavailable.
                </p>

                {/* Go Back Button */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3.5 bg-white text-slate-900 font-bold text-xs rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
                    >
                        <FiArrowLeft /> Go Back
                    </button>
                    <Link
                        to="/"
                        className="px-6 py-3.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <FiHome /> Back to Home
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-14">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Quick Links</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                        {quickLinks.map((link, idx) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={idx}
                                    to={link.path}
                                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group text-left"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                                        <Icon />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{link.label}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{link.desc}</p>
                                    </div>
                                    <FiChevronRight className="text-slate-300 group-hover:text-indigo-500 text-sm flex-shrink-0 group-hover:translate-x-0.5 transition-all" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page404;
