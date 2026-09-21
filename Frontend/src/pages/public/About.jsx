import React from 'react';
import { Link } from 'react-router-dom';
import {
    FiTarget,
    FiHeart,
    FiZap,
    FiShield,
    FiUsers,
    FiTrendingUp,
    FiGlobe,
    FiAward,
    FiPackage,
    FiChevronRight,
    FiStar
} from 'react-icons/fi';

const About = () => {
    const values = [
        { icon: FiHeart, title: 'Customer First', description: 'Every decision starts with our customers. Their trust, satisfaction, and delight drive everything we build.', color: 'from-rose-600 to-pink-600' },
        { icon: FiShield, title: 'Uncompromising Quality', description: 'We verify every seller and inspect product listings to ensure only genuine, high-quality goods reach you.', color: 'from-blue-600 to-indigo-600' },
        { icon: FiZap, title: 'Relentless Innovation', description: 'From AI-powered search to lightning-fast logistics, we invest in technology to make shopping effortless.', color: 'from-amber-600 to-orange-600' },
        { icon: FiGlobe, title: 'Empowering Sellers', description: 'We help local businesses and entrepreneurs reach millions of customers with zero upfront costs.', color: 'from-emerald-600 to-teal-600' },
    ];

    const stats = [
        { number: '50K+', label: 'Products Listed', icon: FiPackage },
        { number: '10K+', label: 'Verified Sellers', icon: FiUsers },
        { number: '27K+', label: 'PIN Codes Served', icon: FiGlobe },
        { number: '99.2%', label: 'On-Time Delivery', icon: FiTrendingUp },
    ];

    const team = [
        { name: 'Arjun Mehta', role: 'Founder & CEO', desc: 'Former product lead at Flipkart with 12+ years in e-commerce tech.', emoji: '👨‍💼' },
        { name: 'Priya Sharma', role: 'CTO', desc: 'Full-stack architect who built scalable platforms serving 10M+ users.', emoji: '👩‍💻' },
        { name: 'Rahul Verma', role: 'Head of Operations', desc: 'Logistics expert optimizing last-mile delivery across India.', emoji: '📦' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiStar className="text-sm text-indigo-400" />
                        Our Story
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5">
                        Building India's Most
                        <span className="block bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Trusted Marketplace
                        </span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
                        Zyvento connects millions of buyers with verified sellers offering authentic products, fast delivery, and hassle-free returns — all backed by cutting-edge technology.
                    </p>
                </div>
            </section>

            {/* ============ STATS BAR ============ */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {stats.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div key={idx} className="text-center">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mx-auto mb-3">
                                        <Icon />
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-slate-900">{stat.number}</p>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{stat.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ============ STORY SECTION ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Our Origin</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 leading-tight">
                            From a Garage Idea to a National Platform
                        </h2>
                        <p className="text-sm text-slate-600 mt-4 leading-relaxed">
                            Founded in 2024, Zyvento started with a straightforward mission: make online shopping easy, affordable, and trustworthy for every Indian household. We believed that technology could bridge the gap between local artisans, SMB sellers, and customers across the country.
                        </p>
                        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                            Today, we serve thousands of happy customers daily through our curated multi-vendor marketplace — offering everything from electronics and fashion to home essentials with express delivery in 27,000+ PIN codes.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-6">
                            <Link
                                to="/products"
                                className="px-5 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                Explore Products <FiChevronRight />
                            </Link>
                            <Link
                                to="/become-seller"
                                className="px-5 py-3 bg-white text-slate-900 font-bold text-xs rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                            >
                                Become a Seller
                            </Link>
                        </div>
                    </div>

                    {/* Mission & Vision Cards */}
                    <div className="space-y-5">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl mb-4">
                                <FiTarget />
                            </div>
                            <h3 className="text-xl font-extrabold">Our Mission</h3>
                            <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
                                To democratize e-commerce in India by empowering every seller — from local businesses to national brands — with world-class digital tools, logistics, and customer reach.
                            </p>
                        </div>
                        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4">
                                <FiTrendingUp />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900">Our Vision</h3>
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                Become India's most customer-centric marketplace — where every product is authentic, every delivery is on time, and every return is hassle-free.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ VALUES ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Core Principles</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">Values That Guide Us</h2>
                    <p className="text-sm text-slate-500 mt-2">These pillars shape every product we ship and every partnership we build.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {values.map((value, idx) => {
                        const Icon = value.icon;
                        return (
                            <div key={idx} className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${value.color} flex items-center justify-center text-white text-2xl shadow-lg mb-5 group-hover:scale-110 transition-transform`}>
                                    <Icon />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{value.title}</h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{value.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ============ LEADERSHIP TEAM ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Leadership</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">Meet the People Behind Zyvento</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {team.map((member, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all text-center group">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-4xl mx-auto mb-5 group-hover:scale-110 transition-transform shadow-sm">
                                {member.emoji}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-1">{member.role}</p>
                            <p className="text-xs text-slate-500 mt-3 leading-relaxed">{member.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ JOIN CTA ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white text-center border border-indigo-900/40 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative max-w-xl mx-auto">
                        <h2 className="text-3xl font-extrabold text-white">Want to Join Our Team?</h2>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            We're always looking for passionate people who want to shape the future of Indian e-commerce.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mt-6">
                            <Link
                                to="/careers"
                                className="px-6 py-3.5 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2"
                            >
                                <FiAward /> View Open Positions
                            </Link>
                            <Link
                                to="/contact"
                                className="px-6 py-3.5 bg-white/10 text-white font-bold text-xs rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
