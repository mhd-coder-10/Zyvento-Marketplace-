import React from 'react';
import { Link } from 'react-router-dom';
import {
    FiRefreshCw,
    FiClock,
    FiShield,
    FiCheckCircle,
    FiXCircle,
    FiArrowRight,
    FiChevronRight,
    FiMail,
    FiPhone,
    FiPackage,
    FiDollarSign,
    FiCreditCard
} from 'react-icons/fi';

const ReturnsRefunds = () => {
    const returnSteps = [
        {
            step: '01',
            title: 'Initiate in My Orders',
            description: 'Navigate to "My Orders", choose the item and select your reason for return or replacement.',
            icon: FiPackage,
        },
        {
            step: '02',
            title: 'Doorstep Pickup',
            description: 'Our courier agent visits your address for a quick condition check and collects the item free of charge.',
            icon: FiRefreshCw,
        },
        {
            step: '03',
            title: 'Instant Quality Check',
            description: 'The item is validated at our return hub to ensure tags, serial numbers, and packaging match.',
            icon: FiShield,
        },
        {
            step: '04',
            title: 'Instant Refund Dispatched',
            description: 'Refund is immediately issued to your original payment method or instant Zyvento Store Credits.',
            icon: FiDollarSign,
        },
    ];

    const returnConditions = [
        { condition: 'Return Window', detail: '7 Days from date of delivery', status: 'eligible' },
        { condition: 'Item Condition', detail: 'Unused, unwashed, with tags & original packaging intact', status: 'eligible' },
        { condition: 'Pickup Fee', detail: '100% FREE for all eligible return requests', status: 'eligible' },
        { condition: 'Replacement Options', detail: 'Available for size, color or damaged in transit items', status: 'eligible' },
        { condition: 'Non-Returnable Items', detail: 'Innerwear, personal grooming, perishable goods, gift cards', status: 'ineligible' },
    ];

    const refundChannels = [
        {
            channel: 'Zyvento Store Credits / Wallet',
            timeline: 'Instant (Under 15 Mins)',
            note: 'Can be used immediately on any future order with no expiration',
            icon: FiRefreshCw,
            badge: 'Fastest'
        },
        {
            channel: 'UPI (GPay / PhonePe / Paytm)',
            timeline: '2 to 4 Hours',
            note: 'Direct credit to the bank account linked with your UPI ID',
            icon: FiDollarSign,
            badge: 'Instant'
        },
        {
            channel: 'Credit / Debit Cards & Net Banking',
            timeline: '2 to 4 Banking Days',
            note: 'Reversed directly to your card issuer bank statement',
            icon: FiCreditCard,
            badge: 'Standard'
        },
        {
            channel: 'Cash on Delivery (COD) Orders',
            timeline: 'Within 24 Hours',
            note: 'Transferred via IMPS/UPI upon providing your account details',
            icon: FiClock,
            badge: 'Direct IMPS'
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO SECTION ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiRefreshCw className="text-sm text-indigo-400" />
                        7-Day Hassle-Free Policy
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Returns, Replacements & Refunds
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
                        Not 100% in love with your purchase? We make returns and instant refunds seamless, simple, and stress-free.
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link
                            to="/orders"
                            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
                        >
                            <FiPackage />
                            Go to My Orders to Return
                        </Link>
                        <Link
                            to="/contact"
                            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 backdrop-blur-md transition-all"
                        >
                            Talk to Returns Team
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============ HOW IT WORKS TIMELINE ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How Returns Work in 4 Steps</h2>
                        <p className="text-xs text-slate-500 mt-2">Smooth, transparent, and completely digital</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                        {returnSteps.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 relative flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-200">
                                                <Icon />
                                            </div>
                                            <span className="text-2xl font-black text-slate-300 font-mono">
                                                {step.step}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-base mb-2">{step.title}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ============ CONDITIONS & ELIGIBILITY ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Conditions Table */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Return Eligibility Conditions</h3>
                            <p className="text-xs text-slate-500 mt-1">Please ensure your item qualifies before initiating a pickup</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {returnConditions.map((item, index) => (
                                <div key={index} className="py-4 flex items-start justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            {item.status === 'eligible' ? (
                                                <FiCheckCircle className="text-emerald-600 text-base flex-shrink-0" />
                                            ) : (
                                                <FiXCircle className="text-rose-500 text-base flex-shrink-0" />
                                            )}
                                            {item.condition}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 pl-6">{item.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Guarantees Box */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/40">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 text-2xl mb-4">
                                <FiShield />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">100% Money-Back Guarantee</h3>
                            <p className="text-xs text-slate-300 leading-relaxed mb-4">
                                If you receive a wrong, defective, or physically damaged item, Zyvento covers full return courier charges and expedites immediate replacement or 100% money refund.
                            </p>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-indigo-200">
                                💡 Tip: Record an unboxing video for high-value electronics for instant dispute clearance.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ REFUND CHANNELS & TIMELINE ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Refund Methods & Timelines</h2>
                    <p className="text-xs text-slate-500 mt-2">Where and when you will receive your refunded money</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {refundChannels.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                                            <Icon />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                                            {item.badge}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm">{item.channel}</h4>
                                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-2">
                                        <FiClock className="text-xs" />
                                        {item.timeline}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.note}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default ReturnsRefunds;
