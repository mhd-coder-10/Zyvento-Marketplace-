import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiFileText,
    FiUserCheck,
    FiCreditCard,
    FiTruck,
    FiRefreshCw,
    FiShield,
    FiAlertTriangle,
    FiMail,
    FiClock,
    FiChevronRight,
    FiCheckCircle
} from 'react-icons/fi';

const TermsConditions = () => {
    const [activeSection, setActiveSection] = useState('acceptance');

    const sections = [
        { id: 'acceptance', icon: FiCheckCircle, title: 'Acceptance of Terms' },
        { id: 'account', icon: FiUserCheck, title: 'User Account' },
        { id: 'orders', icon: FiCreditCard, title: 'Orders & Payments' },
        { id: 'shipping', icon: FiTruck, title: 'Shipping & Delivery' },
        { id: 'returns', icon: FiRefreshCw, title: 'Returns & Refunds' },
        { id: 'intellectual', icon: FiShield, title: 'Intellectual Property' },
        { id: 'liability', icon: FiAlertTriangle, title: 'Limitation of Liability' },
        { id: 'contact', icon: FiMail, title: 'Contact Legal' },
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
        );
        sections.forEach((sec) => {
            const el = document.getElementById(sec.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiFileText className="text-sm text-indigo-400" />
                        Legal Agreement
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Terms & Conditions
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                        Please review these terms carefully before accessing or using the Zyvento multi-vendor marketplace platform.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-400">
                        <FiClock /> Last updated: August 15, 2024
                    </div>
                </div>
            </section>

            {/* ============ CONTENT ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-3">
                        <nav className="sticky top-24 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-3">Sections</p>
                            {sections.map((sec) => {
                                const Icon = sec.icon;
                                const isActive = activeSection === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        onClick={() => scrollTo(sec.id)}
                                        className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold'
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon className={`text-sm flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        {sec.title}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9 space-y-8">
                        {/* 1. Acceptance */}
                        <div id="acceptance" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg"><FiCheckCircle /></div>
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                Welcome to Zyvento. By accessing, browsing, registering for, or transacting on our website or mobile application, you acknowledge that you have read, understood, and unconditionally agree to be bound by these Terms and Conditions and our Privacy Policy.
                            </p>
                            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                If you do not accept these terms in their entirety, you must discontinue using our services immediately. We reserve the right to revise or modify these terms at our sole discretion, and continued usage signifies acceptance of updated guidelines.
                            </p>
                        </div>

                        {/* 2. Account */}
                        <div id="account" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg"><FiUserCheck /></div>
                                2. User Account & Eligibility
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                To access select features, including placing orders or selling merchandise, you must create a Zyvento user account. You represent and warrant that:
                            </p>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                {[
                                    'You are at least 18 years of age or accessing under the supervision of a parent or legal guardian.',
                                    'All registration information provided is accurate, current, and complete.',
                                    'You will safeguard your account login credentials and remain responsible for any activity executed under your login.',
                                    'You will promptly notify Zyvento customer support of any unauthorized account access or security breaches.',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <FiChevronRight className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. Orders & Payments */}
                        <div id="orders" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg"><FiCreditCard /></div>
                                3. Orders, Pricing & Payments
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                Zyvento is a marketplace facilitating transactions between independent sellers and buyers. While we strive for absolute accuracy, inadvertent typographical errors regarding catalog pricing or inventory availability may occur.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-900">Order Acceptance</h4>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Receipt of an order confirmation does not constitute our final acceptance; we reserve the right to cancel orders suspected of fraud.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-900">Secure Payments</h4>
                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Transactions are processed via RBI-compliant, 256-bit encrypted payment gateways supporting UPI, Cards, Net Banking, and COD.</p>
                                </div>
                            </div>
                        </div>

                        {/* 4. Shipping */}
                        <div id="shipping" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg"><FiTruck /></div>
                                4. Shipping & Delivery
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                Deliveries are carried out via certified logistics partners (BlueDart, Delhivery, etc.). Shipping timelines are estimates and subject to factors beyond direct control, such as severe weather, regional festivals, or logistics disruptions. Refer to our <Link to="/shipping" className="text-indigo-600 font-semibold hover:underline">Shipping Policy</Link> for detailed tier breakdowns.
                            </p>
                        </div>

                        {/* 5. Returns */}
                        <div id="returns" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg"><FiRefreshCw /></div>
                                5. Returns, Replacements & Refunds
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                Eligible products can be returned within 7 to 10 days of delivery depending on category specifics. Returned items must remain in their original, undamaged packaging with all tags, accessories, and warranty cards intact. Complete policies are available under <Link to="/returns-refunds" className="text-indigo-600 font-semibold hover:underline">Returns & Refunds</Link>.
                            </p>
                        </div>

                        {/* 6. Intellectual Property */}
                        <div id="intellectual" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg"><FiShield /></div>
                                6. Intellectual Property
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                All trademarks, logos, brand names, visual interfaces, graphics, code, and editorial content on Zyvento are the exclusive property of Zyvento Technologies or its authorized licensors. Any unauthorized copying, distribution, scraping, or commercial exploitation is strictly prohibited without prior written consent.
                            </p>
                        </div>

                        {/* 7. Limitation of Liability */}
                        <div id="liability" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg"><FiAlertTriangle /></div>
                                7. Limitation of Liability
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                Under no circumstances shall Zyvento, its founders, affiliates, or employees be liable for any indirect, consequential, punitive, or incidental damages arising out of your inability to access or utilize the services or goods purchased on the platform.
                            </p>
                        </div>

                        {/* 8. Contact */}
                        <div id="contact" className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 text-white border border-indigo-900/40 scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 text-indigo-300 flex items-center justify-center text-lg backdrop-blur-md"><FiMail /></div>
                                Contact Legal Counsel
                            </h2>
                            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                                For inquiries concerning these terms, notices of intellectual property infringement, or formal legal disputes:
                            </p>
                            <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-sm text-slate-200">
                                <strong>Legal Department:</strong> legal@zyvento.com
                            </div>
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 mt-5 px-5 py-3 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all"
                            >
                                Contact Customer Support <FiChevronRight />
                            </Link>
                        </div>
                    </main>
                </div>
            </section>
        </div>
    );
};

export default TermsConditions;
