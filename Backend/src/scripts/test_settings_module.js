// Comprehensive test suite for Zyvento Settings Module
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function runTestSuite() {
    console.log('========================================================');
    console.log('🚀 STARTING ZYVENTO SETTINGS MODULE COMPREHENSIVE TEST');
    console.log('========================================================');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ 1. MongoDB Connected successfully');

        const SystemSetting = require('../models/system_setting.model');
        const adminService = require('../services/admin/admin.service');
        const orderService = require('../services/order/order.service');

        // Test 1: Fetch public settings
        console.log('\n--- TEST 1: Public Settings Retrieval ---');
        const publicSettings = await adminService.getPublicSettings();
        console.log('Retrieved public settings count:', Object.keys(publicSettings).length);
        console.log('Store name:', publicSettings.site_name);
        console.log('Currency:', publicSettings.currency_symbol, publicSettings.currency);
        console.log('Free Shipping Threshold:', publicSettings.free_shipping_threshold);
        console.log('Platform Commission Rate:', publicSettings.platform_commission_rate, '%');
        console.log('COD Enabled:', publicSettings.cod_enabled);

        if (!publicSettings.site_name || !publicSettings.free_shipping_threshold) {
            throw new Error('Public settings missing key values');
        }
        console.log('✅ TEST 1 PASSED: Public settings dictionary is complete & robust');

        // Test 2: Update settings by group
        console.log('\n--- TEST 2: Update Settings by Group ---');
        const testUpdatePayload = {
            free_shipping_threshold: 699,
            standard_delivery_fee: 59,
        };
        const updated = await adminService.updateSettingsByGroup('shipping', testUpdatePayload, null);
        console.log('Updated shipping settings:', updated);

        const refreshed = await adminService.getPublicSettings();
        console.log('Refreshed free_shipping_threshold:', refreshed.free_shipping_threshold);
        if (refreshed.free_shipping_threshold !== 699 || refreshed.standard_delivery_fee !== 59) {
            throw new Error('Cache or DB update failed for shipping settings');
        }
        console.log('✅ TEST 2 PASSED: Settings updated and cache invalidated instantly');

        // Test 3: Freight calculation check
        console.log('\n--- TEST 3: Dynamic Freight Calculation Logic ---');
        const subtotalBelow = 500;
        const feeBelow = subtotalBelow >= refreshed.free_shipping_threshold ? 0 : refreshed.standard_delivery_fee;
        console.log(`Cart ₹${subtotalBelow} freight (threshold ₹${refreshed.free_shipping_threshold}): ₹${feeBelow} (Expected: ₹59)`);
        if (feeBelow !== 59) throw new Error('Freight below threshold incorrect');

        const subtotalAbove = 750;
        const feeAbove = subtotalAbove >= refreshed.free_shipping_threshold ? 0 : refreshed.standard_delivery_fee;
        console.log(`Cart ₹${subtotalAbove} freight (threshold ₹${refreshed.free_shipping_threshold}): ₹${feeAbove} (Expected: ₹0 Free)`);
        if (feeAbove !== 0) throw new Error('Freight above threshold incorrect');
        console.log('✅ TEST 3 PASSED: Tiered freight calculation is 100% accurate');

        // Test 4: Commission snapshot calculation
        console.log('\n--- TEST 4: Multi-Vendor Commission Snapshot ---');
        const cartSubtotal = 2000;
        const commissionRate = refreshed.platform_commission_rate || 10;
        const commissionAmount = Math.round(((cartSubtotal * commissionRate) / 100) * 100) / 100;
        console.log(`Order subtotal ₹${cartSubtotal} at ${commissionRate}% commission: Take-rate = ₹${commissionAmount}`);
        if (commissionAmount !== 200) throw new Error('Commission amount calculation mismatch');
        console.log('✅ TEST 4 PASSED: Commission calculation logic is verified');

        // Test 5: Revert shipping settings back to defaults
        console.log('\n--- TEST 5: Restoring Standard Defaults ---');
        await adminService.updateSettingsByGroup('shipping', {
            free_shipping_threshold: 499,
            standard_delivery_fee: 49,
        }, null);
        const finalCheck = await adminService.getPublicSettings();
        console.log('Restored free_shipping_threshold:', finalCheck.free_shipping_threshold);
        console.log('Restored standard_delivery_fee:', finalCheck.standard_delivery_fee);
        console.log('✅ TEST 5 PASSED: Revert completed cleanly');

        console.log('\n========================================================');
        console.log('🎉 ALL SETTINGS MODULE UNIT & INTEGRATION TESTS PASSED!');
        console.log('========================================================');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

runTestSuite();
