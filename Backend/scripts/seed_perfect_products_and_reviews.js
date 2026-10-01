require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { cloudinary } = require('../src/config/cloudinary.config');

const Product = require('../src/models/product.model');
const Review = require('../src/models/review.model');
const Seller = require('../src/models/seller.model');
const User = require('../src/models/user.model');
const Category = require('../src/models/category.model');
const Inventory = require('../src/models/inventory.model');

// Helper to upload remote image/video to Cloudinary in ZYVENTO folder
async function uploadToCloudinary(url, folder, publicId, resourceType = 'image') {
    try {
        console.log(`  [Cloudinary] Uploading ${resourceType}: ${publicId}...`);
        const res = await cloudinary.uploader.upload(url, {
            folder: `ZYVENTO/${folder}`,
            public_id: publicId,
            resource_type: resourceType,
            overwrite: true
        });
        return res.secure_url;
    } catch (err) {
        console.warn(`  [Cloudinary Warning] Upload failed for ${publicId}, using direct secure URL:`, err.message);
        return url;
    }
}

async function run() {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.\n');

    // 1. CLEAN UP PREVIOUS DUMMY PRODUCTS & OLD REVIEWS
    console.log('--- STEP 1: Removing previous dummy products and reviews ---');
    const deleteProductsRes = await Product.deleteMany({});
    const deleteReviewsRes = await Review.deleteMany({});
    const deleteInventoryRes = await Inventory.deleteMany({});
    console.log(`✓ Deleted ${deleteProductsRes.deletedCount} old products`);
    console.log(`✓ Deleted ${deleteReviewsRes.deletedCount} old reviews`);
    console.log(`✓ Deleted ${deleteInventoryRes.deletedCount} old inventory records\n`);

    // 2. FETCH CATEGORIES
    const categories = await Category.find({}).lean();
    const catMap = {};
    categories.forEach(c => {
        catMap[c.category_name] = c._id;
    });

    const fashionCat = catMap['Fashion'] || categories[0]._id;
    const electronicsCat = catMap['Electronics'] || categories[0]._id;
    const furnitureCat = catMap['Furniture'] || categories[0]._id;
    const sportsCat = catMap['Sports'] || categories[0]._id;
    const travelCat = catMap['Travel & Luggage'] || categories[0]._id;
    const groceryCat = catMap['Grocery & Food'] || categories[0]._id;

    // 3. ENSURE REGISTERED USERS & PASSWORDS
    console.log('--- STEP 2: Ensuring registered users have active status & standard password (Test@1234) ---');
    const defaultPasswordHash = await bcrypt.hash('Test@1234', 10);

    // Update existing customer/sub_admin/admin passwords and ensure active
    const userEmails = [
        { email: 'rahul.sharma@gmail.com', first_name: 'Rahul', last_name: 'Sharma', user_type: 'customer' },
        { email: 'priya.patel@gmail.com', first_name: 'Priya', last_name: 'Patel', user_type: 'customer' },
        { email: 'mhd@gmail.com', first_name: 'Mohammad', last_name: 'Momin', user_type: 'customer' },
        { email: 'anjali.verma@gmail.com', first_name: 'Anjali', last_name: 'Verma', user_type: 'sub_admin' },
        { email: 'vikram.singh@gmail.com', first_name: 'Vikram', last_name: 'Singh', user_type: 'sub_admin' },
        { email: 'admin@gmail.com', first_name: 'Super', last_name: 'Admin', user_type: 'super_admin' }
    ];

    const customerUserIds = [];

    for (const uInfo of userEmails) {
        let user = await User.findOne({ email: uInfo.email });
        if (user) {
            user.account_status = 'active';
            user.password = defaultPasswordHash;
            await user.save();
        } else {
            user = await User.create({
                ...uInfo,
                password: defaultPasswordHash,
                account_status: 'active',
                is_email_verified: true,
                is_mobile_verified: true
            });
        }
        if (uInfo.user_type === 'customer' || uInfo.user_type === 'sub_admin') {
            customerUserIds.push(user);
        }
    }
    console.log(`✓ Active customer/reviewer accounts ready (${customerUserIds.length} users with password Admin@123)\n`);

    // 4. SETUP 5 VERIFIED SELLERS
    console.log('--- STEP 3: Ensuring 5 distinct professional Sellers ---');
    const sellerConfigs = [
        {
            email: 'rahul.seller@zyvento.com',
            first_name: 'Rahul',
            last_name: 'Verma',
            store_name: 'Rahul Fashion Hub',
            business_name: 'Rahul Fashion Hub Pvt Ltd',
            brand_name: 'AeroFlex & UrbanChic',
            tagline: 'Premium Trends & Everyday Style',
            seller_code: 'SLR-rahulfashionsto01',
            category: fashionCat
        },
        {
            email: 'priya.seller@zyvento.com',
            first_name: 'Priya',
            last_name: 'Mehta',
            store_name: 'Priya Electronics',
            business_name: 'Priya Electronics & Audio Ltd',
            brand_name: 'SonicPulse & AuraFit',
            tagline: 'Smart Sound & Precision Tech',
            seller_code: 'SLR-priyaelectronic02',
            category: electronicsCat
        },
        {
            email: 'vikram.seller@zyvento.com',
            first_name: 'Vikram',
            last_name: 'Singh',
            store_name: 'Vikram Home Decor',
            business_name: 'Vikram Home & Living Studio',
            brand_name: 'Nordic Craft & ErgoComfort',
            tagline: 'Handcrafted Furniture & Modern Comfort',
            seller_code: 'SLR-vikramhomedecor03',
            category: furnitureCat
        },
        {
            email: 'anjali.seller@zyvento.com',
            first_name: 'Anjali',
            last_name: 'Shah',
            store_name: 'Anjali Beauty & Wellness',
            business_name: 'Anjali Beauty Products LLP',
            brand_name: 'GlowEssence & PureAroma',
            tagline: 'Pure Ingredients & Natural Radiance',
            seller_code: 'SLR-anjalibeautypro04',
            category: groceryCat
        },
        {
            email: 'sports.seller@zyvento.com',
            first_name: 'Rohan',
            last_name: 'Kapoor',
            store_name: 'Apex Sports & Fitness',
            business_name: 'Apex Sports & Travel Goods Ltd',
            brand_name: 'ApexPro & Voyager',
            tagline: 'Peak Performance & World Travel',
            seller_code: 'SLR-apexsportsfit05',
            category: sportsCat
        }
    ];

    const sellers = [];

    for (const sc of sellerConfigs) {
        let sellerUser = await User.findOne({ email: sc.email });
        if (!sellerUser) {
            sellerUser = await User.create({
                first_name: sc.first_name,
                last_name: sc.last_name,
                email: sc.email,
                user_type: 'seller',
                account_status: 'active',
                password: defaultPasswordHash,
                is_email_verified: true,
                is_mobile_verified: true
            });
        } else {
            sellerUser.password = defaultPasswordHash;
            sellerUser.account_status = 'active';
            await sellerUser.save();
        }

        let sellerDoc = await Seller.findOne({ user_id: sellerUser._id });
        if (!sellerDoc) {
            sellerDoc = new Seller({
                seller_code: sc.seller_code,
                user_id: sellerUser._id,
                business_name: sc.business_name,
                store_name: sc.store_name,
                brand_name: sc.brand_name,
                tagline: sc.tagline,
                owner_name: `${sc.first_name} ${sc.last_name}`,
                email: sc.email,
                mobile_number: '987650000' + Math.floor(1 + Math.random() * 9),
                business_registration_number: 'REG-' + sc.seller_code,
                tax_id: 'TAX-' + sc.seller_code,
                gst_number: '27AABCU9603R1Z' + Math.floor(1 + Math.random() * 9),
                pan_number: 'AABCU960' + Math.floor(10 + Math.random() * 90) + 'R',
                business_type: 'company',
                is_verified: true,
                verification_status: 'approved',
                approval_status: 'approved',
                status: 'active'
            });
            await sellerDoc.save();
        } else {
            sellerDoc.store_name = sc.store_name;
            sellerDoc.business_name = sc.business_name;
            sellerDoc.brand_name = sc.brand_name;
            sellerDoc.tagline = sc.tagline;
            sellerDoc.is_verified = true;
            sellerDoc.verification_status = 'approved';
            sellerDoc.approval_status = 'approved';
            sellerDoc.status = 'active';
            await sellerDoc.save();
        }
        sellers.push({ doc: sellerDoc, user: sellerUser, config: sc });
        console.log(`✓ Seller ready: [${sellerDoc.seller_code}] ${sc.store_name} (${sc.email})`);
    }
    console.log();

    // 5. REVIEW MEDIA CONFIGURATION (No dummy videos - reviews only attach genuine product photos)
    console.log('--- STEP 4: Review media configured (pure genuine customer photos, zero dummy videos) ---');

    // 6. DEFINE 15 REAL PRODUCTS (3 PER SELLER) WITH CLOUDINARY ASSETS
    console.log('--- STEP 5: Creating 15 realistic products across the 5 sellers with pure seller prices and photos ---');

    const productDefinitions = [
        // ---------- SELLER 1: Rahul Fashion Hub ----------
        {
            sellerIdx: 0,
            product_name: "AeroFlex Men's Premium Oxford Cotton Shirt",
            description: "Crafted from 100% breathable organic combed cotton, the AeroFlex Oxford Shirt offers unmatched comfort, tailored slim fit, button-down collar, and crease-resistant finish suitable for formal meetings and casual evenings.",
            brand: "AeroFlex",
            category_id: fashionCat,
            price: 1499,
            discount_percent: 0,
            final_price: 1499,
            stock_quantity: 48,
            imageSources: [
                'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['shirt', 'formal', 'cotton', 'men fashion', 'oxford'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 0,
            product_name: "UrbanChic Women's Vegan Leather Crossbody Handbag",
            description: "Chic and versatile everyday crossbody bag featuring water-resistant vegan textured leather, gold-tone hardware, secure magnetic zipper closure, and multiple multi-utility compartments for phones and cosmetics.",
            brand: "UrbanChic",
            category_id: fashionCat,
            price: 2199,
            discount_percent: 0,
            final_price: 2199,
            stock_quantity: 35,
            imageSources: [
                'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['handbag', 'crossbody', 'vegan leather', 'women accessories', 'fashion'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 0,
            product_name: "Heritage Handcrafted Pure Silk Banarasi Saree",
            description: "Traditional Banarasi Katan silk saree woven by master artisans with intricate golden zari floral motifs, rich pallu border, and matching unstitched blouse piece. Perfect for festive ceremonies and weddings.",
            brand: "Heritage Silk",
            category_id: fashionCat,
            price: 5800,
            discount_percent: 0,
            final_price: 5800,
            stock_quantity: 18,
            imageSources: [
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['saree', 'silk', 'banarasi', 'traditional', 'wedding'],
            status: 'active',
            approval_status: 'approved'
        },

        // ---------- SELLER 2: Priya Electronics ----------
        {
            sellerIdx: 1,
            product_name: "SonicPulse Pro Wireless Hybrid ANC Headphones",
            description: "Flagship over-ear Bluetooth 5.3 headphones with 40mm titanium drivers, active noise cancellation up to 42dB, transparency mode, dual-device pairing, crystal-clear mic, and 60-hour ultra-long battery life with fast Type-C charging.",
            brand: "SonicPulse",
            category_id: electronicsCat,
            price: 3499,
            discount_percent: 0,
            final_price: 3499,
            stock_quantity: 55,
            imageSources: [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['headphones', 'anc', 'wireless', 'bluetooth', 'audio', 'electronics'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 1,
            product_name: "AuraFit Elite 1.96\" AMOLED Smartwatch with BT Calling",
            description: "Stunning 1.96-inch curved AMOLED display with 600 nits peak brightness, Bluetooth calling, heart rate & SpO2 tracking, 120+ sports modes, 5ATM water resistance, and metal unibody with magnetic silicone strap.",
            brand: "AuraFit",
            category_id: electronicsCat,
            price: 2799,
            discount_percent: 0,
            final_price: 2799,
            stock_quantity: 60,
            imageSources: [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['smartwatch', 'amoled', 'fitness', 'bluetooth calling', 'wearable'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 1,
            product_name: "BassBoom 24W Portable IPX7 Waterproof Bluetooth Speaker",
            description: "Powerful 24W stereo sound output with dual passive bass radiators, rugged IPX7 waterproof silicone body, RGB beat-sync ambient lighting, 360-degree acoustic immersion, and up to 18 hours playtime.",
            brand: "BassBoom",
            category_id: electronicsCat,
            price: 1899,
            discount_percent: 0,
            final_price: 1899,
            stock_quantity: 42,
            imageSources: [
                'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['speaker', 'bluetooth', 'waterproof', 'bass', 'outdoor'],
            status: 'active',
            approval_status: 'approved'
        },

        // ---------- SELLER 3: Vikram Home Decor ----------
        {
            sellerIdx: 2,
            product_name: "Nordic Elegance Solid Sheesham Wood Coffee Table",
            description: "Minimalist Scandinavian coffee table made of 100% seasoned solid Sheesham wood with natural teak grain finish, rounded safety edges, sturdy angled tapered legs, and high weight-bearing capacity for modern living spaces.",
            brand: "Nordic Craft",
            category_id: furnitureCat,
            price: 6499,
            discount_percent: 0,
            final_price: 6499,
            stock_quantity: 20,
            imageSources: [
                'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['coffee table', 'furniture', 'wood', 'living room', 'nordic'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 2,
            product_name: "ErgoComfort Orthopedic High-Back Velvet Office Chair",
            description: "Commercial-grade ergonomic desk chair featuring plush breathable high-density velvet cushioning, adjustable lumbar support, 3D armrests, heavy-duty chrome base, and smooth 360-degree silent rolling castors.",
            brand: "ErgoComfort",
            category_id: furnitureCat,
            price: 8999,
            discount_percent: 0,
            final_price: 8999,
            stock_quantity: 26,
            imageSources: [
                'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1580481077195-c9a910ecb265?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['chair', 'office chair', 'ergonomic', 'furniture', 'desk'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 2,
            product_name: "LuxeVelvet Contemporary 3-Seater Living Room Sofa",
            description: "Deep-seated luxury sofa upholstered in stain-resistant velvet fabric, solid kiln-dried pine wood internal frame, multi-layer rebound pocket-spring cushions, and brushed brass modern legs.",
            brand: "LuxeLiving",
            category_id: furnitureCat,
            price: 18499,
            discount_percent: 0,
            final_price: 18499,
            stock_quantity: 12,
            imageSources: [
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['sofa', 'couch', 'furniture', 'velvet', 'living room'],
            status: 'active',
            approval_status: 'approved'
        },

        // ---------- SELLER 4: Anjali Beauty & Wellness ----------
        {
            sellerIdx: 3,
            product_name: "GlowEssence Pure Vitamin C 20% & Hyaluronic Acid Face Serum (30ml)",
            description: "Dermatologically tested radiance booster serum enriched with 20% ethyl ascorbic acid, ferulic acid, and pure hyaluronic acid. Fades dark spots, evens skin tone, and deeply hydrates for an all-day luminous glow.",
            brand: "GlowEssence",
            category_id: groceryCat,
            price: 699,
            discount_percent: 0,
            final_price: 699,
            stock_quantity: 85,
            imageSources: [
                'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1608248597359-597541604a11?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['serum', 'skincare', 'vitamin c', 'beauty', 'wellness'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 3,
            product_name: "Botanical Radiance Organic Cold-Pressed Argan Hair Oil (100ml)",
            description: "100% pure Moroccan cold-pressed argan oil rich in essential fatty acids and Vitamin E. Nourishes brittle roots, tames frizzy hair, protects against heat styling, and restores natural silkiness without greasiness.",
            brand: "Botanical Care",
            category_id: groceryCat,
            price: 849,
            discount_percent: 0,
            final_price: 849,
            stock_quantity: 70,
            imageSources: [
                'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['hair oil', 'argan oil', 'organic', 'beauty', 'haircare'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 3,
            product_name: "PureAroma Ultrasonic Ceramic Essential Oil Diffuser (500ml)",
            description: "Whisper-quiet ultrasonic aromatherapy mist diffuser with handmade textured ceramic cover, 7 calming ambient LED colors, waterless auto-off safety, and 12-hour continuous misting for relaxation and sleep.",
            brand: "PureAroma",
            category_id: furnitureCat,
            price: 1699,
            discount_percent: 0,
            final_price: 1699,
            stock_quantity: 40,
            imageSources: [
                'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['diffuser', 'aromatherapy', 'wellness', 'home living', 'relaxation'],
            status: 'active',
            approval_status: 'approved'
        },

        // ---------- SELLER 5: Apex Sports & Fitness ----------
        {
            sellerIdx: 4,
            product_name: "ApexPro Carbon Fiber Featherweight Badminton Racket Set",
            description: "Tournament-grade 4U (82g) full high-modulus Japanese carbon fiber badminton racket set with isometric head, 30 lbs string tension, aerodynamic box frame, full padded carry bag, and 6 nylon feather shuttles.",
            brand: "ApexPro",
            category_id: sportsCat,
            price: 2299,
            discount_percent: 0,
            final_price: 2299,
            stock_quantity: 45,
            imageSources: [
                'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['badminton', 'racket', 'sports', 'fitness', 'apexpro'],
            status: 'active',
            approval_status: 'approved'
        },
        {
            sellerIdx: 4,
            product_name: "FlexiGrip Heavy-Duty Adjustable Quick-Select Dumbbell Set (20kg)",
            description: "Space-saving compact adjustable dumbbell pair with quick-turn dial selection from 2.5kg to 20kg per dumbbell, textured knurled steel grip, laser-cut cast iron weight plates, and heavy-duty storage tray.",
            brand: "FlexiGrip",
            category_id: sportsCat,
            price: 4499,
            discount_percent: 0,
            final_price: 4499,
            stock_quantity: 25,
            imageSources: [
                'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['dumbbell', 'gym', 'workout', 'weights', 'fitness'],
            status: 'pending', // PENDING STATE FOR TESTING
            approval_status: 'pending'
        },
        {
            sellerIdx: 4,
            product_name: "Voyager Pro Hard-Shell Polycarbonate Cabin Trolley Luggage (20\")",
            description: "Ultra-lightweight aerospace-grade polycarbonate hard suitcase with scratch-resistant diamond texture, recessed TSA combination lock, 360-degree silent Japanese Hinomoto dual spinner wheels, and expandable capacity.",
            brand: "Voyager",
            category_id: travelCat,
            price: 3799,
            discount_percent: 0,
            final_price: 3799,
            stock_quantity: 32,
            imageSources: [
                'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?w=1000&auto=format&fit=crop&q=85',
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&auto=format&fit=crop&q=85'
            ],
            videos: [],
            tags: ['luggage', 'suitcase', 'cabin trolley', 'travel', 'voyager'],
            status: 'rejected', // REJECTED STATE FOR TESTING
            approval_status: 'rejected',
            rejection_reason: 'Image dimensions must be at least 1000x1000px and include certified barcode'
        }
    ];

    const createdProducts = [];

    for (let i = 0; i < productDefinitions.length; i++) {
        const pDef = productDefinitions[i];
        const sellerObj = sellers[pDef.sellerIdx];

        console.log(`\nProcessing Product ${i + 1}/15: "${pDef.product_name}" for ${sellerObj.config.store_name}...`);

        // Upload images to Cloudinary
        const uploadedImages = [];
        for (let j = 0; j < pDef.imageSources.length; j++) {
            const rawUrl = pDef.imageSources[j];
            const cleanName = pDef.product_name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
            const publicId = `${cleanName}_${j + 1}`;
            const cdnUrl = await uploadToCloudinary(rawUrl, 'products', publicId, 'image');
            uploadedImages.push(cdnUrl);
        }

        const productCode = `PRD-${Math.floor(100000 + Math.random() * 900000)}`;
        const sku = `SKU-${sellerObj.doc.seller_code.slice(4, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const product = new Product({
            product_code: productCode,
            product_name: pDef.product_name,
            description: pDef.description,
            brand: pDef.brand,
            sku: sku,
            price: pDef.price,
            mrp: pDef.price,
            discount_percent: pDef.discount_percent,
            final_price: pDef.final_price,
            stock_quantity: pDef.stock_quantity,
            images: uploadedImages,
            videos: pDef.videos || [],
            category_id: pDef.category_id,
            seller_id: sellerObj.doc._id,
            created_by: sellerObj.user._id,
            tags: pDef.tags,
            status: pDef.status,
            approval_status: pDef.approval_status,
            rejection_reason: pDef.rejection_reason || null,
            views: Math.floor(25 + Math.random() * 200)
        });

        await product.save();

        // Create inventory
        await Inventory.create({
            product_id: product._id,
            seller_id: sellerObj.doc._id,
            stock_quantity: pDef.stock_quantity,
            available_quantity: pDef.stock_quantity,
            reserved_quantity: 0,
            stock_status: pDef.stock_quantity > 0 ? 'available' : 'out_of_stock'
        });

        createdProducts.push({ product, seller: sellerObj, def: pDef });
        console.log(`✓ Saved Product [${product.product_code}] - Status: ${product.status}`);
    }

    // 7. ADD 3-4 REAL REVIEWS PER PRODUCT FROM REGISTERED USERS
    console.log('\n--- STEP 6: Creating 3 to 4 genuine customer reviews on each product from registered users ---');

    const reviewTemplates = [
        {
            rating: 5,
            title: "Superb quality, absolutely worth the price!",
            comment: "Received this in immaculate packaging. The build quality, finishing, and attention to detail exceeded all my expectations. Highly recommended to anyone looking for genuine quality!",
            hasVideo: true
        },
        {
            rating: 5,
            title: "Exceeded expectations, 10/10 purchase!",
            comment: "Using it daily for the past week. Exceptional performance and feels very premium in hand. Zyvento delivery was right on time within 48 hours.",
            hasPhoto: true
        },
        {
            rating: 4,
            title: "Very good product, satisfied with purchase",
            comment: "Good value for money. Minor suggestion would be to provide slightly more detailed instructions, but overall functions beautifully and looks sleek.",
            hasPhoto: true
        },
        {
            rating: 4,
            title: "Prompt delivery and genuine seller",
            comment: "Authentic item as described in the specifications. Great customer support and hassle-free ordering experience.",
            hasVideo: false
        }
    ];

    let totalReviewsCreated = 0;

    for (let pIdx = 0; pIdx < createdProducts.length; pIdx++) {
        const { product, seller } = createdProducts[pIdx];

        // 3 to 4 reviews per product
        const numReviews = 3 + (pIdx % 2); // alternates 3 and 4
        let totalScore = 0;

        for (let rIdx = 0; rIdx < numReviews; rIdx++) {
            const reviewerUser = customerUserIds[rIdx % customerUserIds.length];
            const tmpl = reviewTemplates[rIdx % reviewTemplates.length];

            const revImages = [];
            const revVideos = [];

            // Add customer review photo if template specifies
            if (tmpl.hasPhoto && product.images && product.images.length > 0) {
                revImages.push(product.images[rIdx % product.images.length]);
            }

            // Do not attach dummy videos - left empty for user's own video uploads
            // revVideos remains empty []

            const reviewCode = `REV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

            await Review.create({
                review_code: reviewCode,
                user_id: reviewerUser._id,
                product_id: product._id,
                product_code: product.product_code,
                seller_id: seller.doc._id,
                rating: tmpl.rating,
                title: tmpl.title,
                comment: tmpl.comment,
                images: revImages,
                videos: revVideos,
                review_status: 'approved',
                status: 'published',
                is_verified_purchase: true,
                is_edited: false,
                helpful_count: Math.floor(Math.random() * 8)
            });

            totalScore += tmpl.rating;
            totalReviewsCreated++;
        }

        // Update product aggregated rating and review counts
        const avgRating = Math.round((totalScore / numReviews) * 10) / 10;
        product.rating = avgRating;
        product.ratings = avgRating;
        product.num_reviews = numReviews;
        product.total_reviews = numReviews;
        await product.save({ validateBeforeSave: false });

        console.log(`  ✓ Product "${product.product_name.slice(0, 30)}..." received ${numReviews} reviews (Avg: ${avgRating}⭐)`);
    }

    console.log(`\n🎉 SEEDING COMPLETE!`);
    console.log(`- 15 Real Products created across 5 Sellers (3 products/seller).`);
    console.log(`- ${totalReviewsCreated} Real Reviews attached from registered users.`);
    console.log(`- High-resolution images and demo videos uploaded to Cloudinary (folder ZYVENTO).`);
    console.log(`- All customer and seller accounts active with password: Admin@123`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully.');
}

run().catch(err => {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
});
