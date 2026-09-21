import React, { useState, useEffect } from 'react';
import {
    FiChevronDown,
    FiChevronUp,
    FiStar,
    FiX,
    FiSliders,
    FiRotateCcw,
    FiCheck
} from 'react-icons/fi';
import ApiService from '../../../api/ApiService';

const ProductFilter = ({
    filters,
    onFilterChange,
    onClearFilters,
    onClose,
    isMobile = false,
}) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({
        categories: true,
        price: true,
        rating: true,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getCategories();
            if (response.data.success) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const ratingOptions = [4, 3, 2, 1];

    const pricePresets = [
        { label: 'Under ₹500', min: '', max: '500' },
        { label: '₹500 - ₹1,000', min: '500', max: '1000' },
        { label: '₹1,000 - ₹5,000', min: '1000', max: '5000' },
        { label: 'Above ₹5,000', min: '5000', max: '' },
    ];

    const isPriceActive = (preset) => {
        return filters.minPrice === preset.min && filters.maxPrice === preset.max;
    };

    const hasActiveFilters = Boolean(
        filters.category ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.rating
    );

    return (
        <div className={`bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 ${isMobile ? 'h-full overflow-y-auto' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FiSliders className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
                        {hasActiveFilters && (
                            <span className="text-[11px] text-blue-600 font-semibold">Active filters applied</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                            <FiRotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    )}
                    {isMobile && (
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* ===== CATEGORIES ===== */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection('categories')}
                    className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-slate-700 py-1"
                >
                    <span>Categories</span>
                    {expandedSections.categories ? (
                        <FiChevronUp className="text-slate-400 w-4 h-4" />
                    ) : (
                        <FiChevronDown className="text-slate-400 w-4 h-4" />
                    )}
                </button>

                {expandedSections.categories && (
                    <div className="mt-3 space-y-1 max-h-56 overflow-y-auto pr-1">
                        <button
                            onClick={() => onFilterChange('category', '')}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                                filters.category === ''
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>All Categories</span>
                            {filters.category === '' && <FiCheck className="w-3.5 h-3.5" />}
                        </button>
                        {loading ? (
                            <div className="space-y-2 pt-1">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-7 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            categories.map((category) => {
                                const isSelected = filters.category === category._id || filters.category === category.name;
                                return (
                                    <button
                                        key={category._id}
                                        onClick={() => onFilterChange('category', category._id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                                            isSelected
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="truncate">{category.name}</span>
                                        {category.product_count !== undefined && (
                                            <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded-full ${
                                                isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                {category.product_count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* ===== PRICE RANGE ===== */}
            <div className="mb-6 pt-4 border-t border-slate-100">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-slate-700 py-1"
                >
                    <span>Price Range</span>
                    {expandedSections.price ? (
                        <FiChevronUp className="text-slate-400 w-4 h-4" />
                    ) : (
                        <FiChevronDown className="text-slate-400 w-4 h-4" />
                    )}
                </button>

                {expandedSections.price && (
                    <div className="mt-3 space-y-3">
                        {/* Preset Pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {pricePresets.map((preset, idx) => {
                                const active = isPriceActive(preset);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            if (active) {
                                                onFilterChange('minPrice', '');
                                                onFilterChange('maxPrice', '');
                                            } else {
                                                onFilterChange('minPrice', preset.min);
                                                onFilterChange('maxPrice', preset.max);
                                            }
                                        }}
                                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                                            active
                                                ? 'bg-blue-50 border-blue-400 text-blue-700'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Min/Max Inputs */}
                        <div className="flex items-center gap-2 pt-1">
                            <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₹</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minPrice || ''}
                                    onChange={(e) => onFilterChange('minPrice', e.target.value)}
                                    className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <span className="text-slate-400 text-xs font-bold">to</span>
                            <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₹</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxPrice || ''}
                                    onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                                    className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== CUSTOMER RATING ===== */}
            <div className="pt-4 border-t border-slate-100">
                <button
                    onClick={() => toggleSection('rating')}
                    className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-slate-700 py-1"
                >
                    <span>Customer Ratings</span>
                    {expandedSections.rating ? (
                        <FiChevronUp className="text-slate-400 w-4 h-4" />
                    ) : (
                        <FiChevronDown className="text-slate-400 w-4 h-4" />
                    )}
                </button>

                {expandedSections.rating && (
                    <div className="mt-3 space-y-1.5">
                        <button
                            onClick={() => onFilterChange('rating', '')}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                                filters.rating === ''
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span>All Ratings</span>
                            {filters.rating === '' && <FiCheck className="w-3.5 h-3.5" />}
                        </button>
                        {ratingOptions.map((rating) => {
                            const isSelected = filters.rating === rating.toString();
                            return (
                                <button
                                    key={rating}
                                    onClick={() => onFilterChange('rating', rating.toString())}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                                        isSelected
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <FiStar
                                                    key={i}
                                                    className={`w-3.5 h-3.5 ${
                                                        i < rating
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span>& Up</span>
                                    </div>
                                    {isSelected && <FiCheck className="w-3.5 h-3.5" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Mobile Apply Button */}
            {isMobile && (
                <div className="mt-8 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductFilter;
