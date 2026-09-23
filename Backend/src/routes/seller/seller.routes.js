// Seller main route definitions
// Profile, dashboard, documents, products, orders, employees
// All seller routes require authentication and seller role

const express = require('express');
const router = express.Router();

const sellerController = require('../../controllers/seller/seller.controller');
const productController = require('../../controllers/product/product.controller');
const auth = require('../../middleware/auth.middleware');
const { authorize, checkPermission, checkSellerAccess } = require('../../middleware/authorization.middleware');
const { validate } = require('../../middleware/validation.middleware');
const sellerValidation = require('../../validations/seller.validation');
const productValidation = require('../../validations/product.validation');
const orderValidation = require('../../validations/order.validation');

/**
 * @swagger
 * tags:
 *   name: Seller
 *   description: Seller management endpoints
 */

// ============ PUBLIC ROUTES ============

/**
 * @swagger
 * /seller/public/{sellerId}:
 *   get:
 *     summary: Get seller public profile
 *     description: Get limited public information of a seller (Public)
 *     tags: [Seller]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Seller profile fetched successfully
 *       404:
 *         description: Seller not found
 */
router.get(
    '/public/:sellerId',
    validate(sellerValidation.sellerIdParam),
    sellerController.getPublicProfile
);

/**
 * @swagger
 * /seller/{sellerId}/products:
 *   get:
 *     summary: Get seller products (Public)
 *     description: Get all products of a specific seller (Public)
 *     tags: [Seller]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Seller products fetched successfully
 *       404:
 *         description: Seller not found
 */
router.get(
    '/:sellerId/products',
    validate(sellerValidation.sellerIdParam),
    sellerController.getSellerProducts
);

/**
 * @swagger
 * /seller/{sellerId}/reviews:
 *   get:
 *     summary: Get seller reviews (Public)
 *     description: Get all reviews of a specific seller (Public)
 *     tags: [Seller]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Seller reviews fetched successfully
 *       404:
 *         description: Seller not found
 */
router.get(
    '/:sellerId/reviews',
    validate(sellerValidation.sellerIdParam),
    sellerController.getSellerReviews
);

// ============ SELLER REGISTRATION ============
// These are in sellerRegistration.routes.js

// ============ SELLER AUTHENTICATED ROUTES ============
router.use(auth);

// ============ SELLER PROFILE ============

/**
 * @swagger
 * /seller/profile:
 *   get:
 *     summary: Get seller profile
 *     description: Get full profile of the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/profile',
    authorize('seller'),
    sellerController.getProfile
);

/**
 * @swagger
 * /seller/profile:
 *   put:
 *     summary: Update seller profile
 *     description: Update profile of the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_name:
 *                 type: string
 *               business_address:
 *                 type: object
 *               bank_details:
 *                 type: object
 *               settings:
 *                 type: object
 *               business_type:
 *                 type: string
 *                 enum: [individual, company, brand, partnership]
 *               owner_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       422:
 *         description: Validation error
 */
router.put(
    '/profile',
    authorize('seller'),
    validate(sellerValidation.updateSeller),
    sellerController.updateProfile
);

/**
 * @swagger
 * /seller/dashboard:
 *   get:
 *     summary: Get seller dashboard
 *     description: Get dashboard data for the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/dashboard',
    authorize('seller'),
    sellerController.getDashboard
);

/**
 * @swagger
 * /seller/dashboard/statistics:
 *   get:
 *     summary: Get seller dashboard statistics
 *     description: Get statistics for seller dashboard
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *           default: weekly
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/dashboard/statistics',
    authorize('seller'),
    sellerController.getDashboardStatistics
);

// ============ SELLER DOCUMENTS ============

/**
 * @swagger
 * /seller/documents:
 *   post:
 *     summary: Upload seller document
 *     description: Upload a document for the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document_type:
 *                 type: string
 *                 enum: [business_license, tax_certificate, identity_proof, address_proof, bank_details, gst_certificate, pan_card]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       413:
 *         description: File too large
 *       422:
 *         description: Validation error
 */
router.post(
    '/documents',
    authorize('seller'),
    validate(sellerValidation.uploadSellerDocument),
    sellerController.uploadDocument
);

/**
 * @swagger
 * /seller/documents/{documentId}:
 *   delete:
 *     summary: Delete seller document
 *     description: Delete a document of the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       404:
 *         description: Document not found
 */
router.delete(
    '/documents/:documentId',
    authorize('seller'),
    validate(sellerValidation.idParam),
    sellerController.deleteDocument
);

/**
 * @swagger
 * /seller/documents:
 *   get:
 *     summary: Get seller documents
 *     description: Get all documents of the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/documents',
    authorize('seller'),
    sellerController.getDocuments
);

// ============ SELLER PRODUCTS ============

/**
 * @swagger
 * /seller/products:
 *   get:
 *     summary: Get seller's products
 *     description: Get all products of the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, active, inactive, blocked]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/products',
    authorize('seller'),
    sellerController.getMyProducts
);

/**
 * @swagger
 * /seller/products:
 *   post:
 *     summary: Create product (Seller)
 *     description: Create a new product for the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_name
 *               - price
 *               - category_id
 *               - sub_category_id
 *               - sku
 *             properties:
 *               product_name:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               category_id:
 *                 type: string
 *               sub_category_id:
 *                 type: string
 *               price:
 *                 type: number
 *               compare_at_price:
 *                 type: number
 *               cost_per_item:
 *                 type: number
 *               discount:
 *                 type: number
 *               sku:
 *                 type: string
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: object
 *               variants:
 *                 type: array
 *               specifications:
 *                 type: object
 *               is_featured:
 *                 type: boolean
 *               tags:
 *                 type: array
 *               seo:
 *                 type: object
 *               return_policy:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       409:
 *         description: SKU already exists
 *       422:
 *         description: Validation error
 */
router.post(
    '/products',
    authorize('seller'),
    validate(productValidation.createProduct),
    sellerController.createProduct
);

router.put(
    '/products/:productId',
    authorize('seller'),
    validate(productValidation.updateProduct),
    productController.updateProduct
);

router.delete(
    '/products/:productId',
    authorize('seller'),
    productController.deleteProduct
);

// ============ SELLER ORDERS ============

/**
 * @swagger
 * /seller/orders:
 *   get:
 *     summary: Get seller orders
 *     description: Get all orders for the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, returned]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/orders',
    authorize('seller'),
    sellerController.getOrders
);

/**
 * @swagger
 * /seller/orders/{orderId}:
 *   get:
 *     summary: Get seller order details
 *     description: Get detailed information of a specific order
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       404:
 *         description: Order not found
 */
router.get(
    '/orders/:orderId',
    authorize('seller'),
    validate(sellerValidation.orderIdParam),
    sellerController.getOrderDetails
);

/**
 * @swagger
 * /seller/orders/{orderId}/status:
 *   put:
 *     summary: Update order status (Seller)
 *     description: Update the status of an order
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, returned]
 *               notes:
 *                 type: string
 *               tracking_id:
 *                 type: string
 *               tracking_carrier:
 *                 type: string
 *               tracking_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       404:
 *         description: Order not found
 *       409:
 *         description: Cannot update delivered/cancelled order
 *       422:
 *         description: Validation error
 */
router.put(
    '/orders/:orderId/status',
    authorize('seller'),
    validate(orderValidation.updateOrderStatus),
    sellerController.updateOrderStatus
);

// ============ SELLER REPORTS ============

/**
 * @swagger
 * /seller/reports/performance:
 *   get:
 *     summary: Get seller performance report
 *     description: Get performance report for the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Performance report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       422:
 *         description: Validation error
 */
router.get(
    '/reports/performance',
    authorize('seller'),
    sellerController.getPerformanceReport
);

/**
 * @swagger
 * /seller/reports/sales:
 *   get:
 *     summary: Get seller sales report
 *     description: Get sales report for the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *     responses:
 *       200:
 *         description: Sales report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       422:
 *         description: Validation error
 */
router.get(
    '/reports/sales',
    authorize('seller'),
    sellerController.getSalesReport
);

/**
 * @swagger
 * /seller/reports/analytics:
 *   get:
 *     summary: Get seller analytics
 *     description: Get analytics for the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Analytics fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/reports/analytics',
    authorize('seller'),
    sellerController.getAnalytics
);

// ============ SELLER EARNINGS & PAYOUTS ============

/**
 * @swagger
 * /seller/earnings:
 *   get:
 *     summary: Get seller earnings and settlement transactions
 *     description: Get earnings, gross revenue, deductions, and payout history
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/earnings',
    authorize('seller'),
    sellerController.getEarnings
);

// ============ SELLER SETTINGS ============

/**
 * @swagger
 * /seller/settings:
 *   get:
 *     summary: Get seller settings
 *     description: Get settings of the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.get(
    '/settings',
    authorize('seller'),
    sellerController.getSettings
);

/**
 * @swagger
 * /seller/settings:
 *   put:
 *     summary: Update seller settings
 *     description: Update settings of the authenticated seller
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_processing_time:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 72
 *               return_policy:
 *                 type: string
 *               shipping_methods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     cost:
 *                       type: number
 *                       minimum: 0
 *                     estimated_days:
 *                       type: integer
 *                       minimum: 1
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 *       422:
 *         description: Validation error
 */
router.put(
    '/settings',
    authorize('seller'),
    validate(sellerValidation.updateSellerSettings),
    sellerController.updateSettings
);

// ============ SELLER CATEGORY CREATION ============
/**
 * @swagger
 * /seller/categories:
 *   post:
 *     summary: Create or find category (Seller)
 *     description: Allows seller to add a custom category if not in database
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *             properties:
 *               category_name:
 *                 type: string
 *               description:
 *                 type: string
 *               sub_category_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created or retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller role required
 */
router.post(
    '/categories',
    authorize('seller'),
    sellerController.createCategory
);

module.exports = router;