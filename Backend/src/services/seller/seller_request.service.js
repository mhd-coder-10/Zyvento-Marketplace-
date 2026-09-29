const SellerRequest = require('../../models/seller_request.model');
const Seller = require('../../models/seller.model');
const Product = require('../../models/product.model');
const ApiError = require('../../utils/apiError');
const Helpers = require('../../utils/helpers');
const auditService = require('../audit.service');
const crypto = require('crypto');

class SellerRequestService {
    // Generate unique Request Code: REQ-XXXXXX
    _generateRequestCode() {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        return `REQ-${randomNum}`;
    }

    // ============ SELLER METHODS ============

    // Create a new Seller Request
    async createSellerRequest({
        sellerId,
        userId,
        productId = null,
        requestType,
        requestedStatus = 'none',
        reason,
        message = '',
        ip = null,
        userAgent = null
    }) {
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            throw ApiError.notFound('Seller not found');
        }

        let product = null;
        if (productId) {
            product = await Product.findOne({ _id: productId, seller_id: sellerId });
            if (!product) {
                throw ApiError.badRequest('Invalid product selected for this seller');
            }
        }

        let requestCode = this._generateRequestCode();
        let attempts = 0;
        while (await SellerRequest.exists({ request_code: requestCode })) {
            requestCode = this._generateRequestCode();
            attempts++;
            if (attempts > 5) {
                requestCode = `REQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
                break;
            }
        }

        const request = new SellerRequest({
            request_code: requestCode,
            seller_id: sellerId,
            product_id: product ? product._id : null,
            request_type: requestType,
            requested_status: requestedStatus,
            reason: reason.trim(),
            message: message ? message.trim() : '',
            status: 'pending',
            created_by: userId
        });

        await request.save();

        // Populate details for return
        const populatedRequest = await SellerRequest.findById(request._id)
            .populate('product_id', 'product_name product_code images status')
            .populate('seller_id', 'seller_code business_name company_name email phone');

        // Log to Seller Activity
        try {
            await auditService.log({
                userId,
                action: 'create',
                module: 'seller',
                moduleId: sellerId,
                description: `Seller submitted Request #${requestCode}: ${requestType.replace(/_/g, ' ')} (${reason.trim()})`,
                ip,
                userAgent,
                status: 'success'
            });
        } catch (_) {}

        return populatedRequest;
    }

    // Get requests for seller
    async getSellerRequests(sellerId, { page = 1, limit = 10, status = null, search = null }) {
        const query = { seller_id: sellerId };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { request_code: regex },
                { reason: regex },
                { message: regex }
            ];
        }

        const currentPage = parseInt(page, 10) || 1;
        const perPage = parseInt(limit, 10) || 10;
        const skip = (currentPage - 1) * perPage;

        const [requests, total] = await Promise.all([
            SellerRequest.find(query)
                .populate('product_id', 'product_name product_code images status')
                .populate('responded_by', 'first_name last_name email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(perPage)
                .lean(),
            SellerRequest.countDocuments(query)
        ]);

        return {
            requests,
            pagination: Helpers.getPagination(currentPage, perPage, total)
        };
    }

    // Get single request by code
    async getRequestByCode(requestCode, sellerId = null) {
        const query = { request_code: requestCode };
        if (sellerId) {
            query.seller_id = sellerId;
        }

        const request = await SellerRequest.findOne(query)
            .populate('seller_id', 'seller_code business_name company_name email phone store_logo contact_person')
            .populate('product_id', 'product_name product_code images status approval_status price')
            .populate('responded_by', 'first_name last_name email')
            .populate('created_by', 'first_name last_name email')
            .lean();

        if (!request) {
            throw ApiError.notFound('Seller request not found');
        }

        return request;
    }

    // ============ ADMIN METHODS ============

    // Get all requests with filters & pagination
    async getAllSellerRequests({
        page = 1,
        limit = 10,
        status = null,
        request_type = null,
        search = null,
        seller_id = null
    } = {}) {
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (request_type && request_type !== 'all') {
            query.request_type = request_type;
        }

        if (seller_id) {
            query.seller_id = seller_id;
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { request_code: regex },
                { reason: regex },
                { message: regex }
            ];
        }

        const currentPage = parseInt(page, 10) || 1;
        const perPage = parseInt(limit, 10) || 10;
        const skip = (currentPage - 1) * perPage;

        const [requests, total] = await Promise.all([
            SellerRequest.find(query)
                .populate('seller_id', 'seller_code business_name company_name email phone contact_person')
                .populate('product_id', 'product_name product_code images status approval_status')
                .populate('responded_by', 'first_name last_name email')
                .populate('created_by', 'first_name last_name email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(perPage)
                .lean(),
            SellerRequest.countDocuments(query)
        ]);

        return {
            requests,
            pagination: Helpers.getPagination(currentPage, perPage, total)
        };
    }

    // Get stats counts for Admin
    async getSellerRequestStats() {
        const [total, pending, read, in_progress, solved] = await Promise.all([
            SellerRequest.countDocuments(),
            SellerRequest.countDocuments({ status: 'pending' }),
            SellerRequest.countDocuments({ status: 'read' }),
            SellerRequest.countDocuments({ status: 'in_progress' }),
            SellerRequest.countDocuments({ status: 'solved' })
        ]);

        return {
            total,
            pending,
            read,
            in_progress,
            solved
        };
    }

    // Update request status (Admin)
    async updateRequestStatus(requestCode, { status: newStatus, admin_response = '', update_product_status = false } = {}, adminId, { ip = null, userAgent = null } = {}) {
        const validStatuses = ['pending', 'read', 'in_progress', 'solved'];
        if (!validStatuses.includes(newStatus)) {
            throw ApiError.badRequest(`Invalid request status: ${newStatus}`);
        }

        const request = await SellerRequest.findOne({ request_code: requestCode })
            .populate('seller_id')
            .populate('product_id');

        if (!request) {
            throw ApiError.notFound('Seller request not found');
        }

        const oldStatus = request.status;
        request.status = newStatus;
        request.updated_by = adminId;

        if (admin_response) {
            request.admin_response = admin_response.trim();
        }

        let productUpdated = false;
        let productNewStatus = null;

        if (newStatus === 'solved') {
            request.responded_by = adminId;
            request.responded_at = new Date();

            // If admin opted to update the product status or if requested_status is set
            if (update_product_status && request.product_id && request.requested_status && request.requested_status !== 'none') {
                const product = request.product_id;
                if (product.approval_status === 'approved' && product.status !== 'deleted') {
                    const adminService = require('../admin/admin.service');
                    await adminService.updateProductStatusByCode(
                        product.product_code,
                        { status: request.requested_status, reason: admin_response || `Solved per request ${requestCode}` },
                        adminId
                    );
                    productUpdated = true;
                    productNewStatus = request.requested_status;
                }
            }
        }

        await request.save();

        // Log to Seller Activity Tab
        try {
            let actionDesc = `Admin marked request #${requestCode} as ${newStatus.replace(/_/g, ' ').toUpperCase()}`;
            if (newStatus === 'solved') {
                actionDesc = `Admin solved request #${requestCode}${request.admin_response ? ': "' + request.admin_response + '"' : ''}`;
                if (productUpdated) {
                    actionDesc += ` (Product status set to ${productNewStatus})`;
                }
            } else if (newStatus === 'read') {
                actionDesc = `Admin viewed and marked request #${requestCode} as Read`;
            } else if (newStatus === 'in_progress') {
                actionDesc = `Admin moved request #${requestCode} to In Progress`;
            }

            await auditService.log({
                userId: adminId,
                action: 'update',
                module: 'seller',
                moduleId: request.seller_id?._id || request.seller_id,
                description: actionDesc,
                ip,
                userAgent,
                status: 'success'
            });
        } catch (_) {}

        return this.getRequestByCode(requestCode);
    }
}

module.exports = new SellerRequestService();
