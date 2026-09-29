const sellerRequestService = require('../../services/seller/seller_request.service');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');

const sellerRequestController = {
    // ============ SELLER ENDPOINTS ============

    // Create a new request
    createRequest: asyncHandler(async (req, res) => {
        const sellerId = req.sellerId;
        if (!sellerId) {
            throw ApiError.badRequest('Seller account required');
        }

        const { product_id, request_type, requested_status, reason, message } = req.body;
        if (!reason || !reason.trim()) {
            throw ApiError.badRequest('Reason is required');
        }

        const request = await sellerRequestService.createSellerRequest({
            sellerId,
            userId: req.userId,
            productId: product_id || null,
            requestType: request_type || 'product_status_change',
            requestedStatus: requested_status || 'none',
            reason,
            message,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(201).json(ApiResponse.success(request, 'Seller request submitted successfully'));
    }),

    // Get seller's own requests
    getMyRequests: asyncHandler(async (req, res) => {
        const sellerId = req.sellerId;
        if (!sellerId) {
            throw ApiError.badRequest('Seller account required');
        }

        const { page = 1, limit = 10, status, search } = req.query;
        const result = await sellerRequestService.getSellerRequests(sellerId, {
            page,
            limit,
            status,
            search
        });

        res.status(200).json(ApiResponse.paginated(result.requests, result.pagination, 'Seller requests retrieved'));
    }),

    // Get a specific request by request_code (for seller)
    getRequestByCode: asyncHandler(async (req, res) => {
        const sellerId = req.sellerId;
        const { requestCode } = req.params;

        const request = await sellerRequestService.getRequestByCode(requestCode, sellerId);
        res.status(200).json(ApiResponse.success(request, 'Request details retrieved'));
    }),

    // ============ ADMIN ENDPOINTS ============

    // Admin get all requests
    getAllRequests: asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, status, request_type, search, seller_id } = req.query;
        const result = await sellerRequestService.getAllSellerRequests({
            page,
            limit,
            status,
            request_type,
            search,
            seller_id
        });

        res.status(200).json(ApiResponse.paginated(result.requests, result.pagination, 'All seller requests retrieved'));
    }),

    // Admin get request statistics
    getRequestStats: asyncHandler(async (req, res) => {
        const stats = await sellerRequestService.getSellerRequestStats();
        res.status(200).json(ApiResponse.success(stats, 'Request statistics retrieved'));
    }),

    // Admin get request by code
    getAdminRequestByCode: asyncHandler(async (req, res) => {
        const { requestCode } = req.params;
        const request = await sellerRequestService.getRequestByCode(requestCode);
        res.status(200).json(ApiResponse.success(request, 'Request details retrieved'));
    }),

    // Admin update request status
    updateRequestStatus: asyncHandler(async (req, res) => {
        const { requestCode } = req.params;
        const { status, admin_response, update_product_status } = req.body;

        if (!status) {
            throw ApiError.badRequest('Status is required');
        }

        const updated = await sellerRequestService.updateRequestStatus(
            requestCode,
            { status, admin_response, update_product_status },
            req.userId,
            { ip: req.ip, userAgent: req.get('user-agent') }
        );

        res.status(200).json(ApiResponse.success(updated, 'Seller request status updated successfully'));
    })
};

module.exports = sellerRequestController;
