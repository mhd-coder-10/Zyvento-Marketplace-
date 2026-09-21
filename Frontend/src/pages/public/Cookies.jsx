import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiShield,
    FiSettings,
    FiLock,
    FiCheckCircle,
    FiRefreshCw,
    FiMail,
    FiEye,
    FiTarget,
    FiUser,
    FiClock,
    FiSave,
    FiCheck
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const Cookies = () => {
    const [saved, setSaved] = useState(false);
    const [cookiePreferences, setCookiePreferences] = useState({
        necessary: true,
        functional: true,
        analytics: true,
        marketing: false,
    });

    const cookieTypes = [
        {
            id: 'necessary',
            icon: FiLock,
            name: 'Strictly Necessary Cookies',
            description: 'Essential for basic navigation, security, authentication, and shopping cart persistence. These cannot be disabled.',
            required: true,
            color: 'from-blue-600 to-indigo-600'
        },
        {
            id: 'functional',
            icon: FiSettings,
            name: 'Functional & Preferences',
            description: 'Enable enhanced personalization, such as remembering your delivery pincode, currency, and language choices.',
            required: false,
            color: 'from-emerald-600 to-teal-600'
        },
        {
            id: 'analytics',
            icon: FiTarget,
            name: 'Performance & Analytics',
            description: 'Help us measure traffic patterns, bounce rates, and checkout drop-offs to improve overall user interface speed.',
            required: false,
            color: 'from-amber-600 to-orange-600'
        },
        {
            id: 'marketing',
            icon: FiEye,
            name: 'Advertising & Marketing',
            description: 'Used by third-party ad networks to display relevant product deals and prevent repeating the same ad.',
            required: false,
            color: 'from-purple-600 to-pink-600'
        },
    ];

    const handleToggle = (key) => {
        if (key === 'necessary') return;
        setCookiePreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        toast.success('Cookie preferences saved successfully!');
        setTimeout(() => setSaved(false), 3000);
    };

    const handleAcceptAll = () => {
        setCookiePreferences({
            necessary: true,
            functional: true,
            analytics: true,
            marketing: true
        });
        setSaved(true);
        toast.success('All cookies accepted!');
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiShield className="text-sm text-indigo-400" />
                        Cookie Preferences & Policy
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Cookie Policy
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                        Learn how Zyvento uses cookies and tracking technologies to safeguard your experience, enhance site functionality, and personalize shopping.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-400">
                        <FiClock /> Last updated: August 2024
                    </div>
                </div>
            </section>

            {/* ============ PREFERENCE MANAGER ============ */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-900">Custom Cookie Settings</h2>
                            <p className="text-xs text-slate-500 mt-1">Manage your tracking preferences. Changes will be saved locally.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAcceptAll}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
                            >
                                Accept All
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                {saved ? <><FiCheck /> Saved</> : <><FiSave /> Save Choices</>}
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 mt-4">
                        {cookieTypes.map((type) => {
                            const Icon = type.icon;
                            const isChecked = cookiePreferences[type.id];
                            return (
                                <div key={type.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${type.color} text-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
                                            <Icon />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-900">{type.name}</h3>
                                                {type.required && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        Always Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">{type.description}</p>
                                        </div>
                                    </div>
                                    <div className="sm:self-center pl-14 sm:pl-0">
                                        <button
                                            type="button"
                                            disabled={type.required}
                                            onClick={() => handleToggle(type.id)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                isChecked ? 'bg-indigo-600' : 'bg-slate-200'
                                            } ${type.required ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    isChecked ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ============ POLICY DETAILS ============ */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">What are cookies?</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Cookies are compact text files placed onto your computer or mobile smartphone when visiting digital websites. They allow web platforms to remember login credentials, keep items in your cart between sessions, and evaluate site performance metrics.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">How do I control cookies via browser?</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Most modern browsers (Chrome, Safari, Firefox, Edge) permit you to refuse or erase cookies through their internal security settings. Please note that disabling essential cookies may impact checkout functionality:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        {['Google Chrome', 'Apple Safari', 'Mozilla Firefox', 'Microsoft Edge'].map((browser, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                                {browser}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Banner */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 text-white border border-indigo-900/40 text-center">
                    <h3 className="text-xl font-extrabold text-white">Have questions about our cookie policy?</h3>
                    <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
                        Reach out to our Data Privacy Officer anytime for guidance on compliance or your rights.
                    </p>
                    <div className="mt-5 flex justify-center gap-3">
                        <Link
                            to="/privacy-policy"
                            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            to="/contact"
                            className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-slate-100 transition-all"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Cookies;
