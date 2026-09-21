import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiTruck,
    FiClock,
    FiMapPin,
    FiBox,
    FiDollarSign,
    FiCheckCircle,
    FiChevronRight,
    FiShield,
    FiPackage,
    FiSearch
} from 'react-icons/fi';

const Shipping = () => {
    const [pincode, setPincode] = useState('');
    const [checkResult, setCheckResult] = useState(null);
    const [checking, setChecking] = useState(false);

    const shippingTiers = [
        {
            id: 'standard',
            icon: FiTruck,
            name: 'Standard Delivery',
            duration: '3–5 Business Days',
            charge: 'FREE above ₹999 (₹49 otherwise)',
            color: 'from-blue-600 to-indigo-600',
            features: ['Covers 27,000+ Pin Codes', 'Full Real-time Tracking', 'Safe Contactless Handover']
        },
        {
            id: 'express',
            icon: FiClock,
            name: 'Express Superfast',
            duration: '1–2 Business Days',
            charge: 'Flat ₹99',
            color: 'from-indigo-600 to-purple-600',
            features: ['Priority Warehouse Dispatch', 'Metro Cities & Capitals', 'Guaranteed Time Slot']
        },
        {
            id: 'sameday',
            icon: FiBox,
            name: 'Same-Day Prime',
            duration: 'Delivered in 4–8 Hours',
            charge: '₹149',
            color: 'from-amber-600 to-orange-600',
            features: ['Order before 1:00 PM', 'Available in Tier 1 Cities', 'Live Agent GPS Tracking']
        },
    ];

    const shippingRates = [
        { cartValue: 'Under ₹499', standardFee: '₹49', expressFee: '₹99', estimatedTime: '3–5 Days' },
        { cartValue: '₹499 – ₹999', standardFee: '₹49', expressFee: '₹99', estimatedTime: '3–5 Days' },
        { cartValue: 'Above ₹999', standardFee: 'FREE Delivery', expressFee: '₹99', estimatedTime: '2–4 Days' },
        { cartValue: 'Zyvento Prime Members', standardFee: 'FREE Delivery', expressFee: 'FREE Delivery', estimatedTime: '1–2 Days' },
    ];

    const handleCheckPincode = (e) => {
        e.preventDefault();
        if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
            setCheckResult({ success: false, message: 'Please enter a valid 6-digit Indian PIN code.' });
            return;
        }

        setChecking(true);
        setTimeout(() => {
            setChecking(false);
            setCheckResult({
                success: true,
                pincode: pincode,
                standard: 'Estimated 2–3 Days (FREE for orders > ₹999)',
                express: 'Available (Next Day Delivery available)',
                cod: 'Available for this area'
            });
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO SECTION ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiTruck className="text-sm text-indigo-400" />
                        Logistics & Fulfillment Policy
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Fast, Reliable & Pan-India Shipping
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
                        Every package is handled with premier care through our logistics partner network across 27,000+ pin codes.
                    </p>
                </div>
            </section>

            {/* ============ PINCODE CHECKER ============ */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-md">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FiMapPin className="text-indigo-600" />
                                Check Delivery Speed in Your Area
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Enter your 6-digit postal PIN code to see available speeds and Cash on Delivery availability.
                            </p>
                        </div>

                        <form onSubmit={handleCheckPincode} className="flex-1 max-w-sm flex gap-2">
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="Enter 6-digit PIN code"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                            />
                            <button
                                type="submit"
                                disabled={checking}
                                className="px-5 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors disabled:opacity-60 whitespace-nowrap"
                            >
                                {checking ? 'Checking...' : 'Check'}
                            </button>
                        </form>
                    </div>

                    {checkResult && (
                        <div className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed transition-all ${
                            checkResult.success ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                            {checkResult.success ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <FiCheckCircle className="text-emerald-600 text-base flex-shrink-0" />
                                        <span>PIN: {checkResult.pincode} Serviceable</span>
                                    </div>
                                    <div>⚡ Standard: {checkResult.standard}</div>
                                    <div>📦 COD: {checkResult.cod}</div>
                                </div>
                            ) : (
                                <p className="font-medium">{checkResult.message}</p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ============ SHIPPING TIERS ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Delivery Speeds & Options</h2>
                    <p className="text-sm text-slate-500 mt-2">Choose the delivery speed tailored to your schedule</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {shippingTiers.map((tier) => {
                        const Icon = tier.icon;
                        return (
                            <div
                                key={tier.id}
                                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${tier.color} flex items-center justify-center text-white text-2xl shadow-lg mb-6`}>
                                        <Icon />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-2">
                                        <FiClock className="text-xs" />
                                        {tier.duration}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800 mt-4">
                                        {tier.charge}
                                    </p>

                                    <ul className="space-y-2.5 mt-6 border-t border-slate-100 pt-6">
                                        {tier.features.map((feat, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                                <FiCheckCircle className="text-emerald-500 flex-shrink-0 text-sm" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ============ RATES MATRIX TABLE ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Shipping Rates Breakdown</h3>
                        <p className="text-xs text-slate-500 mt-1">Clear and upfront pricing with no hidden charges at checkout</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-4 px-6 rounded-l-xl">Order Cart Value</th>
                                    <th className="py-4 px-6">Standard Shipping</th>
                                    <th className="py-4 px-6">Express Shipping</th>
                                    <th className="py-4 px-6 rounded-r-xl">Est. Delivery Window</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {shippingRates.map((rate, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-900">{rate.cartValue}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                rate.standardFee.includes('FREE') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {rate.standardFee}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-medium text-slate-800">{rate.expressFee}</td>
                                        <td className="py-4 px-6 text-slate-500 font-medium">{rate.estimatedTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ============ PACKAGING & GUARANTEES ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
                            <FiShield />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Secure Packaging</h4>
                            <p className="text-xs text-slate-500 mt-1">Multi-layer tamper-evident box & bubble insulation.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0">
                            <FiTruck />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">27,000+ PIN Codes</h4>
                            <p className="text-xs text-slate-500 mt-1">Deep nationwide coverage including remote regions.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
                            <FiPackage />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">Live GPS Tracking</h4>
                            <p className="text-xs text-slate-500 mt-1">Milestone status alerts via SMS, WhatsApp & Email.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl flex-shrink-0">
                            <FiClock />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">On-Time Guarantee</h4>
                            <p className="text-xs text-slate-500 mt-1">Guaranteed delivery or shipping cost reimbursed.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Shipping;
