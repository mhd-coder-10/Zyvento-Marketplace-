import React, { useState, useEffect, useMemo } from 'react';
import {
    FiPackage, FiCheckCircle, FiXCircle, FiAlertTriangle, FiRefreshCw,
    FiSearch, FiTrendingUp, FiFolder
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';
import MonthlyProductsChart from '../../../components/admin/MonthlyProductsChart';

const ProductReport = ({ dateRange }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!data) setLoading(true);
        try {
            const res = await ApiService.getReportData('products', dateRange);
            if (res.data.success) setData(res.data.data);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [dateRange]);

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
    };

    const filteredProducts = useMemo(() => {
        return (data?.recentProducts || []).filter(product => {
            const term = searchTerm.toLowerCase();
            return (
                product.product_name?.toLowerCase().includes(term) ||
                product.product_code?.toLowerCase().includes(term) ||
                product.category_name?.toLowerCase().includes(term)
            );
        });
    }, [data, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-72 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
                <FiRefreshCw className="animate-spin text-blue-600 w-8 h-8" />
                <p className="text-slate-500 font-medium text-sm">Loading Catalog Analytics...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">

            {/* 4 SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Products */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Products</span>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <FiPackage className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">{data?.totalProducts || 0}</p>
                    </div>
                    <p className="text-xs text-blue-100 mt-4 pt-2 border-t border-white/20">All catalog offerings</p>
                </div>

                {/* Active Products */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Live</span>
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiCheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{data?.activeProducts || 0}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-100">Live for customer checkout</p>
                </div>

                {/* Out of Stock */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-rose-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock</span>
                            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiXCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">{data?.outOfStock || 0}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-100">Inventory depleted</p>
                </div>

                {/* Low Stock */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-300 transition flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alert</span>
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                <FiAlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">{data?.lowStock || 0}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-100">Near threshold limit</p>
                </div>
            </div>

            {/* CHARTS & TOP SELLING PRODUCTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <MonthlyProductsChart title="Catalog Growth Trend" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
                    <div className="pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Selling Items</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Highest order volume generators</p>
                    </div>

                    <div className="space-y-3 py-3">
                        {data?.topSellingProducts?.length > 0 ? (
                            data.topSellingProducts.slice(0, 5).map((product, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-b-0">
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[11px]">
                                            #{idx + 1}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-semibold text-slate-800 truncate">{product.product_name || 'Product'}</p>
                                            <p className="text-[11px] text-slate-400">{product.totalSold || 0} units sold</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900 shrink-0">{formatCurrency(product.totalRevenue)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-xs text-slate-400">No selling records available</div>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                        Ranked by cumulative customer purchase volume.
                    </div>
                </div>
            </div>

            {/* PRODUCTS BY CATEGORY DISTRIBUTION */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                <div className="pb-3 border-b border-slate-100 mb-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Catalog Distribution by Category</h3>
                </div>
                <div className="space-y-4">
                    {data?.categories?.length > 0 ? (
                        data.categories.map((cat, idx) => {
                            const total = data.totalProducts || 1;
                            const percent = Math.round((cat.count / total) * 100);
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-semibold text-slate-700">{cat.name}</span>
                                        <span className="font-bold text-slate-900">{cat.count} products ({percent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-6 text-xs text-slate-400">No category breakdown data available</div>
                    )}
                </div>
            </div>

            {/* RECENT PRODUCTS (RESPONSIVE) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Recent Products Added</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Newly listed items in marketplace catalog</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search catalog products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Product Info</th>
                                <th className="py-3 px-4">Code</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4 text-right">Price</th>
                                <th className="py-3 px-4 text-center">Stock</th>
                                <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3.5 px-4 font-semibold text-slate-900">{product.product_name || 'N/A'}</td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{product.product_code || 'N/A'}</td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-medium">
                                                {product.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(product.price)}</td>
                                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">{product.stock_quantity || 0}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                                product.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                product.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                product.status === 'out_of_stock' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {product.status || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">No products found matching your search</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product, idx) => (
                            <div key={idx} className="py-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-mono font-bold text-blue-600">{product.product_code || 'N/A'}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                                        product.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {product.status || 'N/A'}
                                    </span>
                                </div>
                                <div className="text-xs font-semibold text-slate-900">{product.product_name}</div>
                                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                                    <span>{product.category_name || 'General'}</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(product.price)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center text-slate-400 text-xs">No products found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductReport;