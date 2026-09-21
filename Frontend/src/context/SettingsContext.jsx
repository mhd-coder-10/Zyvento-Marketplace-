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
    return_window_days: 7,
    platform_commission_rate: 10,
    default_gst_rate: 18,
    prices_inclusive_tax: true,
};

const SettingsContext = createContext({
    settings: defaultSettings,
    loading: false,
    refreshSettings: async () => {},
});

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await ApiService.getPublicSettings();
            if (res?.data?.success && res?.data?.data) {
                setSettings((prev) => ({
                    ...prev,
                    ...res.data.data,
                }));
            }
        } catch (err) {
            console.warn('Failed to load public settings, using defaults:', err?.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSystemSettings = () => useContext(SettingsContext);
export default SettingsContext;
