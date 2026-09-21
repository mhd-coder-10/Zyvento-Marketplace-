require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

// Ensure dependent models exist
require('../models/role.model');
require('../models/permission.model');
const User = require('../models/user.model');
const Finance = require('../models/finance.model');

async function seedFinance() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce-marketplace';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB for Finance Seeding...');

        // Find super admin
        const adminUser = await User.findOne({ email: 'admin@gmail.com' }) || await User.findOne({ user_type: 'super_admin' });
        const adminId = adminUser ? adminUser._id : null;

        // Check if entries exist
        const existingCount = await Finance.countDocuments({ deleted_at: null });
        if (existingCount >= 10) {
            console.log(`Finance records already present (${existingCount} entries). Adding supplementary sample vouchers...`);
        }

        const sampleEntries = [
            // Month 1 (Current Month)
            {
                entry_code: 'FIN-202609-1001',
                entry_type: 'income',
                amount: 85000,
                tax_rate: 18,
                tax_amount: 12966.10,
                net_amount: 72033.90,
                category: 'Marketplace Commission',
                party_name: 'Marketplace Sellers Aggregated',
                payment_method: 'escrow',
                payment_reference: 'COMM-SEP2026-WK2',
                status: 'completed',
                description: 'Commission fee on electronics and fashion sales for Week 2 September',
                entry_date: new Date(2026, 8, 15, 14, 30),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202609-1002',
                entry_type: 'expense',
                amount: 48500,
                tax_rate: 18,
                tax_amount: 7398.31,
                net_amount: 41101.69,
                category: 'Cloud Infrastructure',
                party_name: 'Amazon Web Services (AWS)',
                payment_method: 'credit_card',
                payment_reference: 'AWS-INV-9921827',
                status: 'completed',
                description: 'Monthly production hosting, EC2 instances, S3 CDN, and MongoDB Atlas backup',
                entry_date: new Date(2026, 8, 10, 10, 15),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202609-1003',
                entry_type: 'income',
                amount: 24500,
                tax_rate: 18,
                tax_amount: 3737.29,
                net_amount: 20762.71,
                category: 'Logistics & Shipping Fee',
                party_name: 'Customer Shipping Collections',
                payment_method: 'gateway',
                payment_reference: 'SHIP-COLLECT-WK1',
                status: 'completed',
                description: 'Prepaid express delivery and standard order shipping charges collected',
                entry_date: new Date(2026, 8, 8, 16, 45),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202609-1004',
                entry_type: 'expense',
                amount: 19800,
                tax_rate: 18,
                tax_amount: 3020.34,
                net_amount: 16779.66,
                category: 'Logistics & Delivery Partner',
                party_name: 'Delhivery Surface Logistics Ltd',
                payment_method: 'bank_transfer',
                payment_reference: 'UTR992817261524',
                status: 'completed',
                description: 'Courier dispatch settlements for 280 fulfilled marketplace parcels',
                entry_date: new Date(2026, 8, 12, 11, 20),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202609-1005',
                entry_type: 'income',
                amount: 32000,
                tax_rate: 18,
                tax_amount: 4881.36,
                net_amount: 27118.64,
                category: 'Sponsored Ads & Promotions',
                party_name: 'UrbanStyle & Apex Brands',
                payment_method: 'gateway',
                payment_reference: 'RZP-AD-PAY-88219',
                status: 'completed',
                description: 'Homepage featured banner promotions and search boost campaigns',
                entry_date: new Date(2026, 8, 14, 9, 30),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202609-1006',
                entry_type: 'expense',
                amount: 125000,
                tax_rate: 0,
                tax_amount: 0,
                net_amount: 125000,
                category: 'Seller Settlement Payout',
                party_name: 'TechBazaar India Pvt Ltd',
                payment_method: 'bank_transfer',
                payment_reference: 'NEFT-HDFC-991823',
                status: 'reconciled',
                description: 'Bi-weekly merchant escrow settlement payout for delivered orders',
                entry_date: new Date(2026, 8, 5, 17, 0),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202609-1007',
                entry_type: 'expense',
                amount: 8200,
                tax_rate: 18,
                tax_amount: 1250.85,
                net_amount: 6949.15,
                category: 'Payment Gateway Fees',
                party_name: 'Razorpay Software Pvt Ltd',
                payment_method: 'gateway',
                payment_reference: 'RZP-SETTLE-DEDUCT',
                status: 'completed',
                description: '2% standard MDR gateway processing fee on card & netbanking volume',
                entry_date: new Date(2026, 8, 16, 18, 10),
                created_by: adminId,
            },

            // Month 2 (August 2026)
            {
                entry_code: 'FIN-202608-1001',
                entry_type: 'income',
                amount: 142000,
                tax_rate: 18,
                tax_amount: 21661.02,
                net_amount: 120338.98,
                category: 'Marketplace Commission',
                party_name: 'Independence Day Sale Collections',
                payment_method: 'escrow',
                payment_reference: 'COMM-AUG-MEGA-01',
                status: 'reconciled',
                description: '10% Platform commission on Independence Day Super Mega Sale GMV',
                entry_date: new Date(2026, 7, 18, 12, 0),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202608-1002',
                entry_type: 'expense',
                amount: 35000,
                tax_rate: 18,
                tax_amount: 5338.98,
                net_amount: 29661.02,
                category: 'Digital Marketing & Google Ads',
                party_name: 'Google India Digital Services',
                payment_method: 'credit_card',
                payment_reference: 'GOOG-ADS-AUG2026',
                status: 'completed',
                description: 'Google Performance Max, Shopping Ads, and Meta re-targeting campaigns',
                entry_date: new Date(2026, 7, 22, 15, 30),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202608-1003',
                entry_type: 'income',
                amount: 18500,
                tax_rate: 18,
                tax_amount: 2822.03,
                net_amount: 15677.97,
                category: 'Seller Subscription Fees',
                party_name: 'Gold Tier Merchants (37 Sellers)',
                payment_method: 'bank_transfer',
                payment_reference: 'SUB-GOLD-AUG26',
                status: 'completed',
                description: 'Monthly priority seller badge and verified merchant listing subscriptions',
                entry_date: new Date(2026, 7, 1, 10, 0),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202608-1004',
                entry_type: 'expense',
                amount: 21500,
                tax_rate: 0,
                tax_amount: 0,
                net_amount: 21500,
                category: 'Customer Refund Compensations',
                party_name: 'Marketplace Shoppers Pool',
                payment_method: 'gateway',
                payment_reference: 'REFUND-BATCH-AUG',
                status: 'completed',
                description: 'Direct refunds for damaged in-transit items and approved return claims',
                entry_date: new Date(2026, 7, 28, 14, 0),
                created_by: adminId,
            },

            // Month 3 (July 2026)
            {
                entry_code: 'FIN-202607-1001',
                entry_type: 'income',
                amount: 98000,
                tax_rate: 18,
                tax_amount: 14949.15,
                net_amount: 83050.85,
                category: 'Marketplace Commission',
                party_name: 'Monsoon Splash Sale',
                payment_method: 'escrow',
                payment_reference: 'COMM-JUL-MONSOON',
                status: 'reconciled',
                description: 'Net platform commission fee realized on July delivered merchandise',
                entry_date: new Date(2026, 6, 20, 11, 0),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202607-1002',
                entry_type: 'expense',
                amount: 45000,
                tax_rate: 18,
                tax_amount: 6864.41,
                net_amount: 38135.59,
                category: 'Cloud Infrastructure',
                party_name: 'Amazon Web Services (AWS)',
                payment_method: 'credit_card',
                payment_reference: 'AWS-INV-8817261',
                status: 'completed',
                description: 'July AWS cloud computing, load balancers, and CloudFront CDN bandwidth',
                entry_date: new Date(2026, 6, 10, 9, 30),
                created_by: adminId,
            },
            {
                entry_code: 'FIN-202607-1003',
                entry_type: 'expense',
                amount: 32000,
                tax_rate: 0,
                tax_amount: 0,
                net_amount: 32000,
                category: 'GST Remittance',
                party_name: 'Goods & Services Tax Network (GSTN)',
                payment_method: 'bank_transfer',
                payment_reference: 'GST-CHALLAN-JUL26',
                status: 'reconciled',
                description: 'Quarterly GSTR-3B tax payment remittance to Central & State Govt',
                entry_date: new Date(2026, 6, 20, 16, 45),
                created_by: adminId,
            }
        ];

        for (const entry of sampleEntries) {
            await Finance.findOneAndUpdate(
                { entry_code: entry.entry_code },
                { $set: entry },
                { upsert: true, new: true }
            );
        }

        console.log(`Successfully seeded ${sampleEntries.length} Amazon-grade financial journal entries.`);
        const total = await Finance.countDocuments({ deleted_at: null });
        console.log(`Total active finance entries in database: ${total}`);

        await mongoose.disconnect();
        console.log('MongoDB disconnected successfully.');
    } catch (err) {
        console.error('Error seeding finance data:', err);
        process.exit(1);
    }
}

seedFinance();
