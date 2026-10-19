// Notification Controller - Handles both Admin Notification Center and User Notification Hub
// Connects with NotificationService and NotificationEngine

const notificationService = require('../../services/notification/notification.service');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');

const notificationController = {

    // ============================================================
    // ADMIN NOTIFICATION CENTER & BROADCAST MANAGEMENT
    // ============================================================

    // Notification Center: Get paginated notifications with KPI stats, tabs & filters
    getAllNotificationsAdmin: asyncHandler(async (req, res) => {
        const result = await notificationService.getAllNotificationsAdmin(req.query);
        res.status(200).json({
            success: true,
            data: result.notifications,
            stats: result.stats,
            tabCounts: result.tabCounts,
            pagination: result.pagination,
            message: 'Notifications fetched successfully'
        });
    }),

    // Notification Details: Includes metrics, activity timeline, and delivery logs
    getNotificationByCode: asyncHandler(async (req, res) => {
        const result = await notificationService.getNotificationByCode(req.params.notificationCode);
        res.status(200).json(ApiResponse.success(result, 'Notification details fetched successfully'));
    }),

    // Create Broadcast (Send immediately, schedule for later, or save as draft)
    createBroadcast: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const result = await notificationService.createBroadcast(req.body, adminId);
        res.status(201).json(ApiResponse.created(result, 'Broadcast notification created successfully'));
    }),

    // Update draft or scheduled broadcast
    updateNotification: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const result = await notificationService.updateNotification(req.params.notificationCode, req.body, adminId);
        res.status(200).json(ApiResponse.success(result, 'Notification updated successfully'));
    }),

    // Cancel a scheduled broadcast
    cancelBroadcast: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const result = await notificationService.cancelBroadcast(req.params.notificationCode, adminId);
        res.status(200).json(ApiResponse.success(result.notification, result.message));
    }),

    // Trigger immediate send for draft/scheduled broadcast
    sendNow: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const result = await notificationService.sendNow(req.params.notificationCode, adminId);
        res.status(200).json(ApiResponse.success(result.notification, result.message));
    }),

    // Soft delete notification
    deleteNotification: asyncHandler(async (req, res) => {
        const idOrCode = req.params.notificationId || req.params.notificationCode;
        const userId = (req.user?.role === 'super_admin' || req.user?.user_type === 'super_admin') ? null : (req.user?.id || req.userId);
        const result = await notificationService.deleteNotification(idOrCode, userId);
        res.status(200).json(ApiResponse.success(null, result.message));
    }),

    // Mark single notification as read
    markAsRead: asyncHandler(async (req, res) => {
        const idOrCode = req.params.notificationId || req.params.notificationCode;
        const userId = (req.user?.role === 'super_admin' || req.user?.user_type === 'super_admin') ? null : (req.user?.id || req.userId);
        const notification = await notificationService.markNotificationAsRead(idOrCode, userId);
        res.status(200).json(ApiResponse.success(notification, 'Notification marked as read'));
    }),

    // Mark all notifications as read
    markAllAsRead: asyncHandler(async (req, res) => {
        const userId = req.userType === 'super_admin' ? null : (req.user?.id || req.userId);
        const result = await notificationService.markAllNotificationsAsRead(userId);
        res.status(200).json(ApiResponse.success(result, result.message));
    }),

    // Track click on notification action URL
    trackClick: asyncHandler(async (req, res) => {
        const userId = req.user?.id || req.userId;
        const result = await notificationService.trackClick(req.params.notificationCode, userId);
        res.status(200).json(ApiResponse.success(result, 'Click tracked'));
    }),

    // ============================================================
    // NOTIFICATION ANALYTICS (REAL MONGODB AGGREGATION)
    // ============================================================
    getAnalytics: asyncHandler(async (req, res) => {
        const result = await notificationService.getAnalytics(req.query);
        res.status(200).json(ApiResponse.success(result, 'Notification analytics fetched successfully'));
    }),

    // ============================================================
    // DELIVERY TRACKING & LOGS
    // ============================================================
    getDeliveryLogs: asyncHandler(async (req, res) => {
        const result = await notificationService.getDeliveryLogs(req.query);
        res.status(200).json(
            ApiResponse.paginated(
                result.logs,
                result.pagination,
                'Delivery logs fetched successfully'
            )
        );
    }),

    retryDeliveryLog: asyncHandler(async (req, res) => {
        const result = await notificationService.retryDeliveryLog(req.params.logId);
        res.status(200).json(ApiResponse.success(result, 'Delivery retry completed'));
    }),

    // ============================================================
    // REUSABLE TEMPLATES MANAGEMENT
    // ============================================================
    getTemplates: asyncHandler(async (req, res) => {
        const templates = await notificationService.getTemplates(req.query);
        res.status(200).json(ApiResponse.success(templates, 'Notification templates fetched successfully'));
    }),

    getTemplateByCode: asyncHandler(async (req, res) => {
        const template = await notificationService.getTemplateByCode(req.params.code);
        res.status(200).json(ApiResponse.success(template, 'Template fetched successfully'));
    }),

    createTemplate: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const template = await notificationService.createTemplate(req.body, adminId);
        res.status(201).json(ApiResponse.created(template, 'Template created successfully'));
    }),

    updateTemplate: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const template = await notificationService.updateTemplate(req.params.code, req.body, adminId);
        res.status(200).json(ApiResponse.success(template, 'Template updated successfully'));
    }),

    deleteTemplate: asyncHandler(async (req, res) => {
        const result = await notificationService.deleteTemplate(req.params.code);
        res.status(200).json(ApiResponse.success(null, result.message));
    }),

    // ============================================================
    // SYSTEM ALERTS MANAGEMENT
    // ============================================================
    getSystemAlerts: asyncHandler(async (req, res) => {
        const result = await notificationService.getSystemAlerts(req.query);
        res.status(200).json({
            success: true,
            data: result.alerts,
            stats: result.stats,
            pagination: result.pagination,
            message: 'System alerts fetched successfully'
        });
    }),

    acknowledgeAlert: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const alert = await notificationService.acknowledgeAlert(req.params.alertCode, adminId);
        res.status(200).json(ApiResponse.success(alert, 'System alert acknowledged'));
    }),

    resolveAlert: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const alert = await notificationService.resolveAlert(req.params.alertCode, req.body.resolution_notes, adminId);
        res.status(200).json(ApiResponse.success(alert, 'System alert resolved'));
    }),

    // ============================================================
    // USER NOTIFICATION PREFERENCES
    // ============================================================
    getPreferences: asyncHandler(async (req, res) => {
        const userId = req.params.userId || req.user?.id || req.userId;
        const preferences = await notificationService.getPreferences(userId);
        res.status(200).json(ApiResponse.success(preferences, 'Notification preferences fetched successfully'));
    }),

    updatePreferences: asyncHandler(async (req, res) => {
        const userId = req.params.userId || req.user?.id || req.userId;
        const updated = await notificationService.updatePreferences(userId, req.body);
        res.status(200).json(ApiResponse.success(updated, 'Notification preferences updated successfully'));
    }),

    // ============================================================
    // USER-FACING NOTIFICATIONS HUB (CUSTOMER & SELLER)
    // ============================================================
    getNotifications: asyncHandler(async (req, res) => {
        const userId = req.user?.id || req.userId;
        const { page = 1, limit = 10, type = null, is_read = null } = req.query;

        if (!userId) {
            throw ApiError.unauthorized('User not authenticated');
        }

        const result = await notificationService.getNotifications({
            userId,
            page,
            limit,
            type,
            isRead: is_read
        });

        res.status(200).json(
            ApiResponse.paginated(
                result.notifications,
                result.pagination,
                'Notifications fetched successfully',
                { unreadCount: result.unreadCount }
            )
        );
    }),

    getUnreadNotifications: asyncHandler(async (req, res) => {
        const userId = req.user?.id || req.userId;
        const { page = 1, limit = 10 } = req.query;

        if (!userId) {
            throw ApiError.unauthorized('User not authenticated');
        }

        const result = await notificationService.getUnreadNotifications({
            userId,
            page,
            limit
        });

        res.status(200).json(
            ApiResponse.paginated(
                result.notifications,
                result.pagination,
                'Unread notifications fetched successfully'
            )
        );
    }),
    getUnreadCount: asyncHandler(async (req, res) => {
        const userId = req.user?.id || req.userId;
        if (!userId) {
            return res.status(200).json({ success: true, data: { unreadCount: 0 } });
        }
        const result = await notificationService.getUnreadCount(userId);
        res.status(200).json(ApiResponse.success(result, 'Unread count fetched'));
    }),

    // Backward compatibility aliases
    getNotificationById: asyncHandler(async (req, res) => {
        const codeOrId = req.params.notificationId || req.params.notificationCode;
        const result = await notificationService.getNotificationByCode(codeOrId);
        res.status(200).json(ApiResponse.success(result, 'Notification details fetched successfully'));
    }),

    sendBroadcast: asyncHandler(async (req, res) => {
        const adminId = req.user?.id || req.userId;
        const result = await notificationService.createBroadcast(req.body, adminId);
        res.status(201).json(ApiResponse.created(result, 'Broadcast notification created successfully'));
    }),

    adminGetAllNotifications: asyncHandler(async (req, res) => {
        const result = await notificationService.getAllNotificationsAdmin(req.query);
        res.status(200).json({
            success: true,
            data: result.notifications,
            stats: result.stats,
            tabCounts: result.tabCounts,
            pagination: result.pagination,
            message: 'All notifications fetched successfully'
        });
    }),

    clearAllNotifications: asyncHandler(async (req, res) => {
        const userId = req.user?.id || req.userId;
        const Notification = require('../../models/notification.model');
        const result = await Notification.updateMany(
            { user_id: userId, is_deleted: false },
            { $set: { is_deleted: true, deleted_at: new Date() } }
        );
        res.status(200).json(ApiResponse.success({ clearedCount: result.modifiedCount }, 'All notifications cleared successfully'));
    }),

    getStatistics: asyncHandler(async (req, res) => {
        const userId = req.user?.id || req.userId;
        const Notification = require('../../models/notification.model');
        const [total, unread, read] = await Promise.all([
            Notification.countDocuments({ user_id: userId, is_deleted: false }),
            Notification.countDocuments({ user_id: userId, is_read: false, is_deleted: false }),
            Notification.countDocuments({ user_id: userId, is_read: true, is_deleted: false })
        ]);
        res.status(200).json(ApiResponse.success({ total, unread, read }, 'Notification statistics fetched successfully'));
    })
};

module.exports = notificationController;