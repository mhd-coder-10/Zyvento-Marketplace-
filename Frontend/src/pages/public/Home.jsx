import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiShoppingBag, FiTruck, FiShield, FiRotateCcw, FiHeadphones,
    FiChevronRight, FiStar, FiClock, FiTrendingUp, FiArrowRight,
    FiZap, FiAward, FiGift, FiBriefcase
} from 'react-icons/fi';
import ApiService from '../../api/ApiService';
import ProductCard from '../../components/public/product/ProductCard';

const Home = () => {
    const navigate = useNavigate();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    // Load dynamic data from Backend
    useEffect(() => {
        let isMounted = true;
        const loadHomeData = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes] = await Promise.allSettled([
                    ApiService.getAllProducts({ page: 1, limit: 12 }),
                    ApiService.getActiveCategories(),
                ]);

                if (!isMounted) return;

                if (prodRes.status === 'fulfilled' && prodRes.value?.data?.success) {
                    const list = prodRes.value.data.data?.products || prodRes.value.data.data || [];
                    const prods = Array.isArray(list) ? list : [];
                    setFeaturedProducts(prods.slice(0, 8));
                    setTrendingProducts(prods.slice(4, 12));
                }

                if (catRes.status === 'fulfilled' && catRes.value?.data?.success) {
                    const catList = catRes.value.data.data?.categories || catRes.value.data.data || [];
                    setCategories(Array.isArray(catList) ? catList : []);
                }
            } catch (err) {
                console.error('Home page load error:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadHomeData();
        return () => { isMounted = false; };
    }, []);

    const valueFeatures = [
        { icon: FiTruck, title: 'Free & Fast Delivery', desc: 'Free shipping on orders above ₹499' },
        { icon: FiRotateCcw, title: 'Easy 7-Day Returns', desc: 'No questions asked instant return pickup' },
        { icon: FiShield, title: '100% Secure Checkout', desc: 'Protected by 256-bit bank-grade encryption' },
        { icon: FiHeadphones, title: '24/7 Dedicated Support', desc: 'Friendly expert support team anytime' },
    ];

    const fallbackCategories = [
        { name: 'Electronics', icon: '💻', count: '1.2k+ Items', color: 'from-blue-500 to-indigo-600' },
        { name: 'Mobiles & Tablets', icon: '📱', count: '850+ Items', color: 'from-sky-400 to-blue-500' },
        { name: 'Fashion & Apparel', icon: '👕', count: '3.4k+ Items', color: 'from-pink-500 to-rose-600' },
        { name: 'Beauty & Grooming', icon: '💄', count: '920+ Items', color: 'from-purple-500 to-indigo-600' },
        { name: 'Home & Kitchen', icon: '🏠', count: '1.5k+ Items', color: 'from-amber-500 to-orange-600' },
        { name: 'Sports & Fitness', icon: '⚽', count: '640+ Items', color: 'from-emerald-500 to-teal-600' },
    ];

    const displayCategories = categories.length > 0
        ? categories.map((c, i) => ({
            id: c._id || c.id,
            name: c.name || c.title,
            icon: fallbackCategories[i % fallbackCategories.length]?.icon || '🛍️',
            count: 'Explore Items',
            color: fallbackCategories[i % fallbackCategories.length]?.color || 'from-sky-500 to-blue-600'
        }))
        : fallbackCategories;

    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-10 sm:space-y-14 pt-4 sm:pt-6 pb-16">
            
            {/* ============================================================
                HERO SECTION — Animated Modern Gradient Showcase
                ============================================================ */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl border border-sky-500/20">
                {/* Decorative background glow accents */}
                <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

                <div className="relative w-full px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        
                        {/* Left Hero Content */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sky-300 text-xs sm:text-sm font-bold shadow-inner">
                                <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                                ⚡ Summer Mega Sale — Up to 60% OFF
                            </div>

                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                                Everything You Love, <br className="hidden sm:inline" />
                                <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                                    Delivered at Best Price.
                                </span>
                            </h1>

                            <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                                Explore India's trusted multi-vendor marketplace. Shop over 10,000+ verified brand products with instant delivery and secure warranty.
                            </p>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                                <Link
                                    to="/products"
                                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-blue-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-sky-500/30 hover:shadow-xl transition-all duration-300 active:scale-95 group"
                                >
                                    <span>Explore Catalog</span>
                                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <Link
                                    to="/become-seller"
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-md transition-all active:scale-95"
                                >
                                    <FiBriefcase className="h-4 w-4 text-sky-400" />
                                    <span>Become a Seller</span>
                                </Link>
                            </div>

                            {/* Trust numbers */}
                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-md mx-auto lg:mx-0">
                                <div>
                                    <p className="text-xl sm:text-2xl font-black text-white">50k+</p>
                                    <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Happy Shoppers</p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-black text-sky-400">10k+</p>
                                    <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Verified Products</p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-black text-white">4.9 ★</p>
                                    <p className="text-[11px] sm:text-xs text-slate-400 font-medium">App Rating</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Hero Cards Showcase */}
                        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 sm:gap-4">
                            {[
                                { title: 'Electronics & Audio', icon: '🎧', tag: 'Up to 50% Off', bg: 'from-blue-600/30 to-sky-600/20' },
                                { title: 'Smart Wearables', icon: '⌚', tag: 'Starting ₹1,499', bg: 'from-indigo-600/30 to-purple-600/20' },
                                { title: 'Fashion & Trends', icon: '👟', tag: 'Min 40% Off', bg: 'from-rose-600/30 to-pink-600/20' },
                                { title: 'Home Essentials', icon: '🛋️', tag: 'Top Deals', bg: 'from-amber-600/30 to-orange-600/20' },
                            ].map((card, idx) => (
                                <Link
                                    key={idx}
                                    to="/products"
                                    className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${card.bg} border border-white/10 backdrop-blur-md hover:border-sky-400/50 hover:scale-105 transition-all duration-300 group`}
                                >
                                    <span className="text-3xl sm:text-4xl block mb-2">{card.icon}</span>
                                    <p className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                                        {card.title}
                                    </p>
                                    <span className="inline-block mt-1 text-[11px] font-extrabold text-sky-400">
                                        {card.tag} →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================
                VALUE PROPOSITION / TRUST BADGES
                ============================================================ */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {valueFeatures.map((feat, idx) => {
                    const Icon = feat.icon;
                    return (
                        <div
                            key={idx}
                            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-sky-200 transition flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5"
                        >
                            <div className="h-12 w-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">{feat.title}</h4>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{feat.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* ============================================================
                BROWSE BY POPULAR CATEGORIES
                ============================================================ */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <span>Shop by Category</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">Pick from our widest departmental catalog</p>
                    </div>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                        <span>View All Categories</span>
                        <FiChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {displayCategories.map((cat, idx) => (
                        <Link
                            key={idx}
                            to={`/products?category=${encodeURIComponent(cat.id || cat.name)}`}
                            className="group p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 text-center flex flex-col items-center"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-sky-50 transition-all">
                                {cat.icon}
                            </div>
                            <h3 className="mt-3 text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {cat.name}
                            </h3>
                            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
                                {cat.count}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ============================================================
                PROMOTIONAL TRIPLE BANNERS
                ============================================================ */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-7 text-white shadow-lg flex flex-col justify-between min-h-[180px]">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white">
                            Limited Stock
                        </span>
                        <h3 className="mt-2 text-xl sm:text-2xl font-black leading-tight">Trending Laptops & Gadgets</h3>
                        <p className="text-xs text-sky-100 mt-1">Extra ₹2,500 off on bank cards</p>
                    </div>
                    <Link to="/products" className="inline-flex items-center gap-1 text-xs font-extrabold text-sky-200 hover:text-white pt-3">
                        Shop Now <FiArrowRight />
                    </Link>
                    <span className="absolute -bottom-4 -right-4 text-7xl opacity-15 select-none pointer-events-none">💻</span>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-7 text-white shadow-lg flex flex-col justify-between min-h-[180px]">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white">
                            New Season
                        </span>
                        <h3 className="mt-2 text-xl sm:text-2xl font-black leading-tight">Footwear & Casuals</h3>
                        <p className="text-xs text-emerald-100 mt-1">Starting from just ₹499</p>
                    </div>
                    <Link to="/products" className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-200 hover:text-white pt-3">
                        Discover Deals <FiArrowRight />
                    </Link>
                    <span className="absolute -bottom-4 -right-4 text-7xl opacity-15 select-none pointer-events-none">👟</span>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 to-pink-700 p-6 sm:p-7 text-white shadow-lg flex flex-col justify-between min-h-[180px]">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white">
                            Verified Sellers
                        </span>
                        <h3 className="mt-2 text-xl sm:text-2xl font-black leading-tight">Smart Watches & Audio</h3>
                        <p className="text-xs text-rose-100 mt-1">Free 1-year brand warranty</p>
                    </div>
                    <Link to="/products" className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-200 hover:text-white pt-3">
                        Browse Audio <FiArrowRight />
                    </Link>
                    <span className="absolute -bottom-4 -right-4 text-7xl opacity-15 select-none pointer-events-none">🎧</span>
                </div>
            </section>

            {/* ============================================================
                FEATURED PRODUCTS — Live Catalog Data
                ============================================================ */}
            <section className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <span>Featured Products</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                                Verified Quality
                            </span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">Handpicked top-rated products from authentic sellers</p>
                    </div>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                        <span>View All Products ({featuredProducts.length})</span>
                        <FiChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
                                <div className="aspect-square bg-slate-100 rounded-xl" />
                                <div className="h-4 bg-slate-100 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                                <div className="h-8 bg-slate-100 rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                        {featuredProducts.map((prod) => (
                            <ProductCard
                                key={prod._id || prod.id}
                                product={prod}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <FiShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No Products Found</h3>
                        <p className="text-xs text-slate-500 mt-1">Products added by verified sellers will appear here.</p>
                        <Link to="/become-seller" className="inline-block mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm">
                            Become a Seller
                        </Link>
                    </div>
                )}
            </section>

            {/* ============================================================
                BECOME A SELLER PROMOTIONAL CALLOUT
                ============================================================ */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 text-white p-8 sm:p-12 shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-4 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white text-blue-700 shadow-sm">
                        <FiBriefcase className="h-3.5 w-3.5" /> Merchant Program
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                        Grow Your Business on Zyvento Marketplace
                    </h2>
                    <p className="text-sm sm:text-base text-sky-100 leading-relaxed">
                        Reach millions of active buyers across India. Enjoy low commission rates, automated payouts, dedicated seller support, and effortless catalog management.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <Link
                            to="/become-seller"
                            className="px-6 py-3 rounded-2xl bg-white text-blue-700 hover:bg-sky-50 font-extrabold text-sm shadow-md transition active:scale-95"
                        >
                            Start Selling Today
                        </Link>
                        <Link
                            to="/about"
                            className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-sm transition"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
                <div className="absolute top-1/2 -right-10 -translate-y-1/2 text-9xl opacity-10 select-none pointer-events-none hidden lg:block">
                    🛍️
                </div>
            </section>
        </div>
    );
};

export default Home;
