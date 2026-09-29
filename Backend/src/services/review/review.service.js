// Handles all review related business logic
// Manages review creation, update, delete, and helpful votes
// Also handles product reviews, seller reviews, and review approval

const mongoose = require('mongoose');
const Review = require('../../models/review.model');
const Product = require('../../models/product.model');
const Seller = require('../../models/seller.model');
const Order = require('../../models/order.model');
const User = require('../../models/user.model');
const notificationService = require('../notification/notification.service');
const cloudinaryHelper = require('../../utils/cloudinary.helper');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');
const constants = require('../../config/constants');

class ReviewService {

    // ============ CREATE REVIEW ============
    async createReview({ userId, productId, orderId, rating, title, comment, images = [], videos = [] }) {
        // Enforce 1 review per user per product
        const existingReview = await Review.findOne({
            user_id: userId,
            product_id: productId
        });

        if (existingReview) {
            throw ApiError.conflict('You have already submitted a review for this product. You can edit your existing review.');
        }

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        const reviewCode = `REV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

        // Create review (approved and published immediately)
        const review = await Review.create({
            review_code: reviewCode,
            user_id: userId,
            product_id: productId,
            product_code: product.product_code || `PRD-${product._id.toString().slice(-6).toUpperCase()}`,
            order_id: orderId || null,
            order_code: '',
            order_item_id: null,
            seller_id: product.seller_id || null,
            rating: Number(rating),
            title: title || '',
            comment: comment || '',
            images: Array.isArray(images) ? images : [],
            videos: Array.isArray(videos) ? videos : [],
            review_status: 'approved',
            status: 'published',
            is_edited: false,
            initial_comment: comment || '',
            initial_rating: Number(rating),
            initial_created_at: new Date()
        });

        // Populate user details
        await review.populate('user_id', 'first_name last_name username profile_image email');

        // Update product rating and reviews count
        await this.updateProductRating(productId);

        // Update seller rating
        if (product.seller_id) {
            await this.updateSellerRating(product.seller_id);
            // Dispatch notification asynchronously without blocking response
            notificationService.createNotification({
                userId: product.seller_id,
                receiverType: 'seller',
                title: 'New Product Review',
                message: `${rating}⭐ review received on "${product.product_name}"`,
                notificationType: 'product',
                referenceId: productId,
                referenceModel: 'Product',
                channel: 'in_app',
                priority: 'medium',
                metadata: {
                    reviewId: review._id,
                    rating: rating,
                    productName: product.product_name
                }
            }).catch(() => {});
        }

        return review;
    }

    // ============ UPDATE REVIEW ============
    async updateReview({ reviewId, userId, rating, title, comment, images, videos }) {
        const rId = typeof reviewId === 'string' && mongoose.Types.ObjectId.isValid(reviewId)
            ? new mongoose.Types.ObjectId(reviewId)
            : reviewId;
        const uId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const review = await Review.findOne({
            _id: rId,
            user_id: uId
        });

        if (!review) {
            throw ApiError.notFound('Review not found or you are not authorized');
        }

        // Enforce maximum 1 edit per review
        if (review.is_edited) {
            throw ApiError.badRequest('You have already edited this review once. Reviews can only be edited once.');
        }

        // Initialize edit history tracking
        if (!review.edit_history) review.edit_history = [];
        if (!review.initial_comment) {
            review.initial_comment = review.comment || '';
            review.initial_rating = review.rating;
            review.initial_created_at = review.created_at || new Date();
        }

        // Store old version in edit_history
        review.edit_history.push({
            comment: review.comment,
            rating: review.rating,
            title: review.title,
            edited_at: new Date()
        });

        review.is_edited = true;

        if (rating !== undefined && rating !== null) review.rating = Number(rating);
        if (title !== undefined) review.title = title;
        if (comment !== undefined) review.comment = comment;

        // Clean up removed images from Cloudinary
        if (images !== undefined) {
            const newImages = Array.isArray(images) ? images : [];
            const oldImages = Array.isArray(review.images) ? review.images : [];
            const removedImages = oldImages.filter(img => !newImages.includes(img));
            for (const img of removedImages) {
                cloudinaryHelper.deleteFile(img).catch(err => {
                    logger.error('Failed to delete removed review image from Cloudinary:', err);
                });
            }
            review.images = newImages;
        }

        // Clean up removed videos from Cloudinary
        if (videos !== undefined) {
            const newVideos = Array.isArray(videos) ? videos : [];
            const oldVideos = Array.isArray(review.videos) ? review.videos : [];
            const removedVideos = oldVideos.filter(vid => !newVideos.includes(vid));
            for (const vid of removedVideos) {
                cloudinaryHelper.deleteFile(vid, { resource_type: 'video' }).catch(err => {
                    logger.error('Failed to delete removed review video from Cloudinary:', err);
                });
            }
            review.videos = newVideos;
        }

        review.updated_at = new Date();
        await review.save();

        await review.populate('user_id', 'first_name last_name username profile_image email');

        // Recalculate product and seller ratings
        await this.updateProductRating(review.product_id);
        if (review.seller_id) {
            await this.updateSellerRating(review.seller_id);
        }

        return review;
    }

    // ============ DELETE REVIEW ============
    async deleteReview({ reviewId, userId }) {
        const rId = typeof reviewId === 'string' && mongoose.Types.ObjectId.isValid(reviewId)
            ? new mongoose.Types.ObjectId(reviewId)
            : reviewId;
        const uId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId;

        const review = await Review.findOne({
            _id: rId,
            user_id: uId
        });

        if (!review) {
            throw ApiError.notFound('Review not found or you are not authorized');
        }

        const productId = review.product_id;
        const sellerId = review.seller_id;

        // Delete all attached images and videos from Cloudinary
        if (Array.isArray(review.images) && review.images.length > 0) {
            for (const img of review.images) {
                cloudinaryHelper.deleteFile(img).catch(() => {});
            }
        }
        if (Array.isArray(review.videos) && review.videos.length > 0) {
            for (const vid of review.videos) {
                cloudinaryHelper.deleteFile(vid, { resource_type: 'video' }).catch(() => {});
            }
        }

        // Hard delete permanently as requested by the user
        await Review.deleteOne({ _id: rId, user_id: uId });

        // Recalculate ratings
        await this.updateProductRating(productId);
        if (sellerId) {
            await this.updateSellerRating(sellerId);
        }

        return { message: 'Review deleted successfully' };
    }

    // ============ UPDATE PRODUCT RATING ============
    async updateProductRating(productId) {
        const prodId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;
        const result = await Review.aggregate([
            {
                $match: {
                    product_id: prodId,
                    status: 'published'
                }
            },
            {
                $group: {
                    _id: '$product_id',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (result.length > 0) {
            const avg = Math.round(result[0].averageRating * 10) / 10;
            const total = result[0].totalReviews;
            await Product.findByIdAndUpdate(productId, {
                rating: avg,
                ratings: avg,
                total_reviews: total,
                num_reviews: total
            });
        } else {
            await Product.findByIdAndUpdate(productId, {
                rating: 0,
                ratings: 0,
                total_reviews: 0,
                num_reviews: 0
            });
        }
    }

    // ============ UPDATE SELLER RATING ============
    async updateSellerRating(sellerId) {
        if (!sellerId) return;
        const sId = typeof sellerId === 'string' ? new mongoose.Types.ObjectId(sellerId) : sellerId;
        const result = await Review.aggregate([
            {
                $match: {
                    seller_id: sId,
                    status: 'published'
                }
            },
            {
                $group: {
                    _id: '$seller_id',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        if (result.length > 0) {
            await Seller.findByIdAndUpdate(sellerId, {
                rating: Math.round(result[0].averageRating * 10) / 10
            });
        } else {
            await Seller.findByIdAndUpdate(sellerId, {
                rating: 0
            });
        }
    }

    // ============ GET PRODUCT REVIEWS ============
    async getProductReviews({
        productId,
        page = 1,
        limit = 10,
        rating = null,
        sortBy = 'created_at',
        sortOrder = 'desc',
        withImages = false,
        userId = null
    }) {
        let queryProduct;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            queryProduct = { _id: productId };
        } else {
            queryProduct = { product_code: productId };
        }

        const product = await Product.findOne(queryProduct);
        if (!product) {
            throw ApiError.notFound('Product not found');
        }

        const actualProductId = product._id;

        const query = {
            product_id: actualProductId,
            status: 'published'
        };

        if (rating) {
            query.rating = { $eq: parseInt(rating) };
        }

        if (withImages) {
            query.$or = [
                { 'images.0': { $exists: true } },
                { 'videos.0': { $exists: true } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'first_name last_name username profile_image email')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Review.countDocuments(query)
        ]);

        // Get rating distribution (published only)
        const distribution = await Review.aggregate([
            {
                $match: {
                    product_id: actualProductId,
                    status: 'published'
                }
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(d => {
            if (ratingDistribution[d._id] !== undefined) {
                ratingDistribution[d._id] = d.count;
            }
        });

        // If authenticated user ID provided, get user's own review
        let userReview = null;
        if (userId) {
            userReview = await Review.findOne({
                product_id: actualProductId,
                user_id: userId
            }).populate('user_id', 'first_name last_name username profile_image email');
        }

        return {
            reviews,
            userReview,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            },
            ratingDistribution,
            averageRating: product.ratings || product.rating || 0,
            totalReviews: product.num_reviews || product.total_reviews || 0
        };
    }

    // ============ GET SELLER REVIEWS ============
    async getSellerReviews({
        sellerId,
        page = 1,
        limit = 10,
        productId = null,
        sentiment = null,
        rating = null,
        status = null,
        reviewStatus = null,
        search = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
    }) {
        let sId = sellerId;
        if (typeof sellerId === 'string' && mongoose.Types.ObjectId.isValid(sellerId)) {
            sId = new mongoose.Types.ObjectId(sellerId);
        }

        let seller = await Seller.findById(sId);
        if (!seller) {
            seller = await Seller.findOne({ user_id: sId });
        }
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        const actualSellerId = seller._id;
        const sellerProducts = await Product.find({ seller_id: actualSellerId }).select('_id');
        const productIds = sellerProducts.map(p => p._id);

        let query = {
            $or: [
                { seller_id: actualSellerId },
                { product_id: { $in: productIds } }
            ]
        };

        if (productId) {
            let pObjectId = productId;
            if (typeof productId === 'string' && mongoose.Types.ObjectId.isValid(productId)) {
                pObjectId = new mongoose.Types.ObjectId(productId);
            }
            query.product_id = pObjectId;
        }

        if (sentiment) {
            if (sentiment === 'bad') {
                query.rating = { $lte: 2 };
            } else if (sentiment === 'medium') {
                query.rating = { $eq: 3 };
            } else if (sentiment === 'better' || sentiment === 'good') {
                query.rating = { $gte: 4 };
            }
        } else if (rating) {
            query.rating = { $eq: parseInt(rating) };
        }

        // Support status filtering (published, hidden, flagged, rejected)
        if (status && status !== 'all') {
            query.status = status;
        } else if (reviewStatus && reviewStatus !== 'all') {
            query.review_status = reviewStatus;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { title: searchRegex },
                    { comment: searchRegex },
                    { review_code: searchRegex }
                ]
            });
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'first_name last_name username profile_image email')
                .populate('product_id', 'product_name images sku product_code price')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Review.countDocuments(query)
        ]);

        // Get rating distribution for this seller (or filtered product)
        let matchStage = {
            $or: [
                { seller_id: actualSellerId },
                { product_id: { $in: productIds } }
            ]
        };
        if (query.product_id) matchStage = { product_id: query.product_id };

        const distribution = await Review.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distribution.forEach(d => {
            if (ratingDistribution[d._id] !== undefined) {
                ratingDistribution[d._id] = d.count;
            }
        });

        // Get review statistics
        const stats = await Review.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    withImagesCount: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $gt: [{ $size: '$images' }, 0] },
                                        { $gt: [{ $size: '$videos' }, 0] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        return {
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            },
            ratingDistribution,
            statistics: {
                averageRating: stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0,
                totalReviews: stats[0]?.totalReviews || 0,
                withImagesCount: stats[0]?.withImagesCount || 0
            },
            seller: {
                id: seller._id,
                businessName: seller.business_name,
                rating: seller.rating || 0
            }
        };
    }

    // ============ GET USER REVIEWS ============
    async getUserReviews({ userId, page = 1, limit = 10 }) {
        const [reviews, total] = await Promise.all([
            Review.find({ user_id: userId })
                .populate('product_id', 'product_name images price sku')
                .populate('seller_id', 'business_name')
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Review.countDocuments({ user_id: userId })
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

    // ============ MARK REVIEW HELPFUL ============
    async markHelpful({ reviewId, userId }) {
        const review = await Review.findById(reviewId);
        if (!review) {
            throw ApiError.notFound('Review not found');
        }

        // Check if user already marked as helpful
        if (review.helpful_users.includes(userId)) {
            throw ApiError.conflict('You already marked this review as helpful');
        }

        review.helpful_users.push(userId);
        review.helpful_count += 1;
        await review.save();

        return { helpful_count: review.helpful_count };
    }

    // ============ ADMIN APPROVE REVIEW ============
    async approveReview({ reviewId, status, adminComment, adminId }) {
        const review = await Review.findById(reviewId);
        if (!review) {
            throw ApiError.notFound('Review not found');
        }

        review.review_status = status;
        if (status === 'approved') {
            review.status = 'published';
            review.published_at = new Date();
        } else if (status === 'rejected') {
            review.status = 'rejected';
            review.rejected_at = new Date();
        }
        if (adminComment) {
            review.admin_comment = adminComment;
        }
        await review.save();

        // Always update product and seller ratings
        await this.updateProductRating(review.product_id);
        if (review.seller_id) {
            await this.updateSellerRating(review.seller_id);
        }

        // Send notification to user
        if (status === 'approved') {
            await notificationService.createNotification({
                userId: review.user_id,
                receiverType: 'customer',
                title: 'Your Review is Approved',
                message: `Your review has been approved and published`,
                notificationType: 'product',
                referenceId: review._id,
                referenceModel: 'Review',
                channel: 'in_app'
            });
        }

        return review;
    }

    // ============ ADMIN GET ALL REVIEWS ============
    async adminGetAllReviews({
        page = 1,
        limit = 10,
        reviewStatus = null,
        sellerId = null,
        productId = null,
        rating = null,
        startDate = null,
        endDate = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
    }) {
        const query = {};

        if (reviewStatus) {
            query.review_status = reviewStatus;
        }

        if (sellerId) {
            query.seller_id = sellerId;
        }

        if (productId) {
            query.product_id = productId;
        }

        if (rating) {
            query.rating = { $eq: parseInt(rating) };
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

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'first_name last_name email')
                .populate('product_id', 'product_name sku')
                .populate('seller_id', 'business_name')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Review.countDocuments(query)
        ]);

        // Get summary statistics
        const summary = await Review.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    pendingReviews: {
                        $sum: { $cond: [{ $eq: ['$review_status', 'pending'] }, 1, 0] }
                    },
                    approvedReviews: {
                        $sum: { $cond: [{ $eq: ['$review_status', 'approved'] }, 1, 0] }
                    },
                    rejectedReviews: {
                        $sum: { $cond: [{ $eq: ['$review_status', 'rejected'] }, 1, 0] }
                    }
                }
            }
        ]);

        return {
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            },
            summary: summary[0] || {
                totalReviews: 0,
                averageRating: 0,
                pendingReviews: 0,
                approvedReviews: 0,
                rejectedReviews: 0
            }
        };
    }

    // ============ ADMIN DELETE REVIEW ============
    async adminDeleteReview({ reviewId }) {
        const review = await Review.findById(reviewId);
        if (!review) {
            throw ApiError.notFound('Review not found');
        }

        const productId = review.product_id;
        const sellerId = review.seller_id;

        // Delete all attached images and videos from Cloudinary
        if (Array.isArray(review.images) && review.images.length > 0) {
            for (const img of review.images) {
                cloudinaryHelper.deleteFile(img).catch(() => {});
            }
        }
        if (Array.isArray(review.videos) && review.videos.length > 0) {
            for (const vid of review.videos) {
                cloudinaryHelper.deleteFile(vid, { resource_type: 'video' }).catch(() => {});
            }
        }

        await review.deleteOne();

        // Recalculate ratings
        await this.updateProductRating(productId);
        await this.updateSellerRating(sellerId);

        return { message: 'Review deleted successfully' };
    }

    // ============ GET REVIEW REPORT ============
    async getReviewReport({ startDate, endDate, sellerId = null }) {
        const matchQuery = {
            created_at: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (sellerId) {
            matchQuery.seller_id = sellerId;
        }

        // Daily review trends
        const dailyTrends = await Review.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
                    },
                    total: { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                    approved: {
                        $sum: { $cond: [{ $eq: ['$review_status', 'approved'] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$review_status', 'pending'] }, 1, 0] }
                    },
                    rejected: {
                        $sum: { $cond: [{ $eq: ['$review_status', 'rejected'] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Rating distribution
        const ratingDistribution = await Review.aggregate([
            {
                $match: {
                    ...matchQuery,
                    review_status: 'approved'
                }
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top products by rating
        const topProducts = await Review.aggregate([
            {
                $match: {
                    ...matchQuery,
                    review_status: 'approved'
                }
            },
            {
                $group: {
                    _id: '$product_id',
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            { $sort: { avgRating: -1 } },
            { $limit: 10 },
            {
                $project: {
                    productId: '$_id',
                    productName: '$product.product_name',
                    avgRating: 1,
                    totalReviews: 1
                }
            }
        ]);

        // Overall summary
        const summary = await Review.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    withImages: {
                        $sum: { $cond: [{ $gt: [{ $size: '$images' }, 0] }, 1, 0] }
                    },
                    withoutImages: {
                        $sum: { $cond: [{ $eq: [{ $size: '$images' }, 0] }, 1, 0] }
                    }
                }
            }
        ]);

        return {
            period: {
                startDate,
                endDate
            },
            summary: summary[0] || {
                totalReviews: 0,
                averageRating: 0,
                withImages: 0,
                withoutImages: 0
            },
            dailyTrends,
            ratingDistribution,
            topProducts
        };
    }

    // ============ GET REVIEW STATISTICS ============
    async getReviewStatistics({ sellerId = null, productId = null }) {
        const matchQuery = { status: 'published' };

        if (sellerId) {
            matchQuery.seller_id = sellerId;
        }

        if (productId) {
            matchQuery.product_id = productId;
        }

        const statistics = await Review.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                    minRating: { $min: '$rating' },
                    maxRating: { $max: '$rating' },
                    withImages: {
                        $sum: { $cond: [{ $gt: [{ $size: '$images' }, 0] }, 1, 0] }
                    },
                    totalHelpful: { $sum: '$helpful_count' }
                }
            }
        ]);

        // Rating distribution
        const distribution = await Review.aggregate([
            {
                $match: matchQuery
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const ratingDistribution = {};
        for (let i = 1; i <= 5; i++) {
            const found = distribution.find(d => d._id === i);
            ratingDistribution[i] = found ? found.count : 0;
        }

        return {
            statistics: statistics[0] || {
                totalReviews: 0,
                averageRating: 0,
                minRating: 0,
                maxRating: 0,
                withImages: 0,
                totalHelpful: 0
            },
            ratingDistribution
        };
    }
}

module.exports = new ReviewService();