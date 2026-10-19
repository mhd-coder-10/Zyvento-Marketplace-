import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiService from '../api/ApiService';

const defaultSettings = {
    site_name: 'Zyvento Shopping',
    site_tagline: 'Discover Premium Deals & Trending Collections',
    announcement_text: '⚡ Free Shipping on prepaid orders above ₹499 | Express 48h Delivery | Easy 7-Day Returns',
    currency: 'INR',
    currency_symbol: '₹',
    support_email: 'support@zyvento.com',
    support_phone: '+91 1800-123-4567',
    maintenance_mode: false,
    free_shipping_threshold: 499,
    standard_delivery_fee: 49,
    express_delivery_fee: 99,
    estimated_delivery_days: 3,
    cod_enabled: true,
    min_order_amount: 99,
    max_order_amount: 200000,
    return_window_days: 7,
    allow_returns: true,
    allow_cancellation_until: 'dispatched',
    platform_commission_rate: 10,
    min_seller_payout_threshold: 1000,
    seller_auto_approval: true,
    default_gst_rate: 18,
    prices_inclusive_tax: true,
    platform_gstin: '27AABCZ1234F1Z5',
    user_registration_enabled: true,
    seller_registration_enabled: true,
    guest_checkout_enabled: true,
    razorpay_enabled: true,
    stripe_enabled: false,
};

const SettingsContext = createContext({
    settings: defaultSettings,
    loading: false,
    refreshSettings: async () => {},
    formatCurrency: (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`,
    calcShipping: (subtotal) => 0,
    isFreeShipping: (subtotal) => false,
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await ApiService.getPublicSettings();
            if (res?.data?.success && res?.data?.data) {
                const merged = {
                    ...defaultSettings,
                    ...res.data.data,
                };
                setSettings(merged);

                // Dynamically update document title based on platform settings
                if (typeof document !== 'undefined') {
                    if (merged.site_name && merged.site_tagline) {
                        document.title = `${merged.site_name} - ${merged.site_tagline}`;
                    } else if (merged.site_name) {
                        document.title = merged.site_name;
                    }
                }
            }
        } catch (err) {
            console.warn('Failed to load public settings, using defaults:', err?.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();

        // Cross-tab synchronization via storage event
        const handleStorageChange = (e) => {
            if (e.key === 'zyvento_settings_updated') {
                fetchSettings();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchSettings]);

    const refreshSettings = useCallback(async () => {
        await fetchSettings();
        try {
            localStorage.setItem('zyvento_settings_updated', Date.now().toString());
        } catch {}
    }, [fetchSettings]);

    // Format money using dynamic currency settings
    const formatCurrency = useCallback((val) => {
        const num = Number(val) || 0;
        const sym = settings.currency_symbol || '₹';
        const formatted = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(num);
        return `${sym}${formatted}`;
    }, [settings.currency_symbol]);

    // Calculate delivery charge dynamically
    const calcShipping = useCallback((subtotal) => {
        const sub = Number(subtotal) || 0;
        const threshold = Number(settings.free_shipping_threshold) || 499;
        const fee = Number(settings.standard_delivery_fee) || 49;
        return sub >= threshold ? 0 : fee;
    }, [settings.free_shipping_threshold, settings.standard_delivery_fee]);

    const isFreeShipping = useCallback((subtotal) => {
        const sub = Number(subtotal) || 0;
        const threshold = Number(settings.free_shipping_threshold) || 499;
        return sub >= threshold;
    }, [settings.free_shipping_threshold]);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                loading,
                refreshSettings,
                formatCurrency,
                calcShipping,
                isFreeShipping,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSystemSettings = () => useContext(SettingsContext);
export default SettingsContext;
