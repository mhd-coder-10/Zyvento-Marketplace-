import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiSearch,
    FiChevronRight,
    FiMail,
    FiPhone,
    FiMessageCircle,
    FiTruck,
    FiRefreshCw,
    FiShield,
    FiCreditCard,
    FiUser,
    FiPackage,
    FiHelpCircle,
    FiArrowRight,
    FiFileText,
    FiCheckCircle,
    FiShoppingBag,
    FiLock
} from 'react-icons/fi';

const HelpCenter = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedArticle, setExpandedArticle] = useState(null);

    const categories = [
        { id: 'all', name: 'All Topics', icon: FiHelpCircle },
        { id: 'orders', name: 'Orders & Tracking', icon: FiPackage },
        { id: 'shipping', name: 'Shipping & Delivery', icon: FiTruck },
        { id: 'returns', name: 'Returns & Refunds', icon: FiRefreshCw },
        { id: 'payments', name: 'Payments & Pricing', icon: FiCreditCard },
        { id: 'account', name: 'Account & Security', icon: FiUser },
    ];

    const quickActions = [
        {
            title: 'Track Your Order',
            desc: 'Check live shipment status and estimated delivery time',
            icon: FiTruck,
            link: '/order-tracking',
            color: 'from-blue-600 to-cyan-600',
            btnText: 'Track Now'
        },
        {
            title: 'Return or Replace',
            desc: 'Initiate a return or check your refund status',
            icon: FiRefreshCw,
            link: '/returns-refunds',
            color: 'from-indigo-600 to-purple-600',
            btnText: 'Start Return'
        },
        {
            title: 'Manage Account',
            desc: 'Update email, phone, addresses, and saved payment methods',
            icon: FiUser,
            link: '/profile',
            color: 'from-emerald-600 to-teal-600',
            btnText: 'My Profile'
        },
        {
            title: 'Payment & Invoices',
            desc: 'View transactions, download GST invoices, and solve billing issues',
            icon: FiCreditCard,
            link: '/orders',
            color: 'from-amber-600 to-orange-600',
            btnText: 'View Orders'
        }
    ];

    const articles = [
        {
            id: 1,
            category: 'orders',
            title: 'How do I track my active order?',
            summary: 'Learn how to check live shipment status, courier information, and expected delivery date.',
            content: 'You can track any active order by navigating to your Orders page and clicking "Track Package". You will see real-time updates from our delivery partners including dispatch, transit hubs, and out-for-delivery status with delivery agent details.',
            icon: FiPackage,
        },
        {
            id: 2,
            category: 'shipping',
            title: 'Shipping policies, delivery timelines and fees',
            summary: 'Understand our delivery charges, free delivery thresholds, and standard vs express speeds.',
            content: 'Standard delivery is free on all orders above ₹999. Orders below this threshold carry a minimal delivery fee of ₹49. Express delivery (1-2 business days) is available in metro cities for ₹99.',
            icon: FiTruck,
        },
        {
            id: 3,
            category: 'returns',
            title: 'How does the 7-day hassle-free return policy work?',
            summary: 'Step-by-step guidance on creating a return request and getting your instant refund.',
            content: 'Items can be returned within 7 days of delivery as long as they are unused, with tags intact, and in original packaging. Once picked up and verified, refunds are issued immediately to your original payment method or instant store credits.',
            icon: FiRefreshCw,
        },
        {
            id: 4,
            category: 'payments',
            title: 'Accepted payment methods & 100% secure checkout',
            summary: 'We support UPI, Debit/Credit Cards, Net Banking, EMI, and Cash on Delivery.',
            content: 'All online transactions on Zyvento are encrypted via 256-bit SSL technology. We support all major Indian banks, UPI apps (GPay, PhonePe, Paytm), Visa, Mastercard, RuPay, and American Express.',
            icon: FiCreditCard,
        },
        {
            id: 5,
            category: 'account',
            title: 'How to update password, email, and 2-factor authentication',
            summary: 'Keep your account secure and manage your communication preferences.',
            content: 'Go to Profile > Settings to update your login password, modify notification preferences, or manage your saved delivery addresses. For added security, enable multi-factor login verifications.',
            icon: FiUser,
        },
        {
            id: 6,
            category: 'orders',
            title: 'Can I cancel or modify an order after placing it?',
            summary: 'Orders can be cancelled free of charge before they are handed over to the courier.',
            content: 'You can cancel an order directly from the "Order Details" page while its status is "Pending" or "Processing". If the item has already been dispatched, you may simply reject the delivery at your doorstep for an automatic refund.',
            icon: FiPackage,
        },
    ];

    const filteredArticles = articles.filter((article) => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO SECTION ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiHelpCircle className="text-sm text-indigo-400" />
                        Zyvento Help & Support Center
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        How can we help you today?
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-normal">
                        Search our knowledge base, track shipments, manage returns, or connect directly with our support specialists.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <FiSearch className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Type a question, topic (e.g. tracking, refund, delivery fee)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 sm:pl-14 pr-4 py-4 bg-white/95 backdrop-blur-xl text-slate-900 placeholder-slate-400 rounded-2xl shadow-2xl border border-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:bg-white text-base transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ============ QUICK ACTION CARDS ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {quickActions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                            >
                                <div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white text-xl shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        {action.desc}
                                    </p>
                                </div>
                                <Link
                                    to={action.link}
                                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 mt-5 pt-3 border-t border-slate-100"
                                >
                                    {action.btnText}
                                    <FiChevronRight className="text-sm group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ============ CATEGORY PILLS ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Explore Help Topics</h2>
                        <p className="text-sm text-slate-500">Browse by categories or search specific terms</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className={isActive ? 'text-white' : 'text-slate-500'} />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ============ ARTICLES LIST ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {filteredArticles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredArticles.map((article) => {
                            const Icon = article.icon;
                            const isExpanded = expandedArticle === article.id;
                            return (
                                <div
                                    key={article.id}
                                    className={`bg-white rounded-2xl p-6 border transition-all duration-300 ${
                                        isExpanded
                                            ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-lg'
                                            : 'border-slate-200/80 shadow-sm hover:border-indigo-200 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg flex-shrink-0">
                                            <Icon />
                                        </div>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                            {article.category}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-base mb-2">
                                        {article.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                        {article.summary}
                                    </p>

                                    {isExpanded && (
                                        <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 leading-relaxed bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl mt-4">
                                            <p className="font-medium text-slate-900 mb-1">Detailed Guide:</p>
                                            <p>{article.content}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors mt-2"
                                    >
                                        {isExpanded ? 'Collapse guide' : 'Read full answer'}
                                        <FiChevronRight className={`text-sm transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                            <FiSearch />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No articles matched your search</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            Try adjusting your search terms or reach out directly to our 24/7 help desk.
                        </p>
                        <button
                            onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </section>

            {/* ============ CONTACT CHANNELS ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-indigo-900/40 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="max-w-3xl mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/20">
                            24/7 Priority Support
                        </span>
                        <h2 className="text-3xl font-extrabold mt-3 tracking-tight">
                            Still need assistance with an order or account?
                        </h2>
                        <p className="text-slate-300 text-sm mt-2">
                            Our team of e-commerce specialists is available 24 hours a day to resolve issues quickly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <a
                            href="mailto:support@zyvento.com"
                            className="flex items-center gap-4 p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-2xl group-hover:scale-110 transition-transform">
                                <FiMail />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Email Support</h4>
                                <p className="text-xs text-slate-300 mt-0.5">support@zyvento.com</p>
                                <span className="text-[10px] text-indigo-300 font-semibold mt-1 inline-block">Response within 2 hrs</span>
                            </div>
                        </a>

                        <a
                            href="tel:+919876543210"
                            className="flex items-center gap-4 p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-2xl group-hover:scale-110 transition-transform">
                                <FiPhone />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Toll-Free Helpline</h4>
                                <p className="text-xs text-slate-300 mt-0.5">+91 98765 43210</p>
                                <span className="text-[10px] text-emerald-300 font-semibold mt-1 inline-block">Mon-Sat, 9AM-9PM</span>
                            </div>
                        </a>

                        <Link
                            to="/contact"
                            className="flex items-center gap-4 p-5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 text-2xl group-hover:scale-110 transition-transform">
                                <FiMessageCircle />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Contact Portal</h4>
                                <p className="text-xs text-slate-300 mt-0.5">Submit inquiry ticket</p>
                                <span className="text-[10px] text-sky-300 font-semibold mt-1 inline-block">Direct Escalation</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HelpCenter;
