import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch,
    FiFilter,
    FiGrid,
    FiList,
    FiShoppingBag,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiSliders,
    FiRotateCcw
} from 'react-icons/fi';

import ApiService from '../../../api/ApiService';
import ProductCard from '../../../components/public/product/ProductCard';
import ProductFilter from '../../../components/public/product/ProductFilter';
import ProductSort from '../../../components/public/product/ProductSort';
import ProductSkeleton from '../../../components/public/product/ProductSkeleton';

const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 16,
        total: 0,
        pages: 0,
    });

    // Filter states
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        search: searchParams.get('search') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        rating: searchParams.get('rating') || '',
        sortBy: searchParams.get('sortBy') || 'newest',
    });

    useEffect(() => {
        // Sync URL query params on mount or change
        setFilters({
            category: searchParams.get('category') || '',
            search: searchParams.get('search') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            rating: searchParams.get('rating') || '',
            sortBy: searchParams.get('sortBy') || 'newest',
        });
    }, [searchParams]);

    // Load products
    useEffect(() => {
        loadProducts();
    }, [filters, pagination.page]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                category: filters.category || undefined,
                search: filters.search || undefined,
                minPrice: filters.minPrice || undefined,
                maxPrice: filters.maxPrice || undefined,
                rating: filters.rating || undefined,
                sortBy: filters.sortBy || 'newest',
            };

            const response = await ApiService.getAllProducts(params);

            if (response.data.success) {
                const list = response.data.data.products || response.data.data.items || response.data.data || [];
                setProducts(list);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || response.data.data.count || list.length,
                    pages: response.data.data.pages || Math.ceil((response.data.data.total || list.length) / prev.limit) || 1,
                }));
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            // Fallback to getProducts
            try {
                const res = await ApiService.getProducts();
                if (res.data.success) {
                    setProducts(res.data.data.products || res.data.data || []);
                }
            } catch (err) {
                toast.error('Failed to load products');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        const nextFilters = { ...filters, [key]: value };
        setFilters(nextFilters);
        setPagination(prev => ({ ...prev, page: 1 }));

        const params = new URLSearchParams();
        Object.entries(nextFilters).forEach(([k, v]) => {
            if (v) params.set(k, v);
        });
        setSearchParams(params);
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            category: '',
            search: '',
            minPrice: '',
            maxPrice: '',
            rating: '',
            sortBy: 'newest',
        });
        setSearchParams({});
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Handle search bar submit
    const handleSearch = (e) => {
        e.preventDefault();
        const form = e.target;
        const searchValue = form.search.value.trim();
        handleFilterChange('search', searchValue);
    };

    const hasActiveFilters = Boolean(
        filters.category ||
        filters.search ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.rating
    );

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & HEADER ============ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                            <span>/</span>
                            <span className="text-slate-800">All Products</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            Explore Marketplace
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            {pagination.total > 0
                                ? `Showing ${products.length} of ${pagination.total} verified products`
                                : 'Discover top deals, premium brands, and trending items'}
                        </p>
                    </div>

                    {/* Search Bar + Controls */}
                    <div className="flex items-center gap-3">
                        <form onSubmit={handleSearch} className="relative flex-1 sm:w-72">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                name="search"
                                type="text"
                                placeholder="Search catalog..."
                                defaultValue={filters.search}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                            />
                        </form>

                        {/* View Switcher */}
                        <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                        : 'text-slate-400 hover:text-slate-700'
                                }`}
                                title="Grid View"
                            >
                                <FiGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                        : 'text-slate-400 hover:text-slate-700'
                                }`}
                                title="List View"
                            >
                                <FiList className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(true)}
                            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                            <FiSliders className="w-4 h-4 text-blue-600" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* ============ ACTIVE FILTER PILLS ============ */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-xs">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">
                            Active Filters:
                        </span>
                        {filters.search && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-xl">
                                Keyword: "{filters.search}"
                                <button onClick={() => handleFilterChange('search', '')}><FiX className="w-3 h-3 hover:text-blue-900" /></button>
                            </span>
                        )}
                        {filters.category && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold rounded-xl">
                                Category Filter
                                <button onClick={() => handleFilterChange('category', '')}><FiX className="w-3 h-3 hover:text-indigo-900" /></button>
                            </span>
                        )}
                        {(filters.minPrice || filters.maxPrice) && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-xl">
                                Price: ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || '∞'}
                                <button onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', ''); }}>
                                    <FiX className="w-3 h-3 hover:text-emerald-900" />
                                </button>
                            </span>
                        )}
                        {filters.rating && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-semibold rounded-xl">
                                {filters.rating}★ & Above
                                <button onClick={() => handleFilterChange('rating', '')}><FiX className="w-3 h-3 hover:text-amber-900" /></button>
                            </span>
                        )}
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 ml-auto px-2 py-1"
                        >
                            <FiRotateCcw className="w-3 h-3" />
                            Clear All
                        </button>
                    </div>
                )}

                {/* ============ MAIN LAYOUT ============ */}
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Desktop Sidebar Filter */}
                    <div className="hidden lg:block w-72 flex-shrink-0">
                        <div className="sticky top-24">
                            <ProductFilter
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                onClearFilters={clearFilters}
                            />
                        </div>
                    </div>

                    {/* Mobile Filter Drawer Overlay */}
                    {showFilters && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div
                                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
                                onClick={() => setShowFilters(false)}
                            />
                            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                                <div className="w-screen max-w-sm bg-white p-6 shadow-2xl overflow-y-auto">
                                    <ProductFilter
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                        onClearFilters={clearFilters}
                                        onClose={() => setShowFilters(false)}
                                        isMobile={true}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Grid & Sort */}
                    <div className="flex-1 space-y-6">
                        {/* Top Sort & Count Bar */}
                        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                            <span className="text-xs font-bold text-slate-600">
                                Showing <span className="text-slate-900">{products.length}</span> results
                            </span>

                            <ProductSort
                                sortBy={filters.sortBy}
                                onSortChange={(value) => handleFilterChange('sortBy', value)}
                            />
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <ProductSkeleton count={8} viewMode={viewMode} />
                        ) : products.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold">
                                    <FiShoppingBag />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">No matching products found</h3>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                    We couldn't find any products matching your specific filters or keyword. Try resetting some filters or searching for something else.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                                >
                                    <FiRotateCcw className="w-3.5 h-3.5" />
                                    Reset All Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div
                                    className={`grid gap-4 sm:gap-6 ${
                                        viewMode === 'grid'
                                            ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                                            : 'grid-cols-1'
                                    }`}
                                >
                                    {products.map((product) => (
                                        <ProductCard
                                            key={product._id || product.id}
                                            product={product}
                                            viewMode={viewMode}
                                            onUpdate={loadProducts}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-8 pb-4">
                                        <button
                                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                            disabled={pagination.page <= 1}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                                        >
                                            <FiChevronLeft className="w-4 h-4" />
                                            Prev
                                        </button>

                                        <div className="flex items-center gap-1 px-2">
                                            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
                                                .map((pageNum, idx, arr) => (
                                                    <React.Fragment key={pageNum}>
                                                        {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                                                            <span className="text-slate-400 px-1 text-xs">…</span>
                                                        )}
                                                        <button
                                                            onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                                                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                                                pagination.page === pageNum
                                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    </React.Fragment>
                                                ))}
                                        </div>

                                        <button
                                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                            disabled={pagination.page >= pagination.pages}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                                        >
                                            Next
                                            <FiChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Products;
