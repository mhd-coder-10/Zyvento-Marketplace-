import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiSearch,
    FiShoppingBag,
    FiGrid,
    FiList,
    FiX,
    FiArrowLeft,
    FiChevronLeft,
    FiChevronRight,
    FiSliders,
    FiRotateCcw
} from 'react-icons/fi';

import ApiService from '../../../api/ApiService';
import ProductCard from '../../../components/public/product/ProductCard';
import ProductSort from '../../../components/public/product/ProductSort';
import ProductSkeleton from '../../../components/public/product/ProductSkeleton';

const SearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || searchParams.get('search') || '';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 16,
        total: 0,
        pages: 0,
    });
    const [sortBy, setSortBy] = useState('relevance');

    useEffect(() => {
        if (query) {
            loadSearchResults();
        } else {
            setProducts([]);
            setLoading(false);
        }
    }, [query, sortBy, pagination.page]);

    const loadSearchResults = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: query,
                sortBy: sortBy === 'relevance' ? undefined : sortBy,
            };

            const response = await ApiService.getAllProducts(params);

            if (response.data.success) {
                const list = response.data.data.products || response.data.data.items || response.data.data || [];
                setProducts(list);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || list.length,
                    pages: response.data.data.pages || Math.ceil((response.data.data.total || list.length) / prev.limit) || 1,
                }));
            }
        } catch (error) {
            console.error('Failed to load search results:', error);
            try {
                const res = await ApiService.getProducts({ search: query });
                if (res.data.success) {
                    setProducts(res.data.data.products || res.data.data || []);
                }
            } catch (err) {
                toast.error('Failed to load search results');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const nextQuery = e.target.search.value.trim();
        if (nextQuery) {
            setSearchParams({ q: nextQuery });
            setPagination(p => ({ ...p, page: 1 }));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ============ BREADCRUMB & HEADER ============ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-white rounded-2xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-0.5">
                                <Link to="/" className="hover:text-blue-600">Home</Link>
                                <span>/</span>
                                <Link to="/products" className="hover:text-blue-600">Products</Link>
                                <span>/</span>
                                <span className="text-slate-800 font-bold">Search</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                                {query ? (
                                    <>Results for <span className="text-blue-600">"{query}"</span></>
                                ) : (
                                    'Product Search'
                                )}
                            </h1>
                        </div>
                    </div>

                    {/* View Switcher & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <FiGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-700'
                                }`}
                            >
                                <FiList className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ============ SEARCH BAR ============ */}
                <form onSubmit={handleSearchSubmit} className="flex gap-3">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            name="search"
                            type="text"
                            placeholder="Search products, brands, categories..."
                            defaultValue={query}
                            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => navigate('/products')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-6 sm:px-8 py-3.5 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        Search
                    </button>
                </form>

                {/* ============ RESULTS SECTION ============ */}
                {query ? (
                    <div className="space-y-6">
                        {/* Sort & Count Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                            <span className="text-xs font-bold text-slate-600">
                                Found <span className="text-blue-600">{pagination.total}</span> items for "{query}"
                            </span>
                            <ProductSort
                                sortBy={sortBy}
                                onSortChange={(val) => setSortBy(val)}
                            />
                        </div>

                        {loading ? (
                            <ProductSkeleton count={8} viewMode={viewMode} />
                        ) : products.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold">
                                    <FiSearch />
                                </div>
                                <h3 className="text-xl font-black text-slate-900">No results found for "{query}"</h3>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                    Check your spelling, try broader keywords, or browse all marketplace categories.
                                </p>
                                <Link
                                    to="/products"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                                >
                                    <FiShoppingBag className="w-4 h-4" />
                                    Browse All Catalog
                                </Link>
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
                                            onUpdate={loadSearchResults}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-8">
                                        <button
                                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                            disabled={pagination.page <= 1}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
                                        >
                                            <FiChevronLeft className="w-4 h-4" />
                                            Prev
                                        </button>
                                        <span className="text-xs font-bold text-slate-600 px-4">
                                            Page {pagination.page} of {pagination.pages}
                                        </span>
                                        <button
                                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                            disabled={pagination.page >= pagination.pages}
                                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"
                                        >
                                            Next
                                            <FiChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-4">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold">
                            <FiSearch />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">What are you looking for?</h3>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                            Search for electronics, fashion, smartphones, home living, and thousands of top deals.
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                        >
                            Explore Marketplace
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SearchResults;
