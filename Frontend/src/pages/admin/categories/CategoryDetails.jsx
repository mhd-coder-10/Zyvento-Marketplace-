import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowLeft, FiEdit2, FiPackage, FiShoppingBag, FiClock,
    FiGrid, FiRefreshCw, FiLayers, FiCheckCircle, FiXCircle,
    FiExternalLink, FiFileText, FiTag, FiSearch, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import AdminTopbar from '../../../components/admin/AdminTopbar';

const CategoryDetails = () => {
    const { categoryCode } = useParams();
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productPagination, setProductPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
    const [productSearch, setProductSearch] = useState('');

    const fetchCategoryDetails = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ApiService.getCategoryByCode(categoryCode);
            if (res.data.success) {
                const data = res.data.data;
                setCategory(data);
                if (Array.isArray(data.sub_categories)) {
                    setSubCategories(data.sub_categories);
                }
            } else {
                throw new Error(res.data.message);
            }
        } catch (error) {
            toast.error('Failed to load category details');
            navigate('/admin/categories');
        } finally {
            setLoading(false);
        }
    }, [categoryCode, navigate]);

    useEffect(() => {
        fetchCategoryDetails();
    }, [fetchCategoryDetails]);

    // Fetch products belonging to this category
    const fetchCategoryProducts = useCallback(async (catId, page = 1, search = '') => {
        if (!catId) return;
        setProductsLoading(true);
        try {
            const params = {
                admin: true,
                category: catId,
                page,
                limit: 8
            };
            if (search.trim()) params.search = search.trim();

            const res = await ApiService.getAllProducts(params);
            if (res.data.success) {
                const prodData = res.data.data?.products || res.data.data || [];
                setProducts(Array.isArray(prodData) ? prodData : []);
                const pag = res.data.pagination || { total: prodData.length, totalPages: 1 };
                setProductPagination({
                    page,
                    limit: 8,
                    total: pag.total || prodData.length,
                    totalPages: pag.totalPages || 1
                });
            }
        } catch (error) {
            console.error('Failed to load category products', error);
        } finally {
            setProductsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (category?._id) {
            fetchCategoryProducts(category._id, productPagination.page, productSearch);
        }
    }, [category?._id, productPagination.page, productSearch, fetchCategoryProducts]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8 mx-auto" />
                    <p className="text-sm font-medium text-slate-600">Loading category details...</p>
                </div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-slate-500 font-medium">Category not found</p>
                    <button
                        onClick={() => navigate('/admin/categories')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                        Back to Categories
                    </button>
                </div>
            </div>
        );
    }

    const totalProducts = category.total_products ?? category.product_count ?? 0;

    return (
        <div className="w-full space-y-6">
            <AdminTopbar
                title="Category Details"
                subtitle={`${category.category_name} (${category.category_code})`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/admin/categories')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiArrowLeft className="w-4 h-4 text-blue-600" /> Back to Categories
                        </button>
                        <button
                            onClick={() => navigate(`/admin/categories/${category.category_code}/edit`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-xs text-xs sm:text-sm"
                        >
                            <FiEdit2 className="w-4 h-4" /> Edit Category
                        </button>
                    </div>
                }
            />

            <div className="w-full space-y-6">

                {/* ====== 1. CATEGORY HEADER CARD ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {category.category_image ? (
                                <img
                                    src={category.category_image}
                                    alt={category.category_name}
                                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 bg-slate-50 shadow-xs shrink-0"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-3xl font-bold text-white shadow-xs shrink-0">
                                    {(category.category_name?.[0] || 'C').toUpperCase()}
                                </div>
                            )}

                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{category.category_name}</h2>
                                    {category.status === 'active' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactive
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                                    <p>
                                        Category Code: <strong className="font-mono text-slate-700">{category.category_code}</strong>
                                    </p>
                                    <span>•</span>
                                    <p>
                                        Display Order: <strong className="text-slate-700">{category.display_order ?? 0}</strong>
                                    </p>
                                    {category.created_at && (
                                        <>
                                            <span>•</span>
                                            <p>Created: <strong className="text-slate-700">{new Date(category.created_at).toLocaleDateString('en-IN')}</strong></p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                            <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5">
                                <FiPackage className="w-4 h-4" />
                                {totalProducts} Products Linked
                            </span>
                        </div>
                    </div>
                </div>

                {/* ====== 2. STATS CARDS ====== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* TOTAL PRODUCTS INCLUDED CARD (HIGHLIGHTED) */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xs p-5 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white">
                                <FiPackage className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalProducts}</p>
                                <p className="text-xs text-blue-100 font-medium">Products Included</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
                                <FiLayers className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{category.sub_category_count ?? subCategories.length}</p>
                                <p className="text-xs text-slate-500 font-medium">Sub-Categories</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                <FiShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{category.total_orders ?? 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                <FiClock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{category.recent_orders ?? 0}</p>
                                <p className="text-xs text-slate-500 font-medium">Recent Orders (30d)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ====== 3. DESCRIPTION & SUB-CATEGORIES SECTION ====== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Description */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <FiFileText className="w-4 h-4 text-blue-600" /> Category Overview
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                            {category.description || 'No description provided for this category.'}
                        </p>

                        <div className="pt-4 border-t border-slate-100 text-xs space-y-2">
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400">Classification Level:</span>
                                <span className="font-semibold text-slate-800">Root Category (L1)</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400">Created By:</span>
                                <span className="font-semibold text-slate-800">
                                    {category.created_by?.first_name ? `${category.created_by.first_name} ${category.created_by.last_name || ''}` : 'Super Admin'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-Categories under this category */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <FiLayers className="w-4 h-4 text-cyan-600" />
                                Sub-Categories ({subCategories.length})
                            </h3>
                            <button
                                onClick={() => navigate('/admin/sub-categories/create')}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                + Add Sub-Category
                            </button>
                        </div>

                        {subCategories.length === 0 ? (
                            <p className="text-xs text-slate-400 py-6 text-center">
                                No sub-categories created under this category yet.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {subCategories.map((sub) => (
                                    <div
                                        key={sub._id}
                                        onClick={() => navigate(`/admin/sub-categories/${sub.sub_category_code}`)}
                                        className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 transition cursor-pointer flex items-center justify-between gap-3 group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {sub.sub_category_image ? (
                                                <img src={sub.sub_category_image} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-white" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {(sub.sub_category_name?.[0] || 'S').toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 text-xs group-hover:text-blue-600 transition truncate">
                                                    {sub.sub_category_name}
                                                </p>
                                                <span className="font-mono text-[10px] text-slate-400">{sub.sub_category_code}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px]">
                                                {sub.product_count ?? 0} items
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ====== 4. PRODUCTS INCLUDED IN THIS CATEGORY ====== */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <FiPackage className="w-5 h-5 text-blue-600" />
                                Products Included in this Category ({productPagination.total})
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                All marketplace products currently assigned to <strong>{category.category_name}</strong>
                            </p>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setProductPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {productsLoading ? (
                        <div className="py-12 text-center space-y-2">
                            <FiRefreshCw className="animate-spin text-blue-600 w-6 h-6 mx-auto" />
                            <p className="text-xs text-slate-500">Loading products...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <FiPackage className="w-8 h-8 text-slate-400 mx-auto" />
                            <h4 className="text-xs font-bold text-slate-700">No products found in this category</h4>
                            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                                {productSearch ? 'No products match your search query.' : 'Sellers have not added any products under this category yet.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-4 py-3 font-bold text-slate-600 uppercase">Product</th>
                                            <th className="px-4 py-3 font-bold text-slate-600 uppercase">Product Code</th>
                                            <th className="px-4 py-3 font-bold text-slate-600 uppercase">Sub-Category</th>
                                            <th className="px-4 py-3 font-bold text-slate-600 uppercase">Price</th>
                                            <th className="px-4 py-3 font-bold text-slate-600 uppercase">Stock</th>
                                            <th className="px-4 py-3 font-bold text-slate-600 uppercase">Status</th>
                                            <th className="px-4 py-3 font-bold text-slate-600 uppercase text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.map((prod) => (
                                            <tr key={prod._id} className="hover:bg-slate-50/60 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {prod.images?.[0] ? (
                                                            <img
                                                                src={typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.url}
                                                                alt=""
                                                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                {(prod.product_name?.[0] || 'P').toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 max-w-xs">
                                                            <p className="font-semibold text-slate-900 text-xs truncate">{prod.product_name}</p>
                                                            <p className="text-[11px] text-slate-400 truncate">{prod.brand || 'No Brand'}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 font-mono font-medium text-slate-700">
                                                    {prod.product_code}
                                                </td>

                                                <td className="px-4 py-3 text-slate-600">
                                                    {prod.sub_category_id?.sub_category_name || 'N/A'}
                                                </td>

                                                <td className="px-4 py-3 font-bold text-slate-900">
                                                    ₹{prod.price}
                                                </td>

                                                <td className="px-4 py-3 font-semibold text-slate-700">
                                                    {prod.stock_quantity ?? 0} units
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        prod.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        prod.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                        prod.status === 'suspended' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                                        'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                        {prod.status}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin/products/${prod.product_code}`)}
                                                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs transition inline-flex items-center gap-1"
                                                    >
                                                        View Details <FiExternalLink className="w-3 h-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {products.map((prod) => (
                                    <div
                                        key={prod._id}
                                        onClick={() => navigate(`/admin/products/${prod.product_code}`)}
                                        className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5 cursor-pointer hover:bg-white transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            {prod.images?.[0] ? (
                                                <img
                                                    src={typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.url}
                                                    alt=""
                                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {(prod.product_name?.[0] || 'P').toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h5 className="font-bold text-slate-900 text-xs truncate">{prod.product_name}</h5>
                                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{prod.product_code}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                prod.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {prod.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-[11px] pt-2 border-t border-slate-200/70 text-center">
                                            <div>
                                                <span className="text-slate-400 block">Sub-Cat</span>
                                                <span className="font-medium text-slate-700 truncate block">
                                                    {prod.sub_category_id?.sub_category_name || 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Price</span>
                                                <span className="font-bold text-slate-900">₹{prod.price}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Stock</span>
                                                <span className="font-semibold text-slate-700">{prod.stock_quantity ?? 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {productPagination.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                                    <span className="text-slate-500">
                                        Showing page {productPagination.page} of {productPagination.totalPages}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setProductPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                            disabled={productPagination.page <= 1}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <FiChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setProductPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                            disabled={productPagination.page >= productPagination.totalPages}
                                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <FiChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CategoryDetails;