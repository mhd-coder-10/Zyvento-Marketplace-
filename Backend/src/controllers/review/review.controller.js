// Handles all review related API requests
// Manages review creation, update, delete, and helpful votes
// Also handles product reviews, seller reviews, and review approval

const reviewService = require('../../services/review/review.service');
const Seller = require('../../models/seller.model');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const cloudinaryHelper = require('../../utils/cloudinary.helper');

const reviewController = {

    // ============ UPLOAD REVIEW MEDIA ============
    uploadReviewMedia: asyncHandler(async (req, res) => {
        const files = req.files || (req.file ? [req.file] : []);
        if (!files || files.length === 0) {
            throw ApiError.badRequest('No media files uploaded');
        }

        if (files.length > 3) {
            throw ApiError.badRequest('You can upload a maximum of 3 files (images or video)');
        }

        // Validate file limits
        for (const file of files) {
            if (file.mimetype.startsWith('image/') && file.size > 1 * 1024 * 1024) {
                throw ApiError.badRequest(`Image "${file.originalname}" exceeds 1MB limit. Maximum allowed is 1MB.`);
            }
        }

        // Upload all media in parallel for high speed
        const uploadedMedia = await Promise.all(
            files.map(async (file) => {
                const isVideo = file.mimetype.startsWith('video/');
                const result = await cloudinaryHelper.uploadFile(file.path, {
                    folder: 'reviews',
                    resource_type: isVideo ? 'video' : 'image'
                });
                return {
                    url: result.url,
                    type: isVideo ? 'video' : 'image',
                    public_id: result.public_id
                };
            })
        );

        res.status(200).json(
            ApiResponse.success(uploadedMedia, 'Review media uploaded successfully')
        );
    }),

    // ============ CREATE REVIEW ============
    createReview: asyncHandler(async (req, res) => {
        const userId = req.userId;
        const { product_id, order_id, rating, title, comment, images, videos } = req.body;

        const review = await reviewService.createReview({
            userId,
            productId: product_id,
            orderId: order_id,
            rating,
            title,
            comment,
            images,
            videos
        });

        res.status(201).json(
            ApiResponse.created(review, 'Review created successfully')
        );
    }),

    // ============ UPDATE REVIEW ============
    updateReview: asyncHandler(async (req, res) => {
        const userId = req.userId;
        const { reviewId } = req.params;
        const { rating, title, comment, images, videos } = req.body;

        const review = await reviewService.updateReview({
            reviewId,
            userId,
            rating,
            title,
            comment,
            images,
            videos
        });

        res.status(200).json(
            ApiResponse.success(review, 'Review updated successfully')
        );
    }),

    // ============ DELETE REVIEW ============
    deleteReview: asyncHandler(async (req, res) => {
        const userId = req.userId;
        const { reviewId } = req.params;

        await reviewService.deleteReview({ reviewId, userId });

        res.status(200).json(
            ApiResponse.success(null, 'Review deleted successfully')
        );
    }),

    // ============ GET PRODUCT REVIEWS ============
    getProductReviews: asyncHandler(async (req, res) => {
        const { productId } = req.params;
        const { page, limit, rating, sort_by, sort_order, with_images } = req.query;
        const userId = req.userId || null;

        const result = await reviewService.getProductReviews({
            productId,
            page,
            limit,
            rating,
            sortBy: sort_by,
            sortOrder: sort_order,
            withImages: with_images,
            userId
        });

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Product reviews fetched successfully',
            data: {
                reviews: result.reviews,
                userReview: result.userReview,
                ratingDistribution: result.ratingDistribution,
                averageRating: result.averageRating,
                totalReviews: result.totalReviews
            },
            pagination: result.pagination
        });
    }),

    // ============ GET SELLER REVIEWS ============
    getSellerReviews: asyncHandler(async (req, res) => {
        const { sellerId } = req.params;
        const { page, limit, rating, sentiment, product_id, review_status, sort_by, sort_order } = req.query;

        // Check access for seller
        if (req.userType === 'seller') {
            const userSellerId = req.sellerId?.toString();
            if (userSellerId && userSellerId !== sellerId) {
                throw ApiError.forbidden('You can only view your own seller reviews');
            }
        }

        const result = await reviewService.getSellerReviews({
            sellerId,
            page,
            limit,
            productId: product_id,
            sentiment,
            rating,
            reviewStatus: review_status,
            sortBy: sort_by,
            sortOrder: sort_order
        });

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Seller reviews fetched successfully',
            data: {
                reviews: result.reviews,
                ratingDistribution: result.ratingDistribution,
                statistics: result.statistics,
                seller: result.seller
            },
            pagination: result.pagination
        });
    }),

    // ============ GET USER'S OWN REVIEWS ============
    getUserReviews: asyncHandler(async (req, res) => {
        const userId = req.userId;
        const { page, limit } = req.query;

        const result = await reviewService.getUserReviews({
            userId,
            page,
            limit
        });

        res.status(200).json(
            ApiResponse.paginated(
                result.reviews,
                result.pagination,
                'Your reviews fetched successfully'
            )
        );
    }),

    // ============ GET SELLER PRODUCT REVIEWS ============
    getSellerProductReviews: asyncHandler(async (req, res) => {
        let sellerId = req.sellerId;
        if (!sellerId && req.userId) {
            const s = await Seller.findOne({ user_id: req.userId }).select('_id');
            if (s) sellerId = s._id;
        }

        if (!sellerId) {
            throw ApiError.forbidden('Seller account not found or access denied');
        }

        const { page, limit, rating, sentiment, product_id, productId, status, review_status, search, sort_by, sort_order } = req.query;

        const result = await reviewService.getSellerReviews({
            sellerId,
            page,
            limit,
            productId: product_id || productId,
            sentiment,
            rating,
            status,
            reviewStatus: review_status,
            search,
            sortBy: sort_by,
            sortOrder: sort_order
        });

        res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Seller product reviews fetched successfully',
            data: {
                reviews: result.reviews,
                ratingDistribution: result.ratingDistribution,
                statistics: result.statistics,
                seller: result.seller
            },
            pagination: result.pagination
        });
    }),

    // ============ MARK REVIEW HELPFUL ============
    markHelpful: asyncHandler(async (req, res) => {
        const userId = req.userId;
        const { reviewId } = req.params;

        const result = await reviewService.markHelpful({ reviewId, userId });

        res.status(200).json(
            ApiResponse.success(result, 'Review marked as helpful')
        );
    }),

    // ============ ADMIN APPROVE REVIEW ============
    approveReview: asyncHandler(async (req, res) => {
        const adminId = req.userId;
        const { reviewId } = req.params;
        const { status, admin_comment } = req.body;

        const review = await reviewService.approveReview({
            reviewId,
            status,
            adminComment: admin_comment,
            adminId
        });

        res.status(200).json(
            ApiResponse.success(review, `Review ${status} successfully`)
        );
    }),

    // ============ ADMIN GET ALL REVIEWS ============
    adminGetAllReviews: asyncHandler(async (req, res) => {
        const {
            page,
            limit,
            review_status,
            seller_id,
            product_id,
            rating,
            start_date,
            end_date,
            sort_by,
            sort_order
        } = req.query;

        const result = await reviewService.adminGetAllReviews({
            page,
            limit,
            reviewStatus: review_status,
            sellerId: seller_id,
            productId: product_id,
            rating,
            startDate: start_date,
            endDate: end_date,
            sortBy: sort_by,
            sortOrder: sort_order
        });

        res.status(200).json(
            ApiResponse.paginated(
                result.reviews,
                result.pagination,
                'All reviews fetched successfully'
            )
        );
    }),

    // ============ ADMIN DELETE REVIEW ============
    adminDeleteReview: asyncHandler(async (req, res) => {
        const { reviewId } = req.params;

        await reviewService.adminDeleteReview({ reviewId });

        res.status(200).json(
            ApiResponse.success(null, 'Review deleted successfully by admin')
        );
    }),

    // ============ GET REVIEW REPORT ============
    getReviewReport: asyncHandler(async (req, res) => {
        const { start_date, end_date, seller_id } = req.query;

        const report = await reviewService.getReviewReport({
            startDate: start_date,
            endDate: end_date,
            sellerId: seller_id
        });

        res.status(200).json(
            ApiResponse.success(report, 'Review report generated successfully')
        );
    }),

    // ============ GET REVIEW STATISTICS ============
    getReviewStatistics: asyncHandler(async (req, res) => {
        const { seller_id, product_id } = req.query;

        const statistics = await reviewService.getReviewStatistics({
            sellerId: seller_id,
            productId: product_id
        });

        res.status(200).json(
            ApiResponse.success(statistics, 'Review statistics fetched successfully')
        );
    })
};

module.exports = reviewController;