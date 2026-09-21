import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiSearch,
    FiUser,
    FiCalendar,
    FiClock,
    FiChevronRight,
    FiBookmark,
    FiShare2,
    FiArrowRight,
    FiMail,
    FiTrendingUp
} from 'react-icons/fi';

const Blog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'All Posts' },
        { id: 'trending', name: '🔥 Trending' },
        { id: 'technology', name: 'Technology' },
        { id: 'fashion', name: 'Fashion' },
        { id: 'lifestyle', name: 'Lifestyle' },
        { id: 'reviews', name: 'Reviews' },
    ];

    const posts = [
        {
            id: 1, title: 'Top 10 Smartphones Under ₹20,000 in 2024', category: 'Technology',
            author: 'Arjun Mehta', date: 'Aug 10, 2024', readTime: '5 min read',
            excerpt: 'Discover the best budget smartphones that offer premium features — 120Hz AMOLED, 5G, 50MP cameras — without breaking the bank.',
            image: '📱', featured: true,
        },
        {
            id: 2, title: 'Sustainable Fashion: Building an Eco-Friendly Wardrobe', category: 'Fashion',
            author: 'Priya Sharma', date: 'Aug 8, 2024', readTime: '7 min read',
            excerpt: 'Learn how to make sustainable fashion choices, from organic cotton basics to thrifted vintage pieces.',
            image: '👗', featured: false,
        },
        {
            id: 3, title: 'The Future of E-Commerce: AI Personalization', category: 'Technology',
            author: 'Mike Johnson', date: 'Aug 5, 2024', readTime: '4 min read',
            excerpt: 'How artificial intelligence is transforming online shopping with hyper-personalized product recommendations.',
            image: '🤖', featured: false,
        },
        {
            id: 4, title: '5 Morning Routines of Successful Entrepreneurs', category: 'Lifestyle',
            author: 'Sarah Wilson', date: 'Aug 3, 2024', readTime: '6 min read',
            excerpt: 'Start your day right with these proven morning routines from CEOs and startup founders.',
            image: '🌅', featured: false,
        },
        {
            id: 5, title: 'Noise Cancelling Headphones: Ultimate 2024 Buyer\'s Guide', category: 'Reviews',
            author: 'Alex Brown', date: 'Aug 1, 2024', readTime: '8 min read',
            excerpt: 'A comprehensive deep-dive comparing Sony, Bose, Apple, and Sennheiser across sound, comfort, and battery.',
            image: '🎧', featured: false,
        },
        {
            id: 6, title: 'Minimalist Living: Declutter Your Home in 30 Days', category: 'Lifestyle',
            author: 'Emma Davis', date: 'Jul 28, 2024', readTime: '4 min read',
            excerpt: 'Transform your living space with this simple 30-day decluttering challenge and organization tips.',
            image: '🏠', featured: false,
        },
    ];

    const filteredPosts = posts.filter((post) => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'all' || post.category.toLowerCase() === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const featuredPost = filteredPosts.find(p => p.featured) || filteredPosts[0];
    const regularPosts = filteredPosts.filter(p => p !== featuredPost);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/50">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-md">
                        <FiTrendingUp className="text-sm text-indigo-400" />
                        Zyvento Blog & Insights
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                        Insights & Stories
                        <span className="block bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">From Our Experts</span>
                    </h1>
                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
                        Stay updated with the latest trends, product reviews, shopping tips, and industry insights.
                    </p>

                    {/* Search */}
                    <div className="relative max-w-2xl mx-auto mt-8">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search articles by keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-4 py-4 bg-white/95 backdrop-blur-xl text-slate-900 placeholder-slate-400 rounded-2xl shadow-2xl border border-white/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:bg-white text-base transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* ============ CATEGORY TABS ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="flex flex-wrap gap-2.5 mb-8">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* ============ FEATURED POST ============ */}
                {featuredPost && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-10 hover:shadow-xl transition-all duration-300 group">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="h-64 lg:h-auto bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 flex items-center justify-center text-8xl group-hover:scale-105 transition-transform duration-500">
                                {featuredPost.image}
                            </div>
                            <div className="p-8 sm:p-10 flex flex-col justify-center">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                                        {featuredPost.category}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                                        ⭐ Featured
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                    {featuredPost.title}
                                </h2>
                                <p className="text-sm text-slate-500 mt-3 leading-relaxed">{featuredPost.excerpt}</p>
                                <div className="flex items-center gap-4 mt-5 text-xs text-slate-400 font-medium">
                                    <span className="flex items-center gap-1"><FiUser className="text-sm" /> {featuredPost.author}</span>
                                    <span className="flex items-center gap-1"><FiCalendar className="text-sm" /> {featuredPost.date}</span>
                                    <span className="flex items-center gap-1"><FiClock className="text-sm" /> {featuredPost.readTime}</span>
                                </div>
                                <div className="mt-6">
                                    <Link
                                        to={`/blog/${featuredPost.id}`}
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                    >
                                        Read Full Article <FiArrowRight />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============ ARTICLES GRID ============ */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Latest Articles</h3>
                    <p className="text-xs text-slate-500 font-medium">{filteredPosts.length} articles</p>
                </div>

                {regularPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularPosts.map((post) => (
                            <article key={post.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                                <div className="h-48 bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
                                    {post.image}
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full self-start">
                                        {post.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors leading-snug">
                                        {post.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">{post.excerpt}</p>

                                    <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-400 font-medium">
                                        <span className="flex items-center gap-1"><FiUser /> {post.author}</span>
                                        <span>•</span>
                                        <span>{post.readTime}</span>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                        <Link
                                            to={`/blog/${post.id}`}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                                        >
                                            Read More <FiChevronRight className="text-sm" />
                                        </Link>
                                        <div className="flex gap-2">
                                            <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                                <FiBookmark className="text-sm" />
                                            </button>
                                            <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                                <FiShare2 className="text-sm" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                            <FiSearch />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No articles found</h3>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filter.</p>
                    </div>
                )}
            </section>

            {/* ============ NEWSLETTER ============ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white border border-indigo-900/40 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative max-w-2xl mx-auto text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mx-auto mb-4 backdrop-blur-md text-indigo-300">
                            <FiMail />
                        </div>
                        <h2 className="text-3xl font-extrabold">Never Miss an Insight</h2>
                        <p className="text-sm text-slate-300 mt-2">Subscribe to our weekly newsletter for curated articles, deals, and product launches.</p>
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 max-w-lg mx-auto">
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 backdrop-blur-md"
                            />
                            <button className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all whitespace-nowrap">
                                Subscribe
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-3">No spam. Unsubscribe anytime.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Blog;
