// Handles all product related business logic
// Manages product CRUD, search, filtering, and product reviews
// Also handles product images, approval, and featured products

const mongoose = require('mongoose');
const Product = require('../../models/product.model');
const Category = require('../../models/category.model');
const SubCategory = require('../../models/sub_category.model');
const Seller = require('../../models/seller.model');
const Inventory = require('../../models/inventory.model');
const Review = require('../../models/review.model');
const Notification = require('../../models/notification.model');
const AuditLog = require('../../models/audit_log.model');
const ApiError = require('../../utils/apiError');
const cloudinaryHelper = require('../../utils/cloudinary.helper');
const Helpers = require('../../utils/helpers');
const logger = require('../../utils/logger');
const constants = require('../../config/constants');

class ProductService {

    // ============ PUBLIC ROUTES ============
    async getAllProducts({
        page = 1,
        limit = 10,
        search = null,
        categoryId = null,
        subCategoryId = null,
        minPrice = null,
        maxPrice = null,
        brand = null,
        rating = null,
        sellerId = null,
        seller = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
    }) {
        const query = {
            status: { $in: ['active', 'suspended'] },
            approval_status: 'approved'
        };

        const targetSeller = sellerId || seller;
        if (targetSeller) {
            if (mongoose.Types.ObjectId.isValid(targetSeller)) {
                query.seller_id = targetSeller;
            } else {
                const foundSeller = await Seller.findOne({ seller_code: targetSeller }).select('_id');
                if (foundSeller) {
                    query.seller_id = foundSeller._id;
                }
            }
        }

        if (search && typeof search === 'string' && search.trim()) {
            const trimmed = search.trim();
            query.$or = [
                { product_name: { $regex: trimmed, $options: 'i' } },
                { description: { $regex: trimmed, $options: 'i' } },
                { brand: { $regex: trimmed, $options: 'i' } },
                { tags: { $in: [new RegExp(trimmed, 'i')] } }
            ];
        }

        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            query.category_id = categoryId;
        }

        if (subCategoryId && mongoose.Types.ObjectId.isValid(subCategoryId)) {
            query.sub_category_id = subCategoryId;
        }

        const hasMin = minPrice !== undefined && minPrice !== null && minPrice !== '' && !isNaN(minPrice);
        const hasMax = maxPrice !== undefined && maxPrice !== null && maxPrice !== '' && !isNaN(maxPrice);
        if (hasMin || hasMax) {
            query.final_price = {};
            if (hasMin) {
                query.final_price.$gte = parseFloat(minPrice);
            }
            if (hasMax) {
                query.final_price.$lte = parseFloat(maxPrice);
            }
        }

        if (brand && typeof brand === 'string' && brand.trim()) {
            query.brand = { $regex: brand.trim(), $options: 'i' };
        }

        if (rating && !isNaN(rating)) {
            query.rating = { $gte: parseFloat(rating) };
        }

        const sortOptions = {};
        if (sortBy === 'price') {
            sortOptions.final_price = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'rating') {
            sortOptions.rating = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'sales_count') {
            sortOptions.sales_count = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('seller_id', 'business_name store_name brand_name rating seller_code logo')
                .populate('category_id', 'category_name')
                .populate('sub_category_id', 'sub_category_name')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Product.countDocuments(query)
        ]);

        // Get inventory for each product
        const productIds = products.map(p => p._id);
        const inventories = await Inventory.find({
            product_id: { $in: productIds }
        });

        const inventoryMap = {};
        inventories.forEach(inv => {
            inventoryMap[inv.product_id.toString()] = inv;
        });

        const productsWithInventory = products.map(product => {
            const productObj = product.toObject();
            const inventory = inventoryMap[product._id.toString()];
            productObj.inventory = inventory ? {
                stock_quantity: inventory.stock_quantity,
                available_quantity: inventory.available_quantity,
                stock_status: inventory.stock_status
            } : null;
            return productObj;
        });

        return {
            products: productsWithInventory,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getProductById(productId) {
        let query;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            query = { _id: productId };
        } else {
            query = { product_code: productId };
        }

        const product = await Product.findOne(query)
            .populate('seller_id', 'business_name store_name brand_name logo banner tagline store_description rating total_orders seller_code')
            .populate('category_id', 'category_name')
            .populate('sub_category_id', 'sub_category_name');

        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        // Increment views
        product.views += 1;
        await product.save({ validateBeforeSave: false });

        // Get inventory
        const inventory = await Inventory.findOne({ product_id: product._id });

        // Get reviews (published only)
        const reviews = await Review.find({
            product_id: product._id,
            status: 'published'
        })
            .populate('user_id', 'first_name last_name profile_image')
            .sort({ created_at: -1 })
            .limit(5);

        const productObj = product.toObject();
        productObj.inventory = inventory ? {
            stock_quantity: inventory.stock_quantity,
            available_quantity: inventory.available_quantity,
            stock_status: inventory.stock_status
        } : null;
        productObj.recent_reviews = reviews;

        return productObj;
    }

    async getProductsByCategory({ categoryId, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' }) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        const query = {
            category_id: categoryId,
            status: 'active',
            approval_status: { $ne: 'rejected' }
        };

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('seller_id', 'business_name rating')
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

    async getProductsBySubCategory({ subCategoryId, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' }) {
        const subCategory = await SubCategory.findById(subCategoryId);
        if (!subCategory) {
            throw ApiError.notFound('Sub-category not found');
        }

        const query = {
            sub_category_id: subCategoryId,
            status: 'active',
            approval_status: { $ne: 'rejected' }
        };

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('seller_id', 'business_name rating')
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

    async searchProducts({
        query: searchQuery,
        page = 1,
        limit = 10,
        categoryId = null,
        minPrice = null,
        maxPrice = null,
        sortBy = 'relevance',
        sortOrder = 'desc'
    }) {
        if (!searchQuery) {
            throw ApiError.badRequest('Search query is required');
        }

        const query = {
            status: 'active',
            approval_status: 'approved',
            $text: { $search: searchQuery }
        };

        if (categoryId) {
            query.category_id = categoryId;
        }

        if (minPrice !== null || maxPrice !== null) {
            query.final_price = {};
            if (minPrice !== null) {
                query.final_price.$gte = parseFloat(minPrice);
            }
            if (maxPrice !== null) {
                query.final_price.$lte = parseFloat(maxPrice);
            }
        }

        let sortOptions = {};
        if (sortBy === 'relevance') {
            sortOptions = { score: { $meta: 'textScore' } };
        } else if (sortBy === 'price') {
            sortOptions.final_price = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy === 'rating') {
            sortOptions.rating = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const [products, total] = await Promise.all([
            Product.find(query, { score: { $meta: 'textScore' } })
                .populate('seller_id', 'business_name rating')
                .populate('category_id', 'category_name')
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

    async getFeaturedProducts(limit = 10) {
        const products = await Product.find({
            is_featured: true,
            status: 'active',
            approval_status: 'approved'
        })
            .populate('seller_id', 'business_name rating')
            .limit(parseInt(limit))
            .sort({ sales_count: -1 });

        return products;
    }

    // ============ SELLER ROUTES ============
    async getSellerProducts({
        sellerId,
        page = 1,
        limit = 10,
        status = null,
        category = null,
        search = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
    }) {
        const query = { seller_id: sellerId };

        if (status) {
            query.status = status;
        }

        if (category) {
            query.category_id = category;
        }

        if (search) {
            query.$or = [
                { product_name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
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

    async createProduct(sellerId, productData) {
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        // Check if category exists
        const category = await Category.findById(productData.category_id);
        if (!category) {
            throw ApiError.notFound('Category not found');
        }

        // Check if sub-category exists
        const subCategory = await SubCategory.findById(productData.sub_category_id);
        if (!subCategory) {
            throw ApiError.notFound('Sub-category not found');
        }

        // Generate SKU if not provided
        let sku = productData.sku;
        if (!sku) {
            sku = Helpers.generateSKU(productData.product_name, category.category_name);
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku });
        if (existingProduct) {
            throw ApiError.conflict('Product with this SKU already exists');
        }

        // Calculate final price
        let finalPrice = productData.price;
        if (productData.discount) {
            finalPrice = productData.price - (productData.price * productData.discount / 100);
        }

        const product = new Product({
            ...productData,
            seller_id: sellerId,
            sku,
            final_price: finalPrice,
            status: 'draft',
            approval_status: 'pending'
        });

        await product.save();

        // Create inventory entry
        const inventory = new Inventory({
            product_id: product._id,
            seller_id: sellerId,
            stock_quantity: productData.stock_quantity || 0,
            available_quantity: productData.stock_quantity || 0,
            low_stock_limit: productData.low_stock_limit || 5,
            stock_status: (productData.stock_quantity || 0) > 10 ? 'available' :
                        (productData.stock_quantity || 0) > 0 ? 'low_stock' : 'out_of_stock'
        });

        await inventory.save();

        logger.info(`Product created: ${product.product_name}`, { productId: product._id, sellerId });

        return product;
    }

    async updateProduct({ productId, sellerId, updateData }) {
        let query = { _id: productId };
        if (sellerId) {
            query = {
                _id: productId,
                $or: [
                    { seller_id: sellerId },
                    { created_by: sellerId }
                ]
            };
        }
        const product = await Product.findOne(query);

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        if (updateData.stock !== undefined && updateData.stock_quantity === undefined) {
            updateData.stock_quantity = updateData.stock;
        }

        const allowedFields = [
            'product_name', 'brand', 'description', 'category_id', 'sub_category_id',
            'price', 'compare_at_price', 'cost_per_item', 'discount', 'weight',
            'dimensions', 'variants', 'specifications', 'tags', 'seo',
            'return_policy', 'is_featured', 'status', 'stock_quantity'
        ];

        const filteredData = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        if (updateData.images !== undefined) {
            const newImagesList = Array.isArray(updateData.images)
                ? updateData.images.map((img) => (typeof img === 'string' ? img : img.url || '')).filter(Boolean)
                : updateData.images;
            filteredData.images = newImagesList;

            // Delete any images that were removed in this update from Cloudinary
            if (Array.isArray(product.images) && Array.isArray(newImagesList)) {
                const removedImages = product.images.filter(oldImg => !newImagesList.includes(oldImg));
                for (const oldImg of removedImages) {
                    cloudinaryHelper.deleteFile(oldImg).catch(err => {
                        logger.error('Failed to delete removed product image from Cloudinary:', err);
                    });
                }
            }
        }

        // Recalculate final price if price or discount changed
        if (updateData.price !== undefined || updateData.discount !== undefined) {
            const price = Number(updateData.price !== undefined ? updateData.price : product.price);
            const discount = Number(updateData.discount ?? product.discount ?? product.discount_percent ?? 0);
            filteredData.final_price = discount > 0 ? (price - (price * discount / 100)) : price;
        }

        if (filteredData.status === 'active') {
            filteredData.approval_status = 'approved';
        }

        Object.assign(product, filteredData);
        await product.save();

        // Update inventory if stock quantity provided
        if (updateData.stock_quantity !== undefined) {
            const stockQty = Number(updateData.stock_quantity);
            let inventory = await Inventory.findOne({ product_id: productId });
            const lowLimit = inventory?.low_stock_limit || 5;
            const newStatus = stockQty > lowLimit ? 'available' : (stockQty > 0 ? 'low_stock' : 'out_of_stock');

            if (inventory) {
                inventory.stock_quantity = stockQty;
                inventory.available_quantity = Math.max(0, stockQty - (inventory.reserved_quantity || 0));
                inventory.stock_status = newStatus;
                inventory.last_stock_update = new Date();
                await inventory.save();
            } else {
                await Inventory.create({
                    product_id: product._id,
                    seller_id: product.seller_id,
                    stock_quantity: stockQty,
                    available_quantity: stockQty,
                    sold_quantity: 0,
                    reserved_quantity: 0,
                    low_stock_limit: 5,
                    stock_status: newStatus,
                    last_stock_update: new Date()
                });
            }
        }

        logger.info(`Product updated: ${product.product_name}`, { productId: product._id, sellerId });

        return product;
    }

    async deleteProduct({ productId, sellerId }) {
        const query = sellerId ? { _id: productId, seller_id: sellerId } : { _id: productId };
        const product = await Product.findOne(query);

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        // Delete product images from cloudinary
        if (product.images && product.images.length > 0) {
            for (const imageUrl of product.images) {
                try {
                    await cloudinaryHelper.deleteFile(imageUrl);
                } catch (error) {
                    logger.error('Error deleting product image from Cloudinary:', error);
                }
            }
        }

        // Delete inventory
        await Inventory.findOneAndDelete({ product_id: productId });

        // Delete product
        await product.deleteOne();

        logger.info(`Product deleted: ${product.product_name}`, { productId, sellerId });

        return { message: 'Product deleted successfully' };
    }

    async updateProductStatus({ productId, sellerId, status }) {
        const product = await Product.findOne({
            _id: productId,
            seller_id: sellerId
        });

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        product.status = status;
        await product.save();

        return product;
    }

    async uploadProductImages({ productId, sellerId, files }) {
        const product = await Product.findOne({
            _id: productId,
            seller_id: sellerId
        });

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        const uploadedImages = [];

        for (const file of files) {
            const result = await cloudinaryHelper.uploadFile(file.path, {
                folder: `products/${sellerId}/${productId}`,
                width: 800,
                height: 800,
                crop: 'fill',
                quality: 'auto',
                format: 'webp'
            });

            uploadedImages.push({
                url: result.url,
                public_id: result.public_id
            });

            product.images.push(result.url);
        }

        await product.save();

        return {
            images: uploadedImages,
            product_id: productId
        };
    }

    async deleteProductImage({ productId, sellerId, publicId }) {
        const product = await Product.findOne({
            _id: productId,
            seller_id: sellerId
        });

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        // Remove from cloudinary
        await cloudinaryHelper.deleteFile(publicId);

        // Remove from product
        product.images = product.images.filter(img => !img.includes(publicId));
        await product.save();

        return { message: 'Image deleted successfully' };
    }

    async reorderProductImages({ productId, sellerId, imageOrder }) {
        const product = await Product.findOne({
            _id: productId,
            seller_id: sellerId
        });

        if (!product) {
            throw ApiError.notFound('Product not found or unauthorized');
        }

        // Validate image order
        const imageSet = new Set(product.images);
        for (const img of imageOrder) {
            if (!imageSet.has(img)) {
                throw ApiError.badRequest('Invalid image URL in order');
            }
        }

        product.images = imageOrder;
        await product.save();

        return product;
    }

    // ============ ADMIN ROUTES ============
    async approveProduct({ productId, adminId, adminComment = '' }) {
        const product = await Product.findById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        product.approval_status = 'approved';
        product.approved_by = adminId;
        product.approved_at = new Date();
        product.approval_comment = adminComment;
        product.status = 'active';
        await product.save();

        // Notify seller
        await Notification.create({
            user_id: product.seller_id,
            receiver_type: 'seller',
            title: 'Product Approved',
            message: `Your product "${product.product_name}" has been approved and is now live.`,
            notification_type: 'product',
            reference_id: product._id,
            reference_model: 'Product',
            channel: 'in_app'
        });

        return product;
    }

    async rejectProduct({ productId, adminId, adminComment }) {
        const product = await Product.findById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        product.approval_status = 'rejected';
        product.approved_by = adminId;
        product.approved_at = new Date();
        product.approval_comment = adminComment;
        product.status = 'inactive';
        await product.save();

        // Notify seller
        await Notification.create({
            user_id: product.seller_id,
            receiver_type: 'seller',
            title: 'Product Rejected',
            message: `Your product "${product.product_name}" has been rejected. Reason: ${adminComment}`,
            notification_type: 'product',
            reference_id: product._id,
            reference_model: 'Product',
            channel: 'in_app'
        });

        return product;
    }

    async toggleFeatureProduct(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        product.is_featured = !product.is_featured;
        await product.save();

        return product;
    }

    async toggleBlockProduct(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        product.status = product.status === 'blocked' ? 'active' : 'blocked';
        await product.save();

        return product;
    }

    async adminGetAllProducts({
        page = 1,
        limit = 10,
        search = null,
        sellerId = null,
        categoryId = null,
        status = null,
        approvalStatus = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
    }) {
        const query = {};

        if (sellerId) {
            query.seller_id = sellerId;
        }

        if (categoryId) {
            query.category_id = categoryId;
        }

        if (status) {
            query.status = status;
        }

        if (approvalStatus) {
            query.approval_status = approvalStatus;
        }

        if (search) {
            query.$or = [
                { product_name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('seller_id', 'business_name')
                .populate('category_id', 'category_name')
                .populate('sub_category_id', 'sub_category_name')
                .populate('approved_by', 'first_name last_name email')
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

    async adminDeleteProduct(productId) {
        const product = await Product.findById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        // Delete product images from cloudinary
        if (product.images && product.images.length > 0) {
            for (const imageUrl of product.images) {
                try {
                    await cloudinaryHelper.deleteFile(imageUrl);
                } catch (error) {
                    logger.error('Error deleting product image from Cloudinary:', error);
                }
            }
        }

        // Delete inventory
        await Inventory.findOneAndDelete({ product_id: productId });

        await product.deleteOne();

        return { message: 'Product deleted successfully' };
    }

    // ============ SUB-ADMIN ROUTES ============
    async getProductsBySeller({
        sellerId,
        page = 1,
        limit = 10,
        status = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
    }) {
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        const query = {
            seller_id: sellerId
        };

        if (status) {
            query.status = status;
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

    async getProductActivity(productId) {
        let query;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            query = { _id: productId };
        } else {
            query = { product_code: productId };
        }

        const product = await Product.findOne(query)
            .populate('created_by', 'first_name last_name username email')
            .populate('approved_by', 'first_name last_name username email')
            .populate('rejected_by', 'first_name last_name username email')
            .populate('seller_id', 'business_name store_name');

        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        const actualId = product._id;

        // Fetch audit logs related to this product
        const auditLogs = await AuditLog.find({
            module: 'product',
            $or: [
                { module_id: actualId },
                { 'new_data.productId': actualId },
                { 'new_data.productId': actualId.toString() }
            ]
        })
            .populate('user_id', 'first_name last_name username email')
            .sort({ created_at: -1 })
            .limit(20);

        // Fetch recent reviews
        const recentReviews = await Review.find({ product_id: actualId })
            .populate('user_id', 'first_name last_name username')
            .sort({ created_at: -1 })
            .limit(5);

        const activities = [];

        // 1. Audit Logs
        auditLogs.forEach(log => {
            activities.push({
                id: log._id,
                type: log.action || 'system',
                title: log.description || `Product ${log.action}`,
                user: log.user_id ? `${log.user_id.first_name || ''} ${log.user_id.last_name || ''}`.trim() || log.user_id.username : 'System / Admin',
                user_role: log.user_type || 'admin',
                timestamp: log.created_at,
                details: log.new_data || {}
            });
        });

        // 2. Reviews activity
        recentReviews.forEach(rev => {
            const reviewerName = rev.user_id ? `${rev.user_id.first_name || ''} ${rev.user_id.last_name || ''}`.trim() || rev.user_id.username : 'Customer';
            activities.push({
                id: `rev-${rev._id}`,
                type: 'review',
                title: `Customer review: ${rev.rating}★ rating received`,
                user: reviewerName,
                user_role: 'customer',
                timestamp: rev.created_at,
                details: { comment: rev.comment, rating: rev.rating }
            });
        });

        // 3. Approval milestone
        if (product.approved_at) {
            const approverName = product.approved_by ? `${product.approved_by.first_name || ''} ${product.approved_by.last_name || ''}`.trim() : 'Super Admin';
            activities.push({
                id: `appr-${product._id}`,
                type: 'approve',
                title: 'Product Approved by Marketplace Admin',
                user: approverName,
                user_role: 'admin',
                timestamp: product.approved_at,
                details: { status: 'approved' }
            });
        }

        // 4. Rejection milestone
        if (product.rejected_at) {
            const rejecterName = product.rejected_by ? `${product.rejected_by.first_name || ''} ${product.rejected_by.last_name || ''}`.trim() : 'Super Admin';
            activities.push({
                id: `rej-${product._id}`,
                type: 'reject',
                title: `Product Rejected by Admin: ${product.rejection_reason || 'Policy mismatch'}`,
                user: rejecterName,
                user_role: 'admin',
                timestamp: product.rejected_at,
                details: { reason: product.rejection_reason }
            });
        }

        // 5. Creation milestone
        const creatorName = product.created_by ? `${product.created_by.first_name || ''} ${product.created_by.last_name || ''}`.trim() : 'Seller';
        activities.push({
            id: `create-${product._id}`,
            type: 'create',
            title: `Product Created "${product.product_name}" (SKU: ${product.sku || 'N/A'})`,
            user: creatorName,
            user_role: 'seller',
            timestamp: product.created_at,
            details: { price: product.price, stock: product.stock_quantity }
        });

        // Sort all newest first
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return {
            product: {
                id: product._id,
                name: product.product_name,
                code: product.product_code,
                status: product.status,
                approval_status: product.approval_status
            },
            activities
        };
    }
}

module.exports = new ProductService();