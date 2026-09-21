import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiShield,
    FiEye,
    FiDatabase,
    FiLock,
    FiShare2,
    FiSettings,
    FiMail,
    FiChevronRight,
    FiAlertCircle,
    FiClock
} from 'react-icons/fi';

const PrivacyPolicy = () => {
    const [activeSection, setActiveSection] = useState('overview');

    const sections = [
        { id: 'overview', icon: FiEye, title: 'Overview' },
        { id: 'collection', icon: FiDatabase, title: 'Data We Collect' },
        { id: 'usage', icon: FiSettings, title: 'How We Use Data' },
        { id: 'sharing', icon: FiShare2, title: 'Data Sharing' },
        { id: 'security', icon: FiLock, title: 'Data Security' },
        { id: 'cookies', icon: FiSettings, title: 'Cookies' },
        { id: 'rights', icon: FiShield, title: 'Your Rights' },
        { id: 'contact', icon: FiMail, title: 'Contact Us' },
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
                        <FiShield className="text-sm text-indigo-400" />
                        Privacy Policy
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Your Privacy Matters
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                        We are committed to protecting your personal information and being transparent about how we collect, use, and safeguard it.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-400">
                        <FiClock /> Last updated: August 1, 2024
                    </div>
                </div>
            </section>

            {/* ============ CONTENT ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <aside className="lg:col-span-3">
                        <nav className="sticky top-24 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-3">Table of Contents</p>
                            {sections.map((sec) => {
                                const Icon = sec.icon;
                                const isActive = activeSection === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        onClick={() => scrollTo(sec.id)}
                                        className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
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
                        {/* Overview */}
                        <div id="overview" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg"><FiEye /></div>
                                Overview
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                This Privacy Policy describes how Zyvento ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our e-commerce platform, mobile applications, and related services (collectively, the "Services").
                            </p>
                            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                By accessing or using our Services, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of our Services.
                            </p>
                        </div>

                        {/* Data We Collect */}
                        <div id="collection" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg"><FiDatabase /></div>
                                Data We Collect
                            </h2>
                            <div className="mt-5 space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-900">Personal Information</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Name, email address, phone number, shipping/billing addresses, and payment details provided during registration or checkout.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-900">Transaction Data</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Purchase history, order details, payment confirmations, refund records, and wishlist/cart contents.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-900">Usage & Device Data</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">IP address, browser type, device identifiers, operating system, pages visited, click patterns, and session duration.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-900">Cookies & Tracking</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">We use cookies, pixels, and similar technologies to enhance your experience and analyze site traffic. See our <Link to="/cookies" className="text-indigo-600 font-semibold hover:underline">Cookie Policy</Link>.</p>
                                </div>
                            </div>
                        </div>

                        {/* How We Use Data */}
                        <div id="usage" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg"><FiSettings /></div>
                                How We Use Your Data
                            </h2>
                            <ul className="mt-5 space-y-3 text-sm text-slate-600">
                                {[
                                    'Process and fulfill your orders, including shipping and payment verification',
                                    'Personalize your shopping experience with relevant product recommendations',
                                    'Communicate order updates, delivery notifications, and promotional offers',
                                    'Improve our platform, debug issues, and develop new features',
                                    'Prevent fraud, unauthorized access, and other malicious activities',
                                    'Comply with legal obligations and enforce our Terms of Service',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <FiChevronRight className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Data Sharing */}
                        <div id="sharing" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg"><FiShare2 /></div>
                                Data Sharing & Disclosure
                            </h2>
                            <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                                <FiAlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    <strong>We never sell your personal data.</strong> We only share your information in the limited circumstances described below.
                                </p>
                            </div>
                            <ul className="mt-4 space-y-3 text-sm text-slate-600">
                                {[
                                    'Sellers: Necessary order details (name, address) to fulfill your purchase.',
                                    'Payment Processors: Secure payment gateways (Razorpay, Stripe) for transaction processing.',
                                    'Logistics Partners: Shipping address and contact info for package delivery.',
                                    'Legal Authorities: When required by law, court order, or to protect rights and safety.',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <FiChevronRight className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Data Security */}
                        <div id="security" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg"><FiLock /></div>
                                Data Security
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                We implement industry-standard security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                                {[
                                    { title: 'SSL/TLS Encryption', desc: 'All data transmitted between your browser and our servers is encrypted with 256-bit SSL.' },
                                    { title: 'PCI DSS Compliance', desc: 'Payment processing follows Payment Card Industry Data Security Standards.' },
                                    { title: 'Regular Audits', desc: 'Our systems undergo regular security audits and vulnerability assessments.' },
                                    { title: 'Access Controls', desc: 'Only authorized personnel with a need-to-know basis can access your data.' },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cookies */}
                        <div id="cookies" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg"><FiSettings /></div>
                                Cookies
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                We use cookies and similar technologies to remember your preferences, analyze traffic, and deliver personalized content. You can manage your cookie preferences through your browser settings or our dedicated cookie management page.
                            </p>
                            <Link to="/cookies" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors">
                                Manage Cookie Preferences <FiChevronRight />
                            </Link>
                        </div>

                        {/* Your Rights */}
                        <div id="rights" className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg"><FiShield /></div>
                                Your Rights
                            </h2>
                            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                                Depending on your jurisdiction, you may have the following rights regarding your personal data:
                            </p>
                            <div className="mt-5 space-y-3">
                                {[
                                    { title: 'Right to Access', desc: 'Request a copy of the personal data we hold about you.' },
                                    { title: 'Right to Correction', desc: 'Ask us to correct inaccurate or incomplete personal data.' },
                                    { title: 'Right to Deletion', desc: 'Request that we delete your personal data (subject to legal obligations).' },
                                    { title: 'Right to Opt-Out', desc: 'Unsubscribe from marketing communications at any time.' },
                                    { title: 'Right to Portability', desc: 'Receive your data in a structured, machine-readable format.' },
                                ].map((right, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <FiChevronRight className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">{right.title}</h4>
                                            <p className="text-[11px] text-slate-500 leading-relaxed">{right.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact */}
                        <div id="contact" className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 text-white border border-indigo-900/40 scroll-mt-24">
                            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 text-indigo-300 flex items-center justify-center text-lg backdrop-blur-md"><FiMail /></div>
                                Contact Us
                            </h2>
                            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                                For questions, concerns, or requests regarding this Privacy Policy or your personal data, reach out to our Privacy Team:
                            </p>
                            <div className="mt-5 space-y-3">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <FiMail className="text-indigo-300" />
                                    <span className="text-sm text-slate-200">privacy@zyvento.com</span>
                                </div>
                            </div>
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 mt-5 px-5 py-3 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all"
                            >
                                Contact Support <FiChevronRight />
                            </Link>
                        </div>
                    </main>
                </div>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
