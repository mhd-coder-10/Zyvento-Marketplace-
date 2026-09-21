import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiSearch,
    FiChevronDown,
    FiHelpCircle,
    FiPackage,
    FiTruck,
    FiRefreshCw,
    FiCreditCard,
    FiUser,
    FiThumbsUp,
    FiThumbsDown,
    FiMessageSquare
} from 'react-icons/fi';
import { toast } from 'react-toastify';

const FAQs = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [openQuestions, setOpenQuestions] = useState([1]);
    const [feedbackGiven, setFeedbackGiven] = useState({});

    const categories = [
        { id: 'all', name: 'All Questions', icon: FiHelpCircle },
        { id: 'ordering', name: 'Ordering & Account', icon: FiPackage },
        { id: 'shipping', name: 'Shipping & Delivery', icon: FiTruck },
        { id: 'returns', name: 'Returns & Refunds', icon: FiRefreshCw },
        { id: 'payments', name: 'Payments & Offers', icon: FiCreditCard },
        { id: 'sellers', name: 'Selling on Zyvento', icon: FiUser },
    ];

    const faqs = [
        {
            id: 1,
            category: 'ordering',
            question: 'How do I place an order on Zyvento?',
            answer: 'Shopping on Zyvento is easy! Browse our marketplace or search for items. Select color/size options if applicable, click "Add to Cart", then proceed to checkout. Enter your shipping address and complete payment securely via UPI, Card, Net Banking or COD.'
        },
        {
            id: 2,
            category: 'ordering',
            question: 'Can I cancel my order after it has been placed?',
            answer: 'Yes, you can cancel your order directly from "My Orders" as long as the status is "Pending" or "Processing". If the item has already shipped, you can simply refuse the delivery when the courier arrives for an instant refund.'
        },
        {
            id: 3,
            category: 'shipping',
            question: 'What are the delivery charges and delivery times?',
            answer: 'We provide FREE standard delivery on all orders above ₹999 across India. For orders below ₹999, a flat shipping fee of ₹49 applies. Standard delivery takes 3-5 business days, while Express delivery (metro areas) delivers in 1-2 days.'
        },
        {
            id: 4,
            category: 'shipping',
            question: 'How do I track my package in real-time?',
            answer: 'Go to the "Track Order" page from the footer or click "Track Package" in your Orders tab. You will see real-time milestone tracking including dispatch, courier carrier details, transit hubs, and out-for-delivery alerts.'
        },
        {
            id: 5,
            category: 'returns',
            question: 'What is Zyvento\'s 7-Day Return Policy?',
            answer: 'Most products on Zyvento can be returned or exchanged within 7 days of delivery. Items must be unused, in their original condition, with original packaging, tags, and invoice intact. Return pickup is completely free.'
        },
        {
            id: 6,
            category: 'returns',
            question: 'How long does it take to receive my refund?',
            answer: 'Once our courier partner inspects and picks up the item, your refund is processed immediately. UPI and Store Credit refunds reflect within 2-4 hours, while Credit/Debit Card and Net Banking refunds take 2-4 banking days depending on your bank.'
        },
        {
            id: 7,
            category: 'payments',
            question: 'Which payment methods are accepted?',
            answer: 'We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay, Amex), Net Banking across 50+ Indian banks, Wallets, and Cash on Delivery (COD) on eligible pin codes.'
        },
        {
            id: 8,
            category: 'payments',
            question: 'Is my credit card & financial information safe?',
            answer: 'Absolutely. Zyvento uses 256-bit SSL bank-grade encryption and PCI-DSS Level 1 compliant payment gateways. We do not store your CVV or card PINs on our servers.'
        },
        {
            id: 9,
            category: 'sellers',
            question: 'How do I become a verified seller on Zyvento?',
            answer: 'Click on "Become a Seller" in the header or profile menu. Submit your business name, GSTIN (if applicable), PAN, and bank account details. Our vendor verification team approves accounts within 24-48 hours.'
        },
        {
            id: 10,
            category: 'ordering',
            question: 'How do I reset or change my account password?',
            answer: 'Click on the Login button, then select "Forgot Password". Enter your registered email address to receive a secure password reset link.'
        },
    ];

    const toggleQuestion = (id) => {
        setOpenQuestions((prev) =>
            prev.includes(id)
                ? prev.filter((q) => q !== id)
                : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (openQuestions.length === filteredFaqs.length) {
            setOpenQuestions([]);
        } else {
            setOpenQuestions(filteredFaqs.map((faq) => faq.id));
        }
    };

    const handleFeedback = (faqId, isHelpful) => {
        setFeedbackGiven((prev) => ({ ...prev, [faqId]: isHelpful ? 'yes' : 'no' }));
        toast.info('Thank you for your feedback!');
    };

    const filteredFaqs = faqs.filter((faq) => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO SECTION ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiHelpCircle className="text-sm text-indigo-400" />
                        Quick Answers
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
                        Have queries about orders, fast delivery, returns, payments, or seller policies? Find quick answers here.
                    </p>

                    {/* Search */}
                    <div className="relative max-w-2xl mx-auto mt-8">
                        <FiSearch className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search questions (e.g. refund timeframe, delivery charges)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 sm:pl-14 pr-4 py-4 bg-white/95 backdrop-blur-xl text-slate-900 placeholder-slate-400 rounded-2xl shadow-2xl border border-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:bg-white text-base transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* ============ CATEGORY PILLS ============ */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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

                    <button
                        onClick={toggleAll}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-lg transition-colors"
                    >
                        {openQuestions.length === filteredFaqs.length ? 'Collapse All' : 'Expand All'}
                    </button>
                </div>

                {/* ============ FAQS ACCORDION LIST ============ */}
                {filteredFaqs.length > 0 ? (
                    <div className="space-y-4">
                        {filteredFaqs.map((faq) => {
                            const isOpen = openQuestions.includes(faq.id);
                            const feedback = feedbackGiven[faq.id];
                            return (
                                <div
                                    key={faq.id}
                                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                                        isOpen
                                            ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100'
                                            : 'border-slate-200/80 shadow-sm hover:border-slate-300'
                                    }`}
                                >
                                    <button
                                        onClick={() => toggleQuestion(faq.id)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <span className="font-bold text-slate-900 text-base">
                                            {faq.question}
                                        </span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-500 bg-slate-100 transition-transform duration-300 flex-shrink-0 ${
                                            isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : ''
                                        }`}>
                                            <FiChevronDown className="text-base" />
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-6 pb-6 pt-2 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/30">
                                            <p className="mb-4">{faq.answer}</p>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 text-xs text-slate-400">
                                                <span>Was this answer helpful?</span>
                                                {feedback ? (
                                                    <span className="text-indigo-600 font-semibold">Thanks for your response!</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleFeedback(faq.id, true)}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors text-slate-600"
                                                        >
                                                            <FiThumbsUp className="text-xs" /> Yes
                                                        </button>
                                                        <button
                                                            onClick={() => handleFeedback(faq.id, false)}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-rose-500 hover:text-rose-600 transition-colors text-slate-600"
                                                        >
                                                            <FiThumbsDown className="text-xs" /> No
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                            <FiSearch />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No questions matched your search</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            Try searching for general keywords or contact our 24/7 customer support desk.
                        </p>
                    </div>
                )}

                {/* ============ STILL HAVE QUESTIONS CARD ============ */}
                <div className="mt-14 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white text-center border border-indigo-900/40 relative overflow-hidden shadow-xl">
                    <div className="max-w-xl mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white text-2xl mx-auto mb-4 backdrop-blur-md">
                            <FiMessageSquare />
                        </div>
                        <h3 className="text-2xl font-extrabold text-white">Still have questions?</h3>
                        <p className="text-slate-300 text-sm mt-2">
                            Can’t find the answer you’re looking for? Our friendly customer support team is always ready to assist.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mt-6">
                            <Link
                                to="/contact"
                                className="px-6 py-3 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all"
                            >
                                Contact Support
                            </Link>
                            <Link
                                to="/help-center"
                                className="px-6 py-3 bg-white/10 text-white font-bold text-xs rounded-xl border border-white/20 hover:bg-white/20 transition-all"
                            >
                                Visit Help Center
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FAQs;
