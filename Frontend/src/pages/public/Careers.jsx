import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiBriefcase,
    FiMapPin,
    FiClock,
    FiDollarSign,
    FiUsers,
    FiAward,
    FiGift,
    FiTrendingUp,
    FiChevronRight,
    FiMail,
    FiSearch,
    FiHeart,
    FiZap,
    FiStar
} from 'react-icons/fi';

const Careers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const departments = [
        { id: 'all', name: 'All Departments' },
        { id: 'engineering', name: 'Engineering' },
        { id: 'design', name: 'Design' },
        { id: 'marketing', name: 'Marketing' },
        { id: 'sales', name: 'Sales' },
        { id: 'hr', name: 'Human Resources' },
    ];

    const jobs = [
        { id: 1, title: 'Senior Full Stack Developer', department: 'Engineering', location: 'Remote', type: 'Full-time', salary: '₹15L – ₹25L', posted: '2 days ago', description: 'Build scalable e-commerce solutions using React, Node.js, and MongoDB.', hot: true },
        { id: 2, title: 'UI/UX Designer', department: 'Design', location: 'Bangalore', type: 'Full-time', salary: '₹10L – ₹18L', posted: '3 days ago', description: 'Design beautiful and intuitive user experiences for millions of customers.', hot: false },
        { id: 3, title: 'Digital Marketing Manager', department: 'Marketing', location: 'Mumbai', type: 'Full-time', salary: '₹12L – ₹20L', posted: '5 days ago', description: 'Drive growth through SEO, social media, and content marketing strategies.', hot: false },
        { id: 4, title: 'Sales Executive', department: 'Sales', location: 'Delhi', type: 'Full-time', salary: '₹6L – ₹12L', posted: '1 week ago', description: 'Build relationships with brands and onboard them to our platform.', hot: false },
        { id: 5, title: 'HR Business Partner', department: 'HR', location: 'Hyderabad', type: 'Full-time', salary: '₹8L – ₹15L', posted: '1 week ago', description: 'Manage talent acquisition, employee engagement, and performance management.', hot: false },
    ];

    const benefits = [
        { icon: FiHeart, title: 'Health & Wellness', description: 'Comprehensive health insurance for you and your family with dental & vision coverage.', color: 'from-rose-600 to-pink-600' },
        { icon: FiTrendingUp, title: 'Growth & Learning', description: '₹1L annual learning budget, conference allowances, and mentorship programs.', color: 'from-blue-600 to-indigo-600' },
        { icon: FiGift, title: 'Flexible Perks', description: 'Remote-first culture, flexible hours, monthly wellness days, and team outings.', color: 'from-emerald-600 to-teal-600' },
        { icon: FiZap, title: 'Equity & ESOPs', description: 'Early employee stock options so you own a piece of what you help build.', color: 'from-amber-600 to-orange-600' },
    ];

    const filteredJobs = jobs.filter((job) => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = selectedDepartment === 'all' || job.department.toLowerCase() === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiUsers className="text-sm text-emerald-400" />
                        We're Hiring — {jobs.length} Open Roles
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5">
                        Build the Future of
                        <span className="block bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Indian E-Commerce
                        </span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
                        Join a mission-driven team creating world-class shopping experiences for millions of customers across India.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <a href="#openings" className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                            View Open Roles <FiChevronRight />
                        </a>
                        <a href="#culture" className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 backdrop-blur-md transition-all">
                            Why Join Zyvento?
                        </a>
                    </div>
                </div>
            </section>

            {/* ============ BENEFITS ============ */}
            <section id="culture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, idx) => {
                        const Icon = benefit.icon;
                        return (
                            <div key={idx} className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${benefit.color} flex items-center justify-center text-white text-2xl shadow-lg mb-5 group-hover:scale-110 transition-transform`}>
                                    <Icon />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{benefit.title}</h3>
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{benefit.description}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ============ JOB OPENINGS ============ */}
            <section id="openings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Open Positions</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">Find Your Dream Role</h2>
                    <p className="text-sm text-slate-500 mt-2">{filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''} available</p>
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search by title, skill, or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all min-w-[180px]"
                    >
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                </div>

                {/* Job Cards */}
                {filteredJobs.length > 0 ? (
                    <div className="space-y-5">
                        {filteredJobs.map((job) => (
                            <div key={job.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {job.title}
                                            </h3>
                                            {job.hot && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-rose-500 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                    <FiStar className="text-[9px]" /> Hot
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xl">{job.description}</p>

                                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                                            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                <FiBriefcase className="text-slate-400 text-sm" /> {job.department}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                <FiMapPin className="text-slate-400 text-sm" /> {job.location}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                <FiClock className="text-slate-400 text-sm" /> {job.type}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                                <FiDollarSign className="text-slate-400 text-sm" /> {job.salary}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2.5 min-w-[130px]">
                                        <span className="text-[11px] text-slate-400 font-medium">{job.posted}</span>
                                        <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                            Apply Now <FiChevronRight className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                            <FiSearch />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No positions matched your search</h3>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or send us your resume directly.</p>
                    </div>
                )}
            </section>

            {/* ============ CTA ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white text-center border border-indigo-900/40 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative max-w-xl mx-auto">
                        <h2 className="text-3xl font-extrabold">Don't see the right role?</h2>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                            Send us your resume and we'll reach out when a suitable position opens up. We're always looking for exceptional talent.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mt-6">
                            <a href="mailto:careers@zyvento.com" className="px-6 py-3.5 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2">
                                <FiMail /> Send Resume
                            </a>
                            <Link to="/contact" className="px-6 py-3.5 bg-white/10 text-white font-bold text-xs rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                                Contact HR Team
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Careers;
