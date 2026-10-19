// Handles all notification business logic, broadcasts, delivery logs, analytics, and templates
// Integrates with NotificationEngine, NotificationLog, NotificationTemplate, and SystemAlert

const mongoose = require('mongoose');
const Notification = require('../../models/notification.model');
const NotificationTemplate = require('../../models/notification_template.model');
const NotificationPreference = require('../../models/notification_preference.model');
const NotificationLog = require('../../models/notification_log.model');
const SystemAlert = require('../../models/system_alert.model');
const User = require('../../models/user.model');
const Seller = require('../../models/seller.model');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');
const notificationEngine = require('./notificationEngine');

class NotificationService {

    // ============ NOTIFICATION CENTER & ADMIN LIST ============
    async getAllNotificationsAdmin({
        page = 1,
        limit = 10,
        tab = 'all',
        search = null,
        category = null,
        type = null,
        audience = null,
        priority = null,
        channel = null,
        status = null,
        date_from = null,
        date_to = null,
        created_by = null,
        sort_by = 'created_at',
        sort_order = 'desc'
    } = {}) {
        const query = { is_deleted: false };

        // 1. Tab filtering
        if (tab === 'unread') {
            query.is_read = false;
        } else if (tab === 'scheduled') {
            query.status = 'scheduled';
        } else if (tab === 'sent') {
            query.status = { $in: ['sent', 'delivered', 'read', 'clicked'] };
        } else if (tab === 'draft') {
            query.status = 'draft';
        } else if (tab === 'failed') {
            query.status = { $in: ['failed', 'partially_failed'] };
        } else if (tab === 'archived') {
            query.status = 'archived';
        }

        // 2. Attribute filters
        if (category && category !== 'all') {
            query.category = category;
        }
        if (type && type !== 'all') {
            query.notification_type = type;
        }
        if (audience && audience !== 'all') {
            query.audience = audience;
        }
        if (priority && priority !== 'all') {
            query.priority = priority;
        }
        if (channel && channel !== 'all') {
            query.$or = [{ channels: channel }, { channel: channel }];
        }
        if (status && status !== 'all') {
            query.status = status;
        }
        if (created_by && created_by !== 'all') {
            query.sender_id = created_by;
        }

        // 3. Date range filter
        if (date_from || date_to) {
            query.created_at = {};
            if (date_from) {
                const start = new Date(date_from);
                start.setHours(0, 0, 0, 0);
                query.created_at.$gte = start;
            }
            if (date_to) {
                const end = new Date(date_to);
                end.setHours(23, 59, 59, 999);
                query.created_at.$lte = end;
            }
        }

        // 4. Search filter
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            const searchOr = [
                { title: regex },
                { message: regex },
                { notification_code: regex }
            ];
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchOr }];
                delete query.$or;
            } else {
                query.$or = searchOr;
            }
        }

        // 5. Sorting
        const sortOptions = {};
        sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;

        // 6. Execute Queries in parallel
        const [
            notifications,
            total,
            totalActive,
            sentCount,
            scheduledCount,
            failedCount,
            draftCount,
            criticalCount,
            unreadCount,
            archivedCount
        ] = await Promise.all([
            Notification.find(query)
                .populate('user_id', 'first_name last_name email user_type')
                .populate('sender_id', 'first_name last_name email')
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean(),
            Notification.countDocuments(query),
            // Overall KPI Stats
            Notification.countDocuments({ is_deleted: false }),
            Notification.countDocuments({ is_deleted: false, status: { $in: ['sent', 'delivered', 'read', 'clicked'] } }),
            Notification.countDocuments({ is_deleted: false, status: 'scheduled' }),
            Notification.countDocuments({ is_deleted: false, status: { $in: ['failed', 'partially_failed'] } }),
            Notification.countDocuments({ is_deleted: false, status: 'draft' }),
            Notification.countDocuments({ is_deleted: false, $or: [{ priority: 'critical' }, { category: 'SYSTEM_ALERT' }] }),
            Notification.countDocuments({ is_deleted: false, is_read: false }),
            Notification.countDocuments({ is_deleted: false, status: 'archived' })
        ]);

        return {
            notifications,
            stats: {
                total: totalActive,
                sent: sentCount,
                scheduled: scheduledCount,
                failed: failedCount,
                drafts: draftCount,
                criticalAlerts: criticalCount
            },
            tabCounts: {
                all: totalActive,
                unread: unreadCount,
                scheduled: scheduledCount,
                sent: sentCount,
                draft: draftCount,
                failed: failedCount,
                archived: archivedCount
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ============ NOTIFICATION DETAILS & TIMELINE ============
    async getNotificationByCode(notificationCode) {
        const notification = await Notification.findOne({
            notification_code: notificationCode,
            is_deleted: false
        })
            .populate('user_id', 'first_name last_name email user_type mobile')
            .populate('sender_id', 'first_name last_name email')
            .lean();

        if (!notification) {
            throw ApiError.notFound(`Notification not found with code: ${notificationCode}`);
        }

        // Fetch associated delivery logs for this notification or batch
        const logs = await NotificationLog.find({
            $or: [
                { notification_id: notification._id },
                { notification_code: notificationCode }
            ]
        })
            .sort({ created_at: -1 })
            .limit(100)
            .lean();

        // Calculate delivery metrics from logs & doc
        const sentLogs = logs.filter(l => ['sent', 'delivered', 'read', 'clicked'].includes(l.status)).length;
        const deliveredLogs = logs.filter(l => ['delivered', 'read', 'clicked'].includes(l.status)).length;
        const readLogs = logs.filter(l => ['read', 'clicked'].includes(l.status)).length;
        const clickedLogs = logs.filter(l => l.status === 'clicked').length;
        const failedLogs = logs.filter(l => l.status === 'failed').length;

        // Build activity timeline
        const timeline = [
            { step: 'Created', timestamp: notification.created_at, completed: true }
        ];

        if (notification.scheduled_for) {
            timeline.push({
                step: 'Scheduled',
                timestamp: notification.scheduled_for,
                completed: new Date() >= new Date(notification.scheduled_for) || ['sent', 'delivered'].includes(notification.status)
            });
        }

        if (notification.status === 'processing') {
            timeline.push({ step: 'Processing', timestamp: notification.updated_at, completed: true });
        }

        if (notification.sent_at) {
            timeline.push({ step: 'Sent', timestamp: notification.sent_at, completed: true });
        }

        if (notification.delivered_at || deliveredLogs > 0) {
            timeline.push({ step: 'Delivered', timestamp: notification.delivered_at || notification.sent_at, completed: true });
        }

        if (notification.read_at || readLogs > 0) {
            timeline.push({ step: 'Read', timestamp: notification.read_at, completed: true });
        }

        if (notification.clicked_at || clickedLogs > 0) {
            timeline.push({ step: 'Clicked', timestamp: notification.clicked_at, completed: true });
        }

        if (['failed', 'partially_failed'].includes(notification.status)) {
            timeline.push({ step: 'Failed', timestamp: notification.updated_at, completed: true, error: notification.error_message });
        }

        return {
            ...notification,
            deliveryMetrics: {
                totalRecipients: Math.max(logs.length, 1),
                sent: Math.max(sentLogs, notification.sent_at ? 1 : 0),
                delivered: Math.max(deliveredLogs, notification.delivered_at ? 1 : 0),
                read: Math.max(readLogs, notification.is_read ? 1 : 0),
                clicked: Math.max(clickedLogs, notification.is_clicked ? 1 : 0),
                failed: Math.max(failedLogs, notification.status === 'failed' ? 1 : 0)
            },
            timeline,
            deliveryLogs: logs
        };
    }

    // ============ BROADCAST CREATION & SCHEDULING ============
    async createBroadcast(data, adminId) {
        const notification_code = await notificationEngine.generateCode('NOT');
        const channels = Array.isArray(data.channels) && data.channels.length > 0
            ? data.channels.filter(c => ['in_app', 'push', 'email'].includes(c))
            : [data.channel || 'in_app'];

        const isScheduled = Boolean(data.schedule_type === 'scheduled' && data.scheduled_for);
        const isDraft = data.status === 'draft';

        let initialStatus = 'draft';
        if (isScheduled) {
            initialStatus = 'scheduled';
        } else if (!isDraft) {
            initialStatus = 'sent';
        }

        const notification = new Notification({
            notification_code,
            sender_id: adminId,
            title: data.title,
            message: data.message,
            category: data.category || 'PROMOTION',
            notification_type: data.notification_type || 'promotion',
            audience: data.audience || 'all_customers',
            target_role: data.target_role || null,
            receiver_type: data.receiver_type || 'all',
            channels: channels,
            channel: channels[0] || 'in_app',
            priority: data.priority || 'normal',
            action_url: data.action_url || null,
            action_label: data.action_label || 'View Details',
            template_code: data.template_code || null,
            scheduled_for: isScheduled ? new Date(data.scheduled_for) : null,
            status: initialStatus,
            is_broadcast: true,
            metadata: data.metadata || {}
        });

        // Set user_id if specific recipient was selected
        if (data.user_id) {
            const resolved = await notificationEngine.resolveUserId(data.user_id);
            if (resolved) notification.user_id = resolved._id;
        }

        await notification.save();

        // If immediate dispatch requested
        if (initialStatus === 'sent') {
            await notificationEngine.dispatchBroadcast(notification, adminId);
        }

        return notification;
    }

    // Update draft or scheduled broadcast
    async updateNotification(notificationCode, data, adminId) {
        const notification = await Notification.findOne({
            notification_code: notificationCode,
            is_deleted: false
        });

        if (!notification) {
            throw ApiError.notFound('Notification not found');
        }

        if (['sent', 'delivered', 'read'].includes(notification.status)) {
            // Cannot alter body of already dispatched notifications
            if (data.status === 'archived') {
                notification.status = 'archived';
                await notification.save();
                return notification;
            }
            throw ApiError.badRequest('Cannot edit already sent notification');
        }

        if (data.title) notification.title = data.title;
        if (data.message) notification.message = data.message;
        if (data.category) notification.category = data.category;
        if (data.notification_type) notification.notification_type = data.notification_type;
        if (data.audience) notification.audience = data.audience;
        if (data.priority) notification.priority = data.priority;
        if (data.channels) notification.channels = data.channels;
        if (data.channel) notification.channel = data.channel;
        if (data.action_url !== undefined) notification.action_url = data.action_url;
        if (data.action_label !== undefined) notification.action_label = data.action_label;
        if (data.metadata) notification.metadata = { ...(notification.metadata || {}), ...data.metadata };

        if (data.schedule_type === 'scheduled' && data.scheduled_for) {
            notification.scheduled_for = new Date(data.scheduled_for);
            notification.status = 'scheduled';
        } else if (data.status) {
            notification.status = data.status;
        }

        await notification.save();
        return notification;
    }

    // Cancel a scheduled broadcast
    async cancelBroadcast(notificationCode, adminId) {
        const notification = await Notification.findOne({
            notification_code: notificationCode,
            is_deleted: false
        });

        if (!notification) {
            throw ApiError.notFound('Notification not found');
        }

        if (notification.status !== 'scheduled' && notification.status !== 'draft') {
            throw ApiError.badRequest(`Cannot cancel notification with status: ${notification.status}`);
        }

        notification.status = 'cancelled';
        await notification.save();

        return { message: 'Scheduled broadcast cancelled successfully', notification };
    }

    // Send Now: immediately trigger draft or scheduled broadcast
    async sendNow(notificationCode, adminId) {
        const notification = await Notification.findOne({
            notification_code: notificationCode,
            is_deleted: false
        });

        if (!notification) {
            throw ApiError.notFound('Notification not found');
        }

        if (!['draft', 'scheduled'].includes(notification.status)) {
            throw ApiError.badRequest(`Cannot trigger immediate send for notification in status: ${notification.status}`);
        }

        notification.status = 'processing';
        notification.sent_at = new Date();
        await notification.save();

        const result = await notificationEngine.dispatchBroadcast(notification, adminId);
        return { message: 'Broadcast dispatched immediately', result, notification };
    }

    // Delete (Soft Delete)
    async deleteNotification(idOrCode, userId = null) {
        const query = { is_deleted: false };
        if (mongoose.Types.ObjectId.isValid(idOrCode)) {
            query.$or = [{ _id: idOrCode }, { notification_code: idOrCode }];
        } else {
            query.notification_code = idOrCode;
        }
        if (userId) {
            query.user_id = userId;
        }

        const notification = await Notification.findOne(query);

        if (!notification) {
            throw ApiError.notFound('Notification not found');
        }

        notification.is_deleted = true;
        notification.deleted_at = new Date();
        await notification.save();

        return { message: 'Notification deleted successfully' };
    }

    // Mark single as read
    async markNotificationAsRead(idOrCode, userId = null) {
        const query = { is_deleted: false };
        if (mongoose.Types.ObjectId.isValid(idOrCode)) {
            query.$or = [{ _id: idOrCode }, { notification_code: idOrCode }];
        } else {
            query.notification_code = idOrCode;
        }
        if (userId) {
            query.user_id = userId;
        }

        const notification = await Notification.findOne(query);

        if (!notification) {
            throw ApiError.notFound('Notification not found');
        }

        notification.is_read = true;
        notification.read_at = new Date();
        if (notification.status === 'sent' || notification.status === 'delivered') {
            notification.status = 'read';
        }
        await notification.save();

        // Update corresponding delivery logs
        await NotificationLog.updateMany(
            { notification_id: notification._id, status: { $ne: 'clicked' } },
            { $set: { status: 'read', read_at: new Date() } }
        );

        return notification;
    }

    // Mark all as read
    async markAllNotificationsAsRead(userId = null) {
        const filter = { is_deleted: false, is_read: false };
        if (userId) filter.user_id = userId;

        const result = await Notification.updateMany(
            filter,
            { $set: { is_read: true, read_at: new Date(), status: 'read' } }
        );

        return { message: 'All notifications marked as read', modifiedCount: result.modifiedCount };
    }

    // Track click on action link
    async trackClick(notificationCode, userId = null) {
        const query = { notification_code: notificationCode, is_deleted: false };
        if (userId) query.user_id = userId;

        const notification = await Notification.findOne(query);
        if (!notification) return null;

        notification.is_clicked = true;
        notification.clicked_at = new Date();
        notification.status = 'clicked';
        if (!notification.is_read) {
            notification.is_read = true;
            notification.read_at = new Date();
        }
        await notification.save();

        // Update log
        await NotificationLog.updateMany(
            { notification_id: notification._id },
            { $set: { status: 'clicked', clicked_at: new Date() } }
        );

        return notification;
    }

    // ============ NOTIFICATION ANALYTICS (REAL DATA) ============
    async getAnalytics({
        date_from = null,
        date_to = null,
        category = null,
        channel = null,
        audience = null,
        status = null,
        priority = null
    } = {}) {
        const matchQuery = { is_deleted: false };

        if (category && category !== 'all') matchQuery.category = category;
        if (audience && audience !== 'all') matchQuery.audience = audience;
        if (status && status !== 'all') matchQuery.status = status;
        if (priority && priority !== 'all') matchQuery.priority = priority;
        if (channel && channel !== 'all') {
            matchQuery.$or = [{ channels: channel }, { channel: channel }];
        }

        if (date_from || date_to) {
            matchQuery.created_at = {};
            if (date_from) {
                const s = new Date(date_from);
                s.setHours(0, 0, 0, 0);
                matchQuery.created_at.$gte = s;
            }
            if (date_to) {
                const e = new Date(date_to);
                e.setHours(23, 59, 59, 999);
                matchQuery.created_at.$lte = e;
            }
        }

        // Summary KPI Metrics
        const [
            totalSent,
            deliveredCount,
            readCount,
            unreadCount,
            clickedCount,
            failedCount
        ] = await Promise.all([
            Notification.countDocuments({ ...matchQuery, status: { $in: ['sent', 'delivered', 'read', 'clicked'] } }),
            Notification.countDocuments({ ...matchQuery, status: { $in: ['delivered', 'read', 'clicked'] } }),
            Notification.countDocuments({ ...matchQuery, is_read: true }),
            Notification.countDocuments({ ...matchQuery, is_read: false }),
            Notification.countDocuments({ ...matchQuery, is_clicked: true }),
            Notification.countDocuments({ ...matchQuery, status: { $in: ['failed', 'partially_failed'] } })
        ]);

        const deliveryRate = totalSent > 0 ? ((deliveredCount / totalSent) * 100).toFixed(1) : '100.0';
        const openRate = totalSent > 0 ? ((readCount / totalSent) * 100).toFixed(1) : '0.0';
        const clickRate = totalSent > 0 ? ((clickedCount / totalSent) * 100).toFixed(1) : '0.0';

        // 1. Delivery Trend over time (grouped by day)
        const deliveryTrend = await Notification.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                    total: { $sum: 1 },
                    sent: { $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered', 'read', 'clicked']] }, 1, 0] } },
                    read: { $sum: { $cond: ['$is_read', 1, 0] } },
                    clicked: { $sum: { $cond: ['$is_clicked', 1, 0] } },
                    failed: { $sum: { $cond: [{ $in: ['$status', ['failed', 'partially_failed']] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
        ]);

        // 2. Channel Performance from NotificationLog
        const channelPerformance = await NotificationLog.aggregate([
            {
                $group: {
                    _id: '$channel',
                    total: { $sum: 1 },
                    delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read', 'clicked']] }, 1, 0] } },
                    read: { $sum: { $cond: [{ $in: ['$status', ['read', 'clicked']] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
                }
            }
        ]);

        // 3. Audience Breakdown
        const audiencePerformance = await Notification.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$audience',
                    count: { $sum: 1 },
                    read: { $sum: { $cond: ['$is_read', 1, 0] } }
                }
            }
        ]);

        // 4. Category Breakdown
        const categoryPerformance = await Notification.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 5. Common Failure Reasons
        const failureReasons = await NotificationLog.aggregate([
            { $match: { status: 'failed', failure_reason: { $ne: null } } },
            {
                $group: {
                    _id: '$failure_reason',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return {
            summary: {
                totalSent,
                delivered: deliveredCount,
                read: readCount,
                unread: unreadCount,
                clicked: clickedCount,
                failed: failedCount,
                deliveryRate: Number(deliveryRate),
                openRate: Number(openRate),
                clickRate: Number(clickRate)
            },
            charts: {
                deliveryTrend,
                channelPerformance,
                audiencePerformance,
                categoryPerformance,
                failureReasons
            }
        };
    }

    // ============ DELIVERY LOGS ============
    async getDeliveryLogs({
        page = 1,
        limit = 20,
        channel = null,
        status = null,
        search = null,
        date_from = null,
        date_to = null
    } = {}) {
        const query = {};

        if (channel && channel !== 'all') query.channel = channel;
        if (status && status !== 'all') query.status = status;

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { notification_code: regex },
                { recipient_email: regex },
                { recipient_name: regex },
                { failure_reason: regex }
            ];
        }

        if (date_from || date_to) {
            query.created_at = {};
            if (date_from) {
                const s = new Date(date_from);
                s.setHours(0, 0, 0, 0);
                query.created_at.$gte = s;
            }
            if (date_to) {
                const e = new Date(date_to);
                e.setHours(23, 59, 59, 999);
                query.created_at.$lte = e;
            }
        }

        const [logs, total] = await Promise.all([
            NotificationLog.find(query)
                .populate('recipient_id', 'first_name last_name email user_type')
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean(),
            NotificationLog.countDocuments(query)
        ]);

        return {
            logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Retry a failed delivery log entry
    async retryDeliveryLog(logId) {
        const log = await NotificationLog.findById(logId);
        if (!log) {
            throw ApiError.notFound('Delivery log not found');
        }

        const notification = await Notification.findById(log.notification_id);
        if (!notification) {
            throw ApiError.notFound('Original notification record not found');
        }

        log.retry_count = (log.retry_count || 0) + 1;
        log.last_retry_at = new Date();

        if (log.channel === 'email') {
            const email = log.recipient_email;
            if (!email) {
                throw ApiError.badRequest('No email recipient available for retry');
            }

            const emailHelper = require('../../utils/emailHelper');
            const res = await emailHelper.sendEmail({
                to: email,
                subject: notification.title,
                text: notification.message,
                html: notificationEngine.generateStyledEmailHtml({
                    title: notification.title,
                    message: notification.message,
                    actionUrl: notification.action_url,
                    actionLabel: notification.action_label,
                    priority: notification.priority
                })
            });

            if (res.success) {
                log.status = 'sent';
                log.failure_reason = null;
                log.sent_at = new Date();
            } else {
                log.status = 'failed';
                log.failure_reason = res.error || 'Retry failed';
            }
        } else {
            log.status = 'delivered';
            log.failure_reason = null;
            log.delivered_at = new Date();
        }

        await log.save();
        return log;
    }

    // ============ TEMPLATES MANAGEMENT ============
    async getTemplates({ category = null, search = null } = {}) {
        const query = {};
        if (category && category !== 'all') query.category = category;
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { template_code: regex },
                { name: regex },
                { description: regex },
                { title_template: regex }
            ];
        }

        return await NotificationTemplate.find(query)
            .sort({ is_system: -1, created_at: -1 })
            .lean();
    }

    async getTemplateByCode(templateCode) {
        const template = await NotificationTemplate.findOne({ template_code: templateCode }).lean();
        if (!template) throw ApiError.notFound('Template not found');
        return template;
    }

    async createTemplate(data, adminId) {
        const existing = await NotificationTemplate.findOne({ template_code: data.template_code.toUpperCase() });
        if (existing) {
            throw ApiError.conflict('Template code already exists');
        }

        const template = new NotificationTemplate({
            ...data,
            template_code: data.template_code.toUpperCase().trim(),
            created_by: adminId,
            updated_by: adminId
        });

        await template.save();
        return template;
    }

    async updateTemplate(templateCode, data, adminId) {
        const template = await NotificationTemplate.findOne({ template_code: templateCode.toUpperCase() });
        if (!template) throw ApiError.notFound('Template not found');

        Object.assign(template, data);
        template.updated_by = adminId;
        await template.save();
        return template;
    }

    async deleteTemplate(templateCode) {
        const template = await NotificationTemplate.findOne({ template_code: templateCode.toUpperCase() });
        if (!template) throw ApiError.notFound('Template not found');
        if (template.is_system) {
            throw ApiError.badRequest('System default templates cannot be deleted');
        }

        await NotificationTemplate.deleteOne({ _id: template._id });
        return { message: 'Template deleted successfully' };
    }

    // ============ NOTIFICATION PREFERENCES ============
    async getPreferences(userId) {
        let pref = await NotificationPreference.findOne({ user_id: userId }).lean();
        if (!pref) {
            const user = await User.findById(userId).select('user_type preferences');
            if (!user) throw ApiError.notFound('User not found');

            pref = await NotificationPreference.create({
                user_id: userId,
                user_type: user.user_type || 'customer'
            });
        }
        return pref;
    }

    async updatePreferences(userId, updateData) {
        let pref = await NotificationPreference.findOne({ user_id: userId });
        if (!pref) {
            const user = await User.findById(userId).select('user_type');
            pref = new NotificationPreference({
                user_id: userId,
                user_type: user?.user_type || 'customer'
            });
        }

        if (updateData.preferences) {
            // Merge preferences but enforce account_security is always true
            pref.preferences = {
                ...pref.preferences,
                ...updateData.preferences,
                account_security: { in_app: true, push: true, email: true }
            };
        }

        if (updateData.master_channels) {
            pref.master_channels = {
                ...pref.master_channels,
                ...updateData.master_channels
            };
        }

        await pref.save();
        return pref;
    }

    // ============ SYSTEM ALERTS ============
    async getSystemAlerts({ page = 1, limit = 20, severity = null, status = null } = {}) {
        const query = {};
        if (severity && severity !== 'all') query.severity = severity;
        if (status && status !== 'all') query.status = status;

        const [alerts, total, activeCount, criticalCount] = await Promise.all([
            SystemAlert.find(query)
                .populate('acknowledged_by', 'first_name last_name email')
                .populate('resolved_by', 'first_name last_name email')
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean(),
            SystemAlert.countDocuments(query),
            SystemAlert.countDocuments({ status: 'active' }),
            SystemAlert.countDocuments({ status: 'active', severity: 'critical' })
        ]);

        return {
            alerts,
            stats: {
                total,
                active: activeCount,
                critical: criticalCount
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async acknowledgeAlert(alertCode, adminId) {
        const alert = await SystemAlert.findOne({ alert_code: alertCode });
        if (!alert) throw ApiError.notFound('System alert not found');

        alert.status = 'acknowledged';
        alert.acknowledged_by = adminId;
        alert.acknowledged_at = new Date();
        await alert.save();
        return alert;
    }

    async resolveAlert(alertCode, resolutionNotes, adminId) {
        const alert = await SystemAlert.findOne({ alert_code: alertCode });
        if (!alert) throw ApiError.notFound('System alert not found');

        alert.status = 'resolved';
        alert.resolved_by = adminId;
        alert.resolved_at = new Date();
        alert.resolution_notes = resolutionNotes || 'Resolved by admin';
        await alert.save();
        return alert;
    }

    // ============ USER-FACING NOTIFICATIONS ============
    async getNotifications({ userId, page = 1, limit = 10, type = null, isRead = null }) {
        const user = await User.findById(userId).select('user_type');
        const userType = user?.user_type || 'customer';

        const audienceMatches = ['all'];
        if (userType === 'customer') audienceMatches.push('all_customers');
        if (userType === 'seller') audienceMatches.push('all_sellers');

        const query = {
            $or: [
                { user_id: userId },
                {
                    user_id: null,
                    is_broadcast: true,
                    audience: { $in: audienceMatches },
                    status: { $in: ['sent', 'delivered'] }
                }
            ],
            is_deleted: false,
            status: { $in: ['sent', 'delivered', 'read', 'clicked'] }
        };

        if (type && type !== 'all') {
            query.$and = [
                {
                    $or: [
                        { notification_type: type },
                        { category: type.toUpperCase() }
                    ]
                }
            ];
        }

        if (isRead !== null && isRead !== undefined && isRead !== '') {
            query.is_read = isRead === 'true' || isRead === true;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ created_at: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({
                $or: [
                    { user_id: userId },
                    {
                        user_id: null,
                        is_broadcast: true,
                        audience: { $in: audienceMatches },
                        status: { $in: ['sent', 'delivered'] }
                    }
                ],
                is_deleted: false,
                is_read: false
            })
        ]);

        return {
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getUnreadNotifications({ userId, page = 1, limit = 10 }) {
        return this.getNotifications({ userId, page, limit, isRead: false });
    }

    async getUnreadCount(userId) {
        const user = await User.findById(userId).select('user_type');
        const userType = user?.user_type || 'customer';

        const audienceMatches = ['all'];
        if (userType === 'customer') audienceMatches.push('all_customers');
        if (userType === 'seller') audienceMatches.push('all_sellers');

        const count = await Notification.countDocuments({
            $or: [
                { user_id: userId },
                {
                    user_id: null,
                    is_broadcast: true,
                    audience: { $in: audienceMatches },
                    status: { $in: ['sent', 'delivered'] }
                }
            ],
            is_deleted: false,
            is_read: false,
            status: { $in: ['sent', 'delivered', 'read', 'clicked'] }
        });
        return { unreadCount: count };
    }
}

module.exports = new NotificationService();