// Handles all seller related business logic
// Manages seller profile, dashboard, documents, products, orders
// Also handles reports, and settings

const mongoose = require('mongoose');
const Seller = require('../../models/seller.model');
const User = require('../../models/user.model');
const Product = require('../../models/product.model');
const Order = require('../../models/order.model');
const OrderItem = require('../../models/order_item.model');
const Review = require('../../models/review.model');
const Category = require('../../models/category.model');
const SubCategory = require('../../models/sub_category.model');
const Notification = require('../../models/notification.model');
const ApiError = require('../../utils/apiError');
const cloudinaryHelper = require('../../utils/cloudinary.helper');
const logger = require('../../utils/logger');
const constants = require('../../config/constants');


class SellerService {

    // ============ PUBLIC PROFILE ============
    async getPublicProfile(sellerId) {
        const seller = await Seller.findById(sellerId)
            .select('business_name store_name logo banner tagline store_description owner_name business_type business_address settings rating total_orders total_revenue')
            .populate('user_id', 'first_name last_name profile_image');

        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        const productCount = await Product.countDocuments({
            seller_id: sellerId,
            status: 'active'
        });

        const reviewCount = await Review.countDocuments({
            seller_id: sellerId,
            review_status: 'approved'
        });

        return {
            ...seller.toObject(),
            productCount,
            reviewCount
        };
    }

    async getSellerProducts({ sellerId, page = 1, limit = 10, category = null, sortBy = 'created_at', sortOrder = 'desc' }) {
        const query = {
            seller_id: sellerId,
            status: 'active',
            approval_status: 'approved'
        };

        if (category) {
            query.category_id = category;
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category_id', 'category_name')
                .populate('sub_category_id', 'sub_category_name')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Product.countDocuments(query)
        ]);

        return {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getSellerReviews({ sellerId, page = 1, limit = 10, rating = null }) {
        const query = {
            seller_id: sellerId,
            status: 'published'
        };

        if (rating) {
            query.rating = parseInt(rating);
        }

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'first_name last_name profile_image')
                .populate('product_id', 'product_name images')
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Review.countDocuments(query)
        ]);

        return {
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ============ SELLER RESOLUTION HELPER ============
    async resolveSeller(sellerId, userId = null) {
        let seller = null;
        if (sellerId && mongoose.isValidObjectId(sellerId)) {
            seller = await Seller.findById(sellerId);
        }
        if (!seller && userId && mongoose.isValidObjectId(userId)) {
            seller = await Seller.findOne({ user_id: userId });
        }
        if (!seller) {
            throw ApiError.notFound('Seller account not found');
        }
        return seller;
    }

    // ============ SELLER PROFILE ============
    async getProfile(sellerId, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);
        await seller.populate([
            { path: 'user_id', select: 'first_name last_name email mobile_number profile_image' },
            { path: 'approved_by', select: 'first_name last_name email' }
        ]);

        return seller;
    }

    async updateProfile(sellerId, updateData, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);

        const allowedFields = [
            'business_name', 'store_name', 'brand_name', 'tagline', 'store_description',
            'logo', 'banner', 'owner_name', 'mobile_number', 'email',
            'business_type', 'gst_number', 'pan_number', 'tax_id',
            'business_address', 'bank_details', 'settings'
        ];

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                if (typeof updateData[field] === 'object' && updateData[field] !== null && !Array.isArray(updateData[field])) {
                    seller[field] = {
                        ...(seller[field] ? (seller[field].toObject?.() || seller[field]) : {}),
                        ...updateData[field]
                    };
                } else {
                    seller[field] = updateData[field];
                }
            }
        }

        if (updateData.store_name && !updateData.business_name) {
            seller.business_name = updateData.store_name;
        }

        // Clean up old logo or banner if replaced
        if (updateData.logo && seller.logo && updateData.logo !== seller.logo) {
            try {
                await cloudinaryHelper.deleteFile(seller.logo);
            } catch (err) {
                logger.error('Error deleting old seller logo:', err);
            }
        }

        if (updateData.banner && seller.banner && updateData.banner !== seller.banner) {
            try {
                await cloudinaryHelper.deleteFile(seller.banner);
            } catch (err) {
                logger.error('Error deleting old seller banner:', err);
            }
        }

        await seller.save();

        if (updateData.logo && seller.user_id) {
            await User.findByIdAndUpdate(seller.user_id, { profile_image: updateData.logo }).catch(() => {});
        }

        await seller.populate([
            { path: 'user_id', select: 'first_name last_name email mobile_number profile_image' },
            { path: 'approved_by', select: 'first_name last_name email' }
        ]);

        return seller;
    }

    // ============ AMAZON-GRADE SELLER CENTRAL DASHBOARD ============
    async getDashboard(sellerId, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);
        const sId = seller._id;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Original seller sale price expression (platform coupons NEVER reduce seller revenue)
        const sellerGrossExpr = {
            $ifNull: [
                '$subtotal',
                { $add: ['$total_amount', { $ifNull: ['$coupon_discount', { $ifNull: ['$discount_amount', 0] }] }] }
            ]
        };

        // Concurrent fetch of products, stock alerts, orders, and financial stats
        const [
            totalProducts,
            activeProducts,
            outOfStockCount,
            lowStockProducts,
            orderStatsAgg,
            todayStatsAgg,
            last7DaysAgg,
            last30DaysAgg,
            recentOrders
        ] = await Promise.all([
            Product.countDocuments({ seller_id: sId }),
            Product.countDocuments({ seller_id: sId, status: 'active' }),
            Product.countDocuments({ seller_id: sId, stock_quantity: { $lte: 0 } }),
            Product.find({ seller_id: sId, stock_quantity: { $gt: 0, $lte: 10 }, status: 'active' })
                .select('product_name stock_quantity price mrp images sku product_code')
                .limit(6)
                .lean(),
            Order.aggregate([
                { $match: { seller_id: sId } },
                {
                    $group: {
                        _id: '$order_status',
                        count: { $sum: 1 },
                        totalRevenue: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'paid'] }, sellerGrossExpr, 0]
                            }
                        },
                        totalUnits: { $sum: '$total_items' }
                    }
                }
            ]),
            Order.aggregate([
                { $match: { seller_id: sId, created_at: { $gte: startOfToday } } },
                {
                    $group: {
                        _id: null,
                        todayOrders: { $sum: 1 },
                        todaySales: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'paid'] }, sellerGrossExpr, 0]
                            }
                        },
                        todayUnits: { $sum: '$total_items' }
                    }
                }
            ]),
            Order.aggregate([
                { $match: { seller_id: sId, created_at: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: null,
                        orders: { $sum: 1 },
                        sales: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'paid'] }, sellerGrossExpr, 0]
                            }
                        },
                        units: { $sum: '$total_items' }
                    }
                }
            ]),
            Order.aggregate([
                { $match: { seller_id: sId, created_at: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: null,
                        orders: { $sum: 1 },
                        sales: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'paid'] }, sellerGrossExpr, 0]
                            }
                        },
                        units: { $sum: '$total_items' }
                    }
                }
            ]),
            Order.find({ seller_id: sId })
                .populate('user_id', 'first_name last_name email profile_image')
                .sort({ created_at: -1 })
                .limit(8)
                .lean()
        ]);

        let totalOrders = 0;
        let totalRevenue = 0;
        let totalUnitsSold = 0;
        let pendingOrders = 0;
        let shippedOrders = 0;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        let returnedOrders = 0;

        orderStatsAgg.forEach(stat => {
            const count = stat.count || 0;
            totalOrders += count;
            totalRevenue += stat.totalRevenue || 0;
            totalUnitsSold += stat.totalUnits || 0;

            if (['pending', 'confirmed', 'packed', 'processing'].includes(stat._id)) {
                pendingOrders += count;
            } else if (stat._id === 'shipped') {
                shippedOrders += count;
            } else if (stat._id === 'delivered') {
                deliveredOrders += count;
            } else if (stat._id === 'cancelled') {
                cancelledOrders += count;
            } else if (stat._id === 'returned') {
                returnedOrders += count;
            }
        });

        const todaySales = Number((todayStatsAgg[0]?.todaySales || 0).toFixed(2));
        const todayOrders = todayStatsAgg[0]?.todayOrders || 0;
        const todayUnits = todayStatsAgg[0]?.todayUnits || 0;

        const last7DaysSales = Number((last7DaysAgg[0]?.sales || 0).toFixed(2));
        const last7DaysOrders = last7DaysAgg[0]?.orders || 0;
        const last7DaysUnits = last7DaysAgg[0]?.units || 0;

        const last30DaysSales = Number((last30DaysAgg[0]?.sales || 0).toFixed(2));
        const last30DaysOrders = last30DaysAgg[0]?.orders || 0;
        const last30DaysUnits = last30DaysAgg[0]?.units || 0;

        // Take Rate / Platform Commission
        const commissionRate = seller.commission_rate || 10;
        const netEscrowBalance = Number((totalRevenue * (1 - (commissionRate / 100))).toFixed(2));
        const averageOrderValue = totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

        // Amazon-Grade Account Health Metrics
        const orderDefectRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;
        const lateDispatchRate = 0.5; // Compliant target < 4%
        const cancellationRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;

        const sales_snapshot = {
            today: {
                sales: todaySales,
                orders: todayOrders,
                units: todayUnits
            },
            last_7_days: {
                sales: last7DaysSales,
                orders: last7DaysOrders,
                units: last7DaysUnits
            },
            last_30_days: {
                sales: last30DaysSales,
                orders: last30DaysOrders,
                units: last30DaysUnits
            },
            all_time: {
                sales: Number(totalRevenue.toFixed(2)),
                orders: totalOrders,
                units: totalUnitsSold
            }
        };

        const open_orders = {
            pending: pendingOrders,
            unshipped: pendingOrders,
            returns_requested: returnedOrders
        };

        const account_health = {
            order_defect_rate: {
                value: `${orderDefectRate}%`,
                target: '< 1%',
                status: orderDefectRate < 1 ? 'Good' : 'At Risk'
            },
            late_dispatch_rate: {
                value: `${lateDispatchRate}%`,
                target: '< 4%',
                status: lateDispatchRate < 4 ? 'Good' : 'At Risk'
            },
            cancellation_rate: {
                value: `${cancellationRate}%`,
                target: '< 2.5%',
                status: cancellationRate < 2.5 ? 'Good' : 'At Risk'
            }
        };

        const inventory_summary = {
            active_listings: activeProducts,
            out_of_stock: outOfStockCount,
            low_stock: lowStockProducts.length
        };

        return {
            seller: {
                _id: seller._id,
                business_name: seller.business_name,
                store_name: seller.store_name || seller.business_name,
                seller_code: seller.seller_code,
                rating: seller.rating || 4.8,
                verification_status: seller.verification_status,
                account_status: seller.account_status,
                commission_rate: commissionRate,
                vacation_mode: seller.settings?.vacation_mode || false,
                business_address: seller.business_address,
                bank_details: seller.bank_details,
            },
            sales_snapshot,
            open_orders,
            account_health,
            inventory_summary,
            overview: {
                todaySales,
                todayOrders,
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalOrders,
                totalUnitsSold,
                pendingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                returnedOrders,
                netEscrowBalance,
                averageOrderValue,
            },
            accountHealth: {
                status: seller.account_status === 'active' ? 'Good Standing' : (seller.account_status || 'Under Review'),
                rating: seller.rating || 4.8,
                orderDefectRate,
                orderDefectTarget: '< 1%',
                lateDispatchRate,
                lateDispatchTarget: '< 4%',
                cancellationRate,
                cancellationTarget: '< 2.5%',
                policyViolations: 0,
            },
            inventoryHealth: {
                totalProducts,
                activeProducts,
                lowStockCount: lowStockProducts.length,
                outOfStockCount,
                lowStockProducts,
            },
            low_stock_products: lowStockProducts,
            recent_orders: recentOrders,
            recentOrders,
        };
    }

    // ============ AMAZON-GRADE DASHBOARD STATISTICS ============
    async getDashboardStatistics(sellerId, period = 'weekly', userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);
        const sId = seller._id;

        const now = new Date();
        let startDate = new Date();
        let groupFormat = '%Y-%m-%d';

        if (period === 'weekly' || period === '7d') {
            startDate.setDate(now.getDate() - 7);
            groupFormat = '%d %b';
        } else if (period === 'monthly' || period === '30d') {
            startDate.setDate(now.getDate() - 30);
            groupFormat = '%d %b';
        } else if (period === 'yearly' || period === '12m') {
            startDate.setFullYear(now.getFullYear() - 1);
            groupFormat = '%b %Y';
        } else {
            startDate.setDate(now.getDate() - 7);
            groupFormat = '%d %b';
        }

        const [dailyStats, topProducts] = await Promise.all([
            Order.aggregate([
                { $match: { seller_id: sId, created_at: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: groupFormat, date: '$created_at' } },
                        orderCount: { $sum: 1 },
                        revenue: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0]
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Product.find({ seller_id: sId })
                .sort({ total_sold: -1, created_at: -1 })
                .limit(5)
                .select('product_name price stock_quantity images product_code sku')
                .lean()
        ]);

        const labels = dailyStats.map(s => s._id);
        const revenue = dailyStats.map(s => Number((s.revenue || 0).toFixed(2)));
        const orders = dailyStats.map(s => s.orderCount);

        return {
            period,
            labels,
            revenue,
            orders,
            datasets: {
                revenue,
                orders
            },
            chartData: dailyStats.map(s => ({
                label: s._id,
                orders: s.orderCount,
                revenue: Number((s.revenue || 0).toFixed(2))
            })),
            topProducts
        };
    }

    // ============ DOCUMENTS ============
    async uploadDocument({ sellerId, documentType, file, userId = null }) {
        const seller = await this.resolveSeller(sellerId, userId);

        let documentUrl = '';
        if (file) {
            try {
                const result = await cloudinaryHelper.uploadFile(file.path, {
                    folder: `sellers/${seller._id}/documents`,
                    resource_type: 'auto'
                });
                documentUrl = result.url || result.secure_url;
            } catch (err) {
                documentUrl = `/uploads/${file.filename || file.name}`;
            }
        }

        const document = {
            document_type: documentType,
            document_url: documentUrl,
            uploaded_at: new Date(),
            verified: false
        };

        seller.documents = seller.documents || [];
        seller.documents.push(document);
        await seller.save();

        return document;
    }

    async deleteDocument(sellerId, documentId, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);

        const documentIndex = (seller.documents || []).findIndex(
            doc => doc._id.toString() === documentId.toString()
        );

        if (documentIndex === -1) {
            throw ApiError.notFound('Document not found');
        }

        const document = seller.documents[documentIndex];
        if (document.document_url) {
            try {
                await cloudinaryHelper.deleteFile(document.document_url);
            } catch (err) {
                logger.error('Error deleting seller document from cloudinary:', err);
            }
        }

        seller.documents.splice(documentIndex, 1);
        await seller.save();

        return { message: 'Document deleted successfully' };
    }

    async getDocuments(sellerId, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);
        return seller.documents || [];
    }

    // ============ PRODUCTS ============
    async getMyProducts({ sellerId, page = 1, limit = 10, status = null, category = null, search = null }) {
        let seller = null;
        if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
            seller = await Seller.findById(sellerId);
        }

        const effectiveSellerId = seller ? seller._id : (mongoose.Types.ObjectId.isValid(sellerId) ? new mongoose.Types.ObjectId(sellerId) : sellerId);
        const sellerMatches = [{ seller_id: effectiveSellerId }];
        if (seller?.user_id) {
            sellerMatches.push({ created_by: seller.user_id });
        }

        const conditions = [{ $or: sellerMatches }];

        if (status) {
            conditions.push({ status });
        } else {
            // By default, exclude soft-deleted products from seller's active view
            conditions.push({ status: { $ne: 'deleted' } });
        }

        if (category) {
            conditions.push({ category_id: category });
        }

        if (search) {
            conditions.push({
                $or: [
                    { product_name: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } },
                    { sku: { $regex: search, $options: 'i' } }
                ]
            });
        }

        const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category_id', 'category_name')
                .populate('sub_category_id', 'sub_category_name')
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Product.countDocuments(query)
        ]);

        return {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getProductById(sellerId, productId, userId = null) {
        let seller = await Seller.findById(sellerId);
        if (!seller && userId) {
            seller = await Seller.findOne({ user_id: userId });
        }
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        let query = { seller_id: seller._id };
        if (mongoose.Types.ObjectId.isValid(productId)) {
            query._id = productId;
        } else {
            query.product_code = productId;
        }

        const product = await Product.findOne(query)
            .populate('category_id', 'category_name')
            .populate('sub_category_id', 'sub_category_name')
            .populate('seller_id', 'business_name store_name brand_name logo banner seller_code rating');

        if (!product) {
            throw ApiError.notFound('Product not found or access denied');
        }

        const inventory = await Inventory.findOne({ product_id: product._id });
        const productObj = product.toObject();
        productObj.inventory = inventory ? {
            stock_quantity: inventory.stock_quantity,
            available_quantity: inventory.available_quantity,
            stock_status: inventory.stock_status
        } : null;

        return productObj;
    }

    async createProduct(sellerId, productData, userId = null) {
        let seller = await Seller.findById(sellerId);
        if (!seller && userId) {
            seller = await Seller.findOne({ user_id: userId });
        }
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        const effectiveUserId = seller.user_id || userId;

        // Maintain pure seller price without artificial discount/coupon markup
        const sellerPrice = Number(productData.price);

        const stockQuantity = Number(productData.stock_quantity ?? productData.stock ?? 0);
        const normalizedImages = Array.isArray(productData.images)
            ? productData.images.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean)
            : [];

        // All newly created seller products start as Pending approval
        const status = 'pending';
        const approvalStatus = 'pending';

        const subCategoryId = productData.sub_category_id && mongoose.Types.ObjectId.isValid(productData.sub_category_id)
            ? new mongoose.Types.ObjectId(productData.sub_category_id)
            : null;

        const categoryId = productData.category_id && mongoose.Types.ObjectId.isValid(productData.category_id)
            ? new mongoose.Types.ObjectId(productData.category_id)
            : productData.category_id;

        const sku = (productData.sku && productData.sku.trim()) || `SKU-${Date.now().toString().slice(-6)}`;

        const product = new Product({
            ...productData,
            category_id: categoryId,
            sub_category_id: subCategoryId,
            seller_id: seller._id,
            created_by: effectiveUserId,
            price: sellerPrice,
            mrp: sellerPrice,
            final_price: sellerPrice,
            discount_percent: 0,
            videos: [],
            stock_quantity: stockQuantity,
            images: normalizedImages,
            sku: sku,
            product_code: productData.product_code || `PRD-${Date.now().toString().slice(-6)}`,
            status: status,
            approval_status: approvalStatus,
        });

        await product.save();

        // Record Activity Audit Log
        try {
            const auditService = require('../audit.service');
            await auditService.log({
                userId: effectiveUserId,
                userType: 'seller',
                action: 'create',
                module: 'product',
                moduleId: product._id,
                description: `Product "${product.product_name}" created by seller (Pending Admin Approval)`,
                status: 'success'
            });
        } catch (audErr) {
            // non-fatal
        }

        // Also create / sync Inventory entry so inventory tracking works
        try {
            const Inventory = require('../../models/inventory.model');
            await Inventory.create({
                product_id: product._id,
                seller_id: seller._id,
                stock_quantity: stockQuantity,
                available_quantity: stockQuantity,
                low_stock_limit: productData.low_stock_limit || 5,
                stock_status: stockQuantity > 10 ? 'available' : (stockQuantity > 0 ? 'low_stock' : 'out_of_stock')
            });
        } catch (invErr) {
            // Inventory collection creation non-fatal
        }

        return product;
    }

    async getProductById(sellerId, productId, userId = null) {
        let seller = await Seller.findById(sellerId);
        if (!seller && userId) {
            seller = await Seller.findOne({ user_id: userId });
        }
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        const effectiveUserId = seller.user_id || userId;
        const query = {
            $or: [
                { seller_id: seller._id },
                { created_by: effectiveUserId }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(productId)) {
            query._id = productId;
        } else {
            query.product_code = productId;
        }

        const product = await Product.findOne(query)
            .populate('category_id', 'category_name')
            .populate('sub_category_id', 'sub_category_name')
            .lean();

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        return product;
    }

    async updateProduct(sellerId, productId, updateData, userId = null) {
        let seller = await Seller.findById(sellerId);
        if (!seller && userId) {
            seller = await Seller.findOne({ user_id: userId });
        }
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        const effectiveUserId = seller.user_id || userId;

        const query = {
            $or: [
                { seller_id: seller._id },
                { created_by: effectiveUserId }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(productId)) {
            query._id = productId;
        } else {
            query.product_code = productId;
        }

        const product = await Product.findOne(query);

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        if (updateData.sub_category_id !== undefined) {
            if (updateData.sub_category_id && mongoose.Types.ObjectId.isValid(updateData.sub_category_id)) {
                product.sub_category_id = new mongoose.Types.ObjectId(updateData.sub_category_id);
            } else {
                product.sub_category_id = null;
            }
        }

        if (updateData.category_id && mongoose.Types.ObjectId.isValid(updateData.category_id)) {
            product.category_id = new mongoose.Types.ObjectId(updateData.category_id);
        }

        if (updateData.product_name) product.product_name = updateData.product_name.trim();
        if (updateData.brand !== undefined) product.brand = (updateData.brand || '').trim();
        if (updateData.description !== undefined) product.description = (updateData.description || '').trim();
        if (updateData.sku && updateData.sku.trim()) product.sku = updateData.sku.trim();

        // Maintain pure seller price across listing pages and details without artificial discount
        if (updateData.price !== undefined) {
            const newPrice = Number(updateData.price);
            product.price = newPrice;
            product.mrp = newPrice;
            product.final_price = newPrice;
            product.discount_percent = 0;
        } else {
            product.mrp = product.price;
            product.final_price = product.price;
            product.discount_percent = 0;
        }

        const stockQuantity = updateData.stock_quantity !== undefined 
            ? Number(updateData.stock_quantity) 
            : (updateData.stock !== undefined ? Number(updateData.stock) : product.stock_quantity);
        product.stock_quantity = stockQuantity;

        if (updateData.images !== undefined) {
            product.images = Array.isArray(updateData.images)
                ? updateData.images.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean)
                : product.images;
        }

        // NOTE: Seller cannot directly modify marketplace status (Admin-controlled)

        product.updated_by = effectiveUserId;
        await product.save();

        // Sync Inventory
        try {
            const Inventory = require('../../models/inventory.model');
            let inventory = await Inventory.findOne({ product_id: product._id });
            const lowLimit = inventory?.low_stock_limit || 5;
            const newStatus = stockQuantity > lowLimit ? 'available' : (stockQuantity > 0 ? 'low_stock' : 'out_of_stock');

            if (inventory) {
                const oldStock = inventory.stock_quantity || 0;
                inventory.seller_id = seller._id;
                inventory.stock_quantity = stockQuantity;
                inventory.available_quantity = Math.max(0, stockQuantity - (inventory.reserved_quantity || 0));
                inventory.stock_status = newStatus;
                inventory.last_stock_update = new Date();
                inventory.updated_by = effectiveUserId;
                inventory.stock_movements = inventory.stock_movements || [];

                if (stockQuantity !== oldStock) {
                    inventory.stock_movements.push({
                        type: stockQuantity > oldStock ? 'add' : 'remove',
                        quantity: Math.abs(stockQuantity - oldStock),
                        reason: 'Seller updated stock from inventory',
                        performed_by: effectiveUserId,
                        timestamp: new Date()
                    });
                }
                await inventory.save();
            } else {
                await Inventory.create({
                    product_id: product._id,
                    seller_id: seller._id,
                    stock_quantity: stockQuantity,
                    available_quantity: stockQuantity,
                    sold_quantity: 0,
                    reserved_quantity: 0,
                    low_stock_limit: 5,
                    stock_status: newStatus,
                    last_stock_update: new Date(),
                    updated_by: effectiveUserId,
                    stock_movements: [{
                        type: 'add',
                        quantity: stockQuantity,
                        reason: 'Initial stock setup by seller',
                        performed_by: effectiveUserId,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (invErr) {
            console.error('Inventory sync error in seller.updateProduct:', invErr);
        }

        return product;
    }

    async deleteProduct(sellerId, productId, userId = null) {
        let seller = await Seller.findById(sellerId);
        if (!seller && userId) {
            seller = await Seller.findOne({ user_id: userId });
        }
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        const effectiveUserId = seller.user_id || userId;

        const query = {
            $or: [
                { seller_id: seller._id },
                { created_by: effectiveUserId }
            ]
        };

        if (mongoose.Types.ObjectId.isValid(productId)) {
            query._id = productId;
        } else {
            query.product_code = productId;
        }

        const product = await Product.findOne(query);

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        // Soft delete: keep product in DB with status = 'deleted' so Admin can view it
        product.status = 'deleted';
        product.deleted_at = new Date();
        product.deleted_by = effectiveUserId;
        await product.save();

        // Record Activity Audit Log
        try {
            const auditService = require('../audit.service');
            await auditService.log({
                userId: effectiveUserId,
                userType: 'seller',
                action: 'delete',
                module: 'product',
                moduleId: product._id,
                description: `Product "${product.product_name}" deleted by seller`,
                status: 'success'
            });
        } catch (audErr) {
            // non-fatal
        }

        return { message: 'Product deleted successfully' };
    }

    // ============ ORDERS ============
    async getOrders({ sellerId, page = 1, limit = 10, status = null, startDate = null, endDate = null, sortBy = 'created_at', sortOrder = 'desc' }) {
        const query = { seller_id: sellerId };

        if (status) {
            query.order_status = status;
        }

        if (startDate || endDate) {
            query.created_at = {};
            if (startDate) {
                query.created_at.$gte = new Date(startDate);
            }
            if (endDate) {
                query.created_at.$lte = new Date(endDate);
            }
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('user_id', 'first_name last_name email mobile_number')
                .populate('order_items')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Order.countDocuments(query)
        ]);

        return {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getOrderDetails(sellerId, orderId) {
        const order = await Order.findOne({
            _id: orderId,
            seller_id: sellerId
        })
            .populate('user_id', 'first_name last_name email mobile_number')
            .populate({
                path: 'order_items',
                populate: {
                    path: 'product_id',
                    select: 'product_name images sku price'
                }
            });

        if (!order) {
            throw ApiError.notFound('Order not found or unauthorized');
        }

        return order;
    }

    async updateOrderStatus({ sellerId, orderId, status, notes, trackingId, trackingCarrier, trackingUrl }) {
        const order = await Order.findOne({
            _id: orderId,
            seller_id: sellerId
        });

        if (!order) {
            throw ApiError.notFound('Order not found or unauthorized');
        }

        const oldStatus = order.order_status;
        order.order_status = status;

        if (notes) {
            order.admin_notes = notes;
        }

        if (trackingId) {
            order.tracking_id = trackingId;
        }

        if (trackingCarrier) {
            order.tracking_carrier = trackingCarrier;
        }

        if (trackingUrl) {
            order.tracking_url = trackingUrl;
        }

        // Add to status history
        order.status_history.push({
            status: status,
            updated_by: sellerId,
            notes: notes || '',
            timestamp: new Date()
        });

        if (status === constants.ORDER_STATUS.DELIVERED) {
            order.delivered_at = new Date();
        }

        await order.save();

        // Update order items status
        await OrderItem.updateMany(
            { order_id: orderId },
            { item_status: status }
        );

        // Create notification for customer
        await Notification.create({
            user_id: order.user_id,
            receiver_type: 'customer',
            title: `Order Status Updated - #${order.order_number}`,
            message: `Your order #${order.order_number} is now ${status}`,
            notification_type: 'order',
            reference_id: order._id,
            reference_model: 'Order',
            channel: 'in_app'
        });

        return order;
    }

    // ============ REPORTS ============
    async getPerformanceReport({ sellerId, startDate, endDate }) {
        const matchQuery = {
            seller_id: sellerId,
            created_at: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const [orders, revenue, topProducts, orderStatusDistribution] = await Promise.all([
            Order.countDocuments(matchQuery),
            Order.aggregate([
                { $match: { ...matchQuery, payment_status: constants.PAYMENT_STATUS.PAID } },
                { $group: { _id: null, total: { $sum: '$total_amount' } } }
            ]),
            OrderItem.aggregate([
                { $match: { seller_id: sellerId } },
                {
                    $group: {
                        _id: '$product_id',
                        totalSold: { $sum: '$quantity' },
                        totalRevenue: { $sum: '$total_price' }
                    }
                },
                { $sort: { totalSold: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                { $unwind: '$product' },
                {
                    $project: {
                        productId: '$_id',
                        productName: '$product.product_name',
                        totalSold: 1,
                        totalRevenue: 1
                    }
                }
            ]),
            Order.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: '$order_status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        return {
            period: { startDate, endDate },
            totalOrders: orders,
            totalRevenue: revenue[0]?.total || 0,
            topProducts,
            orderStatusDistribution
        };
    }

    async getSalesReport({ sellerId, startDate, endDate, period = 'daily' }) {
        const matchQuery = {
            seller_id: sellerId,
            created_at: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        let dateFormat;
        switch (period) {
            case 'daily':
                dateFormat = '%Y-%m-%d';
                break;
            case 'weekly':
                dateFormat = '%Y-%W';
                break;
            case 'monthly':
                dateFormat = '%Y-%m';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        const salesData = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$created_at' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total_amount' },
                    averageOrderValue: { $avg: '$total_amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return {
            period,
            salesData
        };
    }

    async getAnalytics(sellerId, period = 'monthly') {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'weekly':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'monthly':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'yearly':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        const [customerCount, repeatCustomerRate, averageRating] = await Promise.all([
            Order.distinct('user_id', { seller_id: sellerId }).then(users => users.length),
            Order.aggregate([
                { $match: { seller_id: sellerId } },
                { $group: { _id: '$user_id', count: { $sum: 1 } } },
                { $group: { _id: null, avg: { $avg: '$count' } } }
            ]),
            Review.aggregate([
                { $match: { seller_id: sellerId, review_status: 'approved' } },
                { $group: { _id: null, avg: { $avg: '$rating' } } }
            ])
        ]);

        return {
            period,
            customerCount,
            repeatCustomerRate: repeatCustomerRate[0]?.avg || 0,
            averageRating: averageRating[0]?.avg || 0
        };
    }

    // ============ SELLER EARNINGS & DISBURSEMENTS ============
    async getEarnings(sellerId, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);
        const sId = seller._id;

        const commissionRate = seller.commission_rate || 10;

        // Fetch all orders associated with this seller
        const orders = await Order.find({ seller_id: sId })
            .sort({ created_at: -1 })
            .lean();

        let totalGrossRevenue = 0;
        let deliveredRevenue = 0;
        let pendingRevenue = 0;

        const transactions = orders.map((ord) => {
            // Seller's product price must NEVER be reduced because of a platform coupon
            const platformCouponDiscount = Number(ord.coupon_discount) || Number(ord.discount_amount) || 0;
            const gross = Number(ord.subtotal) > 0 ? Number(ord.subtotal) : (Number(ord.total_amount) + platformCouponDiscount);
            totalGrossRevenue += gross;

            const isDelivered = ord.order_status === 'delivered';
            if (isDelivered) {
                deliveredRevenue += gross;
            } else if (ord.order_status !== 'cancelled' && ord.order_status !== 'returned') {
                pendingRevenue += gross;
            }

            const fee = Number(((gross * commissionRate) / 100).toFixed(2));
            const net = Number((gross - fee).toFixed(2));

            return {
                _id: ord._id,
                transaction_id: ord.order_number || ord.order_code || ord._id.toString().slice(-8).toUpperCase(),
                payout_id: `PAY-${ord._id.toString().slice(-6).toUpperCase()}`,
                order_id: ord._id,
                order_number: ord.order_number,
                created_at: ord.created_at,
                gross_amount: gross,
                coupon_discount: platformCouponDiscount,
                customer_paid: Number(ord.total_amount) || 0,
                commission_amount: fee,
                net_amount: net,
                status: isDelivered ? 'paid' : (ord.order_status === 'cancelled' ? 'cancelled' : 'pending'),
                order_status: ord.order_status,
                payment_status: ord.payment_status,
            };
        });

        const totalCommission = Number(((totalGrossRevenue * commissionRate) / 100).toFixed(2));
        const netEarnings = Number((totalGrossRevenue - totalCommission).toFixed(2));
        const paidPayout = Number((deliveredRevenue * (1 - (commissionRate / 100))).toFixed(2));
        const pendingPayout = Number((pendingRevenue * (1 - (commissionRate / 100))).toFixed(2));
        const avgOrderValue = orders.length > 0 ? Math.round(totalGrossRevenue / orders.length) : 0;

        return {
            total_earnings: totalGrossRevenue,
            net_earnings: netEarnings,
            paid_earnings: paidPayout,
            pending_earnings: pendingPayout,
            commission_rate: commissionRate,
            total_commission: totalCommission,
            average_order_value: avgOrderValue,
            total_orders: orders.length,
            transactions,
        };
    }

    // ============ SETTINGS ============
    async getSettings(sellerId, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);

        return {
            settings: seller.settings || {},
            commission_rate: seller.commission_rate || 10,
            vacation_mode: seller.settings?.vacation_mode || false,
        };
    }

    async updateSettings(sellerId, settingsData, userId = null) {
        const seller = await this.resolveSeller(sellerId, userId);

        const allowedFields = [
            'order_processing_time', 'return_policy', 'shipping_methods',
            'fulfillment_type', 'default_shipping_fee', 'pickup_address', 'vacation_mode'
        ];

        if (!seller.settings) {
            seller.settings = {};
        }

        for (const field of allowedFields) {
            if (settingsData[field] !== undefined) {
                if (typeof settingsData[field] === 'object' && settingsData[field] !== null && !Array.isArray(settingsData[field])) {
                    seller.settings[field] = {
                        ...(seller.settings[field]?.toObject?.() || seller.settings[field] || {}),
                        ...settingsData[field]
                    };
                } else {
                    seller.settings[field] = settingsData[field];
                }
            }
        }

        if (settingsData.commission_rate !== undefined && userId === null) {
            seller.commission_rate = settingsData.commission_rate;
        }

        await seller.save();

        return {
            settings: seller.settings,
            commission_rate: seller.commission_rate || 10,
            vacation_mode: seller.settings?.vacation_mode || false
        };
    }

    // ============ SELLER CATEGORY & SUB-CATEGORY CREATION ============
    async createCategory({ category_id, category_name, description, sub_category_name }, userId) {
        let category = null;
        let isNewCategory = false;

        if (category_id) {
            category = await Category.findOne({ _id: category_id, deleted_at: null }) || await Category.findById(category_id);
        }

        if (!category) {
            if (!category_name || !category_name.trim()) {
                throw ApiError.badRequest('Category name is required');
            }

            const trimmedName = category_name.trim();

            // 1. Check if category already exists in database (case-insensitive)
            category = await Category.findOne({
                category_name: { $regex: new RegExp(`^${trimmedName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
                deleted_at: null
            });

            if (!category) {
                // Generate unique category_code
                const base = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'cat';
                const randomCode = `${base}${Math.floor(1000 + Math.random() * 9000)}`;

                category = new Category({
                    category_name: trimmedName,
                    category_code: randomCode,
                    description: description ? description.trim() : '',
                    status: 'active',
                    created_by: userId
                });

                await category.save();
                isNewCategory = true;
                logger.info(`Seller created new Category: ${trimmedName}`, { categoryId: category._id, userId });
            }
        }

        // 2. Check or create SubCategory if requested
        let subCategory = null;
        let isNewSub = false;
        if (sub_category_name && sub_category_name.trim()) {
            const trimmedSub = sub_category_name.trim();
            const catObjectId = mongoose.Types.ObjectId.isValid(category._id)
                ? new mongoose.Types.ObjectId(category._id)
                : category._id;

            subCategory = await SubCategory.findOne({
                $or: [
                    { category_id: catObjectId },
                    { category_id: category._id.toString() }
                ],
                sub_category_name: { $regex: new RegExp(`^${trimmedSub.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
                deleted_at: null
            });

            if (!subCategory) {
                const subBase = trimmedSub.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'sub';
                const subCode = `sub_${subBase}${Math.floor(1000 + Math.random() * 9000)}`;

                subCategory = new SubCategory({
                    sub_category_name: trimmedSub,
                    sub_category_code: subCode,
                    category_id: catObjectId,
                    status: 'active',
                    description: description ? description.trim() : '',
                    created_by: userId
                });

                await subCategory.save();
                isNewSub = true;
                logger.info(`Seller created new SubCategory: ${trimmedSub}`, { subCategoryId: subCategory._id, categoryId: category._id, userId });
            }
        }

        return {
            category,
            subCategory,
            isNew: isNewCategory,
            isNewSub
        };
    }

    async createSubCategory({ category_id, sub_category_name, description }, userId) {
        if (!category_id) {
            throw ApiError.badRequest('Primary category ID is required');
        }
        if (!sub_category_name || !sub_category_name.trim()) {
            throw ApiError.badRequest('Sub-category name is required');
        }

        const category = await Category.findOne({ _id: category_id, deleted_at: null }) || await Category.findById(category_id);
        if (!category) {
            throw ApiError.notFound('Primary category not found');
        }

        const trimmedSub = sub_category_name.trim();
        const catObjectId = mongoose.Types.ObjectId.isValid(category._id)
            ? new mongoose.Types.ObjectId(category._id)
            : category._id;

        let subCategory = await SubCategory.findOne({
            $or: [
                { category_id: catObjectId },
                { category_id: category._id.toString() }
            ],
            sub_category_name: { $regex: new RegExp(`^${trimmedSub.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
            deleted_at: null
        });

        let isNewSub = false;
        if (!subCategory) {
            const subBase = trimmedSub.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || 'sub';
            const subCode = `sub_${subBase}${Math.floor(1000 + Math.random() * 9000)}`;

            subCategory = new SubCategory({
                sub_category_name: trimmedSub,
                sub_category_code: subCode,
                category_id: catObjectId,
                status: 'active',
                description: description ? description.trim() : '',
                created_by: userId
            });

            await subCategory.save();
            isNewSub = true;
            logger.info(`Seller created new SubCategory: ${trimmedSub}`, { subCategoryId: subCategory._id, categoryId: category._id, userId });
        }

        return {
            category,
            subCategory,
            isNewSub
        };
    }
}

module.exports = new SellerService();