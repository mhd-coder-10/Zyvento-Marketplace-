require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/environment');

const premiumProducts = [
    {
        product_name: "Apple iPhone 15 Pro Max (256 GB) - Natural Titanium",
        description: "Super Retina XDR display with ProMotion. Aerospace-grade titanium design. A17 Pro chip for next-level gaming. 48MP Main camera with 5x optical zoom.",
        brand: "Apple",
        price: 148900,
        mrp: 159900,
        discount_percent: 7,
        final_price: 148900,
        stock_quantity: 45,
        rating: 4.8,
        images: [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["iphone", "apple", "smartphone", "5g", "electronics", "mobile"],
        attributes: {
            color: "Natural Titanium",
            storage: "256GB",
            screen_size: "6.7 inch",
            camera: "48MP + 12MP + 12MP",
            battery: "4422 mAh"
        },
        status: "active",
        approval_status: "approved"
    },
    {
        product_name: "Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones",
        description: "Industry Leading Noise Canceling with 8 microphones and Auto NC Optimizer. Up to 30-hour battery life. Ultra-comfortable lightweight design with soft fit leather.",
        brand: "Sony",
        price: 26990,
        mrp: 34990,
        discount_percent: 23,
        final_price: 26990,
        stock_quantity: 80,
        rating: 4.9,
        images: [
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["headphones", "sony", "audio", "wireless", "anc", "electronics"],
        attributes: {
            color: "Silver Platinum",
            battery_life: "30 Hours",
            connectivity: "Bluetooth 5.2",
            weight: "250g"
        },
        status: "active",
        approval_status: "approved"
    },
    {
        product_name: "Samsung Galaxy Watch 6 Classic LTE (47mm, Black)",
        description: "Rotating bezel with refined stainless steel styling. Advanced sleep coaching, Body Composition analysis, and personalized heart rate zones.",
        brand: "Samsung",
        price: 33999,
        mrp: 40999,
        discount_percent: 17,
        final_price: 33999,
        stock_quantity: 60,
        rating: 4.7,
        images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["watch", "smartwatch", "samsung", "wearable", "fitness", "electronics"],
        attributes: {
            dial_size: "47mm",
            connectivity: "4G LTE + Bluetooth",
            display: "Sapphire Crystal Super AMOLED"
        },
        status: "active",
        approval_status: "approved"
    },
    {
        product_name: "MacBook Air 15-inch M3 Chip (16GB Unified Memory, 512GB SSD)",
        description: "Lean, mean, M3 machine. Liquid Retina display, 18 hours of battery life, 1080p FaceTime HD camera, and spatial audio with Dolby Atmos.",
        brand: "Apple",
        price: 134900,
        mrp: 144900,
        discount_percent: 7,
        final_price: 134900,
        stock_quantity: 25,
        rating: 4.9,
        images: [
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["laptop", "macbook", "apple", "m3", "computers", "electronics"],
        attributes: {
            processor: "Apple M3 8-core CPU",
            ram: "16GB Unified Memory",
            storage: "512GB SSD",
            screen: "15.3 inch Liquid Retina"
        },
        status: "active",
        approval_status: "approved"
    },
    {
        product_name: "Nike Air Zoom Pegasus 40 Men's Road Running Shoes",
        description: "A springy ride for every run. The Pegasus returns with a familiar, just-for-you feel to help you accomplish your fitness goals with Nike React foam.",
        brand: "Nike",
        price: 7995,
        mrp: 10495,
        discount_percent: 24,
        final_price: 7995,
        stock_quantity: 110,
        rating: 4.6,
        images: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["shoes", "nike", "running", "fashion", "sneakers", "sports"],
        attributes: {
            size: "UK 8, UK 9, UK 10",
            color: "Bright Crimson / Obsidian",
            material: "Breathable Engineered Mesh"
        },
        status: "active",
        approval_status: "approved"
    },
    {
        product_name: "Premium Solid Sheesham Wood 6-Seater Dining Table Set",
        description: "Crafted from 100% natural seasoned Sheesham rosewood with walnut finish. Includes 6 ergonomically cushioned chairs for unmatched comfort and luxury.",
        brand: "WoodCraft",
        price: 24999,
        mrp: 38999,
        discount_percent: 36,
        final_price: 24999,
        stock_quantity: 15,
        rating: 4.7,
        images: [
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["furniture", "dining", "table", "wooden", "home", "living"],
        attributes: {
            material: "Solid Sheesham Wood",
            seating_capacity: "6 Seater",
            finish: "Natural Walnut"
        },
        status: "active",
        approval_status: "approved"
    }
];

async function seed() {
    try {
        await mongoose.connect(config.MONGODB_URI);
        const db = mongoose.connection.db;
        const productsCol = db.collection('products');
        const categoriesCol = db.collection('categories');

        // 1. Activate all existing products in DB
        await productsCol.updateMany(
            {},
            { $set: { status: 'active', approval_status: 'approved' } }
        );
        console.log('✅ Activated all existing products in DB.');

        // 2. Fetch or create a default category
        let defaultCategory = await categoriesCol.findOne({});
        if (!defaultCategory) {
            const catRes = await categoriesCol.insertOne({
                name: "Electronics & Gadgets",
                category_name: "Electronics & Gadgets",
                slug: "electronics-gadgets",
                status: "active",
                created_at: new Date()
            });
            defaultCategory = { _id: catRes.insertedId };
        }

        // 3. Upsert premium products
        for (const item of premiumProducts) {
            const existing = await productsCol.findOne({ product_name: item.product_name });
            if (!existing) {
                await productsCol.insertOne({
                    ...item,
                    product_code: 'ZV-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    sku: 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                    category_id: defaultCategory._id,
                    created_at: new Date(),
                    updated_at: new Date()
                });
                console.log(`➕ Added: ${item.product_name}`);
            } else {
                await productsCol.updateOne(
                    { _id: existing._id },
                    { $set: { ...item, status: 'active', approval_status: 'approved' } }
                );
                console.log(`🔄 Updated: ${item.product_name}`);
            }
        }

        const count = await productsCol.countDocuments({ status: 'active', approval_status: 'approved' });
        console.log(`🎉 Total Active & Approved Products in DB: ${count}`);
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
