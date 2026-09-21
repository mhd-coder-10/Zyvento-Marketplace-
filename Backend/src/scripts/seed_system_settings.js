require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const SystemSetting = require('../models/system_setting.model');

const defaultSettings = [
    // GENERAL / BRANDING
    { key: 'site_name', value: 'Zyvento Shopping', group: 'general', data_type: 'string', is_public: true, description: 'Store name shown in header and titles' },
    { key: 'site_tagline', value: 'Discover Premium Deals & Trending Collections', group: 'general', data_type: 'string', is_public: true, description: 'Store tagline' },
    { key: 'announcement_text', value: '⚡ Free Shipping on prepaid orders above ₹499 | Express 48h Delivery | Easy 7-Day Returns', group: 'general', data_type: 'string', is_public: true, description: 'Top banner announcement' },
    { key: 'currency', value: 'INR', group: 'general', data_type: 'string', is_public: true, description: 'Default currency code' },
    { key: 'currency_symbol', value: '₹', group: 'general', data_type: 'string', is_public: true, description: 'Default currency symbol' },
    { key: 'support_email', value: 'support@zyvento.com', group: 'general', data_type: 'string', is_public: true, description: 'Customer support email' },
    { key: 'support_phone', value: '+91 1800-123-4567', group: 'general', data_type: 'string', is_public: true, description: 'Customer support toll-free phone' },
    { key: 'maintenance_mode', value: false, group: 'general', data_type: 'boolean', is_public: true, description: 'Platform maintenance mode toggle' },

    // SHIPPING & FULFILLMENT
    { key: 'free_shipping_threshold', value: 499, group: 'shipping', data_type: 'number', is_public: true, description: 'Minimum cart value for 100% free delivery' },
    { key: 'standard_delivery_fee', value: 49, group: 'shipping', data_type: 'number', is_public: true, description: 'Standard shipping charge when below threshold' },
    { key: 'express_delivery_fee', value: 99, group: 'shipping', data_type: 'number', is_public: true, description: 'Express priority shipping fee' },
    { key: 'estimated_delivery_days', value: 3, group: 'shipping', data_type: 'number', is_public: true, description: 'Standard estimated delivery days' },

    // ORDERS & POLICIES
    { key: 'cod_enabled', value: true, group: 'order', data_type: 'boolean', is_public: true, description: 'Allow Cash on Delivery' },
    { key: 'min_order_amount', value: 99, group: 'order', data_type: 'number', is_public: true, description: 'Minimum order amount required to checkout' },
    { key: 'max_order_amount', value: 200000, group: 'order', data_type: 'number', is_public: true, description: 'Maximum allowed cart order value' },
    { key: 'return_window_days', value: 7, group: 'order', data_type: 'number', is_public: true, description: 'Customer return window in days' },
    { key: 'allow_cancellation_until', value: 'dispatched', group: 'order', data_type: 'string', is_public: true, description: 'Order stage until which buyer can cancel' },

    // MARKETPLACE & COMMISSION
    { key: 'platform_commission_rate', value: 10, group: 'commission', data_type: 'number', is_public: true, description: 'Standard marketplace fee percentage' },
    { key: 'min_seller_payout_threshold', value: 1000, group: 'commission', data_type: 'number', is_public: false, description: 'Minimum wallet balance required for seller payout' },
    { key: 'seller_auto_approval', value: true, group: 'seller', data_type: 'boolean', is_public: false, description: 'Auto-approve newly registered merchant accounts' },

    // TAXES (GST)
    { key: 'default_gst_rate', value: 18, group: 'tax', data_type: 'number', is_public: true, description: 'Default GST percentage for products' },
    { key: 'prices_inclusive_tax', value: true, group: 'tax', data_type: 'boolean', is_public: true, description: 'Are catalog prices shown inclusive of GST' },
    { key: 'platform_gstin', value: '27AABCZ1234F1Z5', group: 'tax', data_type: 'string', is_public: true, description: 'Zyvento platform GST number' },

    // SECURITY & SYSTEM
    { key: 'user_registration_enabled', value: true, group: 'security', data_type: 'boolean', is_public: true, description: 'Allow new customer registrations' },
    { key: 'guest_checkout_enabled', value: true, group: 'security', data_type: 'boolean', is_public: true, description: 'Allow unauthenticated cart additions' },
];

async function seedSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding settings');

        for (const item of defaultSettings) {
            await SystemSetting.findOneAndUpdate(
                { key: item.key },
                { ...item, status: 'active' },
                { upsert: true, new: true }
            );
        }

        console.log(`Successfully seeded ${defaultSettings.length} Amazon-grade settings!`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed settings:', err);
        process.exit(1);
    }
}

seedSettings();
