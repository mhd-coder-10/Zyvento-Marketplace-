import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiMail,
    FiPhone,
    FiMapPin,
    FiClock,
    FiSend,
    FiCheckCircle,
    FiMessageSquare,
    FiHelpCircle,
    FiShield,
    FiUser,
    FiChevronRight
} from 'react-icons/fi';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        topic: 'Order & Delivery Issue',
        subject: '',
        message: '',
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const topics = [
        'Order & Delivery Issue',
        'Returns & Refunds',
        'Payments & Invoicing',
        'Seller / Partnership Inquiry',
        'Technical Feedback / Bug Report',
        'Other Inquiry'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name?.trim()) newErrors.name = 'Full name is required';
        if (!formData.email?.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please provide a valid email';
        }
        if (!formData.subject?.trim()) newErrors.subject = 'Subject is required';
        if (!formData.message?.trim() || formData.message.trim().length < 10) {
            newErrors.message = 'Please provide a message with at least 10 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);

        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            toast.success('Your message has been received! Our support agent will respond within 2-4 hours.');
            setFormData({
                name: '',
                email: '',
                phone: '',
                topic: 'Order & Delivery Issue',
                subject: '',
                message: '',
            });
        }, 1200);
    };

    const contactChannels = [
        {
            icon: FiMail,
            title: 'Email Us',
            primary: 'support@zyvento.com',
            secondary: 'Typical reply in under 2 hours',
            color: 'from-blue-600 to-indigo-600',
            action: 'mailto:support@zyvento.com'
        },
        {
            icon: FiPhone,
            title: 'Customer Helpline',
            primary: '+91 (080) 4567-8900',
            secondary: 'Mon-Sat: 9:00 AM – 9:00 PM IST',
            color: 'from-emerald-600 to-teal-600',
            action: 'tel:+9108045678900'
        },
        {
            icon: FiMapPin,
            title: 'Corporate HQ',
            primary: 'Zyvento Technologies Pvt Ltd',
            secondary: 'Cyber Hub Tech Park, Outer Ring Rd, Bangalore 560103',
            color: 'from-purple-600 to-pink-600',
            action: null
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO SECTION ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiMessageSquare className="text-sm text-indigo-400" />
                        We're Here For You
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Get in Touch with Zyvento
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
                        Have a question about an order, seller onboarding, or technical feedback? Send us a message and our team will get back to you promptly.
                    </p>
                </div>
            </section>

            {/* ============ CHANNEL CARDS ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {contactChannels.map((chan, idx) => {
                        const Icon = chan.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 flex items-start gap-4"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${chan.color} flex items-center justify-center text-white text-xl shadow-md flex-shrink-0`}>
                                    <Icon />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{chan.title}</h3>
                                    <p className="text-base font-semibold text-slate-800 mt-1">{chan.primary}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{chan.secondary}</p>
                                    {chan.action && (
                                        <a
                                            href={chan.action}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2.5"
                                        >
                                            Connect Now
                                            <FiChevronRight className="text-xs" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* ============ FORM & SIDEBAR SECTION ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left 7 Cols: Ticket Form */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10">
                        <div className="mb-6">
                            <h2 className="text-2xl font-extrabold text-slate-900">Send an Inquiry Ticket</h2>
                            <p className="text-sm text-slate-500 mt-1">Fill out the details below and we will route it to the right department.</p>
                        </div>

                        {submitted ? (
                            <div className="text-center py-12 bg-indigo-50/50 rounded-2xl border border-indigo-100 p-8">
                                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-indigo-200 mb-4">
                                    <FiCheckCircle />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
                                <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                                    Thank you for reaching out. Ticket ID <span className="font-mono font-bold text-indigo-600">#ZYV-{Math.floor(100000 + Math.random() * 900000)}</span> has been generated. You will receive an email confirmation shortly.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-6 px-6 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                                >
                                    Send Another Inquiry
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Your Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. John Sharma"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                                                errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                                            }`}
                                        />
                                        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@example.com"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                                                errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                                            }`}
                                        />
                                        {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Phone Number (Optional)
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                            Topic / Category
                                        </label>
                                        <select
                                            name="topic"
                                            value={formData.topic}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        >
                                            {topics.map((t, idx) => (
                                                <option key={idx} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Brief summary of your inquiry"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                                            errors.subject ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                                        }`}
                                    />
                                    {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Your Message *
                                    </label>
                                    <textarea
                                        name="message"
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Please provide full details including order number if applicable..."
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                                            errors.message ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                                        }`}
                                    />
                                    {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting Message...
                                        </>
                                    ) : (
                                        <>
                                            <FiSend className="text-base" />
                                            Send Message Now
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Right 5 Cols: Quick Answers & Info */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* FAQ card */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg">
                                    <FiHelpCircle />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">Instant FAQ Answers</h3>
                                    <p className="text-xs text-slate-500">Most questions are resolved immediately</p>
                                </div>
                            </div>

                            <div className="space-y-3 divide-y divide-slate-100">
                                <div className="pt-3">
                                    <p className="text-xs font-bold text-slate-800">Where is my order?</p>
                                    <p className="text-xs text-slate-500 mt-1">Use our live tracker tool with your Order ID for real-time status.</p>
                                    <Link to="/order-tracking" className="text-xs font-semibold text-indigo-600 hover:underline mt-1 inline-block">Track Order →</Link>
                                </div>
                                <div className="pt-3">
                                    <p className="text-xs font-bold text-slate-800">How to request a refund?</p>
                                    <p className="text-xs text-slate-500 mt-1">Go to My Orders and select Return Item within 7 days of delivery.</p>
                                    <Link to="/returns-refunds" className="text-xs font-semibold text-indigo-600 hover:underline mt-1 inline-block">Return Policy →</Link>
                                </div>
                                <div className="pt-3">
                                    <p className="text-xs font-bold text-slate-800">Want to sell on Zyvento?</p>
                                    <p className="text-xs text-slate-500 mt-1">Join over 10,000+ businesses growing on our multi-vendor marketplace.</p>
                                    <Link to="/become-seller" className="text-xs font-semibold text-indigo-600 hover:underline mt-1 inline-block">Become a Seller →</Link>
                                </div>
                            </div>
                        </div>

                        {/* Security Promise */}
                        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/40">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 text-lg">
                                    <FiShield />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">100% Buyer Protection</h3>
                                    <p className="text-xs text-indigo-300">Safe & encrypted communication</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Your personal details, payment receipts, and communications are safeguarded according to Indian Information Technology (IT) guidelines and standard 256-bit encryption.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
