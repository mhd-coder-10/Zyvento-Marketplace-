// Centralized Notification Engine
// Orchestrates: Event -> Audience -> Preferences -> Template Interpolation -> Multi-Channel Dispatch -> Delivery Tracking

const mongoose = require("mongoose");
const Notification = require("../../models/notification.model");
const NotificationTemplate = require("../../models/notification_template.model");
const NotificationPreference = require("../../models/notification_preference.model");
const NotificationLog = require("../../models/notification_log.model");
const SystemAlert = require("../../models/system_alert.model");
const User = require("../../models/user.model");
const Seller = require("../../models/seller.model");
const emailHelper = require("../../utils/emailHelper");
const logger = require("../../utils/logger");

class NotificationEngine {
    constructor() {
        this.schedulerInterval = null;
    }

    /**
     * Helper: Generate a unique notification code e.g. NOT-982341
     */
    async generateCode(prefix = "NOT") {
        const rand = Math.floor(100000 + Math.random() * 900000);
        return `${prefix}-${rand}`;
    }

    /**
     * Helper: Template interpolation (replaces {{variable_name}} with values)
     */
    interpolate(templateStr, data = {}) {
        if (!templateStr || typeof templateStr !== "string") return "";
        return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
            return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
        });
    }

    /**
     * Resolve a recipient: Ensures user_id is a valid User ObjectId
     * If passed a Seller ObjectId or Seller instance, finds seller.user_id
     */
    async resolveUserId(userOrSellerId) {
        if (!userOrSellerId) return null;

        try {
            // Check if it's already a User
            const user = await User.findById(userOrSellerId).select("_id email first_name last_name account_status user_type").lean();
            if (user) return user;

            // Otherwise, check if it's a Seller ID
            const seller = await Seller.findById(userOrSellerId).select("user_id business_name email").lean();
            if (seller && seller.user_id) {
                return await User.findById(seller.user_id).select("_id email first_name last_name account_status user_type").lean();
            }
        } catch (e) {
            logger.warn(`Could not resolve user from ${userOrSellerId}: ${e.message}`);
        }
        return null;
    }

    /**
     * Check user notification preferences for given category & channel
     */
    async isChannelPermitted(userId, category, channel, priority) {
        if (priority === "critical") return true;
        if (category === "ADMIN_SYSTEM" || category === "SYSTEM_ALERT") return true;

        try {
            let pref = await NotificationPreference.findOne({ user_id: userId });
            if (!pref) {
                // Default allows in-app and email for transactional, push if supported
                return true;
            }
            return pref.isChannelAllowed(category, channel, priority);
        } catch (e) {
            return true; // Default fallback: allow
        }
    }

    /**
     * MAIN DISPATCH METHOD FOR AUTOMATIC SYSTEM EVENTS
     * Triggered by Orders, Products, Payments, Reviews, Sellers, etc.
     */
    async sendEvent({
        event, // e.g. "ORDER_PLACED", "PRODUCT_APPROVED", "PAYMENT_FAILED"
        recipientId, // User ID or Seller ID
        category = "ORDER",
        notificationType,
        priority = "normal",
        referenceId = null,
        referenceModel = null,
        actionUrl = null,
        actionLabel = "View Details",
        variables = {},
        channels = ["in_app", "email"],
        customTitle = null,
        customMessage = null,
        metadata = {}
    }) {
        try {
            const resolvedUser = await this.resolveUserId(recipientId);
            if (!resolvedUser) {
                logger.warn(`NotificationEngine: Recipient could not be resolved for event ${event}`);
                return null;
            }

            // Fill recipient dynamic variables if missing
            if (!variables.customer_name && resolvedUser.first_name) {
                variables.customer_name = `${resolvedUser.first_name} ${resolvedUser.last_name || ""}`.trim();
            }
            if (!variables.seller_name && variables.business_name) {
                variables.seller_name = variables.business_name;
            }

            // Load template if available
            let title = customTitle;
            let message = customMessage;
            let emailSubject = null;
            let finalActionUrl = actionUrl;
            let finalActionLabel = actionLabel;
            let templateCode = null;

            const template = await NotificationTemplate.findOne({
                notification_type: notificationType || event.toLowerCase(),
                is_active: true
            }).lean();

            if (template) {
                templateCode = template.template_code;
                if (!title) title = this.interpolate(template.title_template, variables);
                if (!message) message = this.interpolate(template.body_template, variables);
                if (template.email_subject_template) {
                    emailSubject = this.interpolate(template.email_subject_template, variables);
                }
                if (template.action_url_template && !actionUrl) {
                    finalActionUrl = this.interpolate(template.action_url_template, variables);
                }
                if (template.action_label_template && !actionLabel) {
                    finalActionLabel = this.interpolate(template.action_label_template, variables);
                }
            }

            // Fallbacks if neither template nor custom text was supplied
            if (!title) title = `Notification: ${event.replace(/_/g, " ")}`;
            if (!message) message = `An update has occurred regarding your account (${event}).`;
            if (!emailSubject) emailSubject = title;

            // Generate unique notification code
            const notification_code = await this.generateCode("NOT");

            // Filter channels by user preferences
            const activeChannels = [];
            for (const ch of channels) {
                const allowed = await this.isChannelPermitted(resolvedUser._id, category, ch, priority);
                if (allowed) {
                    activeChannels.push(ch);
                }
            }

            // In-app is always enabled for audit & persistence
            if (!activeChannels.includes("in_app")) {
                activeChannels.push("in_app");
            }

            // Create main notification record
            const notification = new Notification({
                notification_code,
                user_id: resolvedUser._id,
                receiver_type: resolvedUser.user_type || "customer",
                title,
                message,
                category,
                notification_type: notificationType || event.toLowerCase(),
                reference_id: referenceId,
                reference_model: referenceModel,
                channels: activeChannels,
                channel: activeChannels[0] || "in_app",
                priority,
                status: "sent",
                sent_at: new Date(),
                action_url: finalActionUrl,
                action_label: finalActionLabel,
                template_code: templateCode,
                is_automatic: true,
                metadata: { ...metadata, variables }
            });

            await notification.save();

            // Create Delivery Logs and dispatch to each channel
            for (const ch of activeChannels) {
                let deliveryStatus = "sent";
                let failureReason = null;

                if (ch === "email") {
                    if (resolvedUser.email) {
                        try {
                            const emailResult = await emailHelper.sendEmail({
                                to: resolvedUser.email,
                                subject: emailSubject,
                                text: message,
                                html: this.generateStyledEmailHtml({
                                    title,
                                    message,
                                    actionUrl: finalActionUrl,
                                    actionLabel: finalActionLabel,
                                    priority
                                })
                            });

                            if (!emailResult.success) {
                                deliveryStatus = "failed";
                                failureReason = emailResult.error || "Email delivery failed";
                            }
                        } catch (err) {
                            deliveryStatus = "failed";
                            failureReason = err.message;
                        }
                    } else {
                        deliveryStatus = "failed";
                        failureReason = "Recipient has no email address configured";
                    }
                } else if (ch === "push") {
                    // Simulated Web Push dispatch (logs delivery for push subscription)
                    deliveryStatus = "delivered";
                } else if (ch === "in_app") {
                    deliveryStatus = "delivered";
                }

                // Log delivery lifecycle
                await NotificationLog.create({
                    notification_id: notification._id,
                    notification_code: notification.notification_code,
                    recipient_id: resolvedUser._id,
                    recipient_email: resolvedUser.email,
                    recipient_name: `${resolvedUser.first_name || ""} ${resolvedUser.last_name || ""}`.trim(),
                    channel: ch,
                    category,
                    notification_type: notification.notification_type,
                    priority,
                    status: deliveryStatus,
                    sent_at: new Date(),
                    delivered_at: deliveryStatus === "delivered" ? new Date() : null,
                    failure_reason: failureReason
                });
            }

            logger.info(`Notification [${notification_code}] dispatched to user ${resolvedUser._id} for event ${event}`);
            return notification;
        } catch (error) {
            logger.error(`NotificationEngine.sendEvent failed for event ${event}:`, error);
            return null;
        }
    }

    /**
     * Dispatch an Admin Broadcast to target audience
     */
    async dispatchBroadcast(broadcastDoc, adminId) {
        try {
            const audience = broadcastDoc.audience;
            let targetUsers = [];

            if (audience === "all_customers") {
                targetUsers = await User.find({ user_type: "customer", account_status: "active" }).select("_id email first_name last_name user_type").lean();
            } else if (audience === "all_sellers") {
                targetUsers = await User.find({ user_type: "seller", account_status: "active" }).select("_id email first_name last_name user_type").lean();
            } else if (audience === "all_admins") {
                targetUsers = await User.find({ user_type: { $in: ["super_admin", "sub_admin"] }, account_status: "active" }).select("_id email first_name last_name user_type").lean();
            } else if (audience === "specific_role" && broadcastDoc.target_role) {
                targetUsers = await User.find({ role_ids: broadcastDoc.target_role, account_status: "active" }).select("_id email first_name last_name user_type").lean();
            } else if (audience === "specific_customer" && broadcastDoc.user_id) {
                const u = await User.findById(broadcastDoc.user_id).select("_id email first_name last_name user_type").lean();
                if (u) targetUsers = [u];
            } else if (audience === "specific_seller" && broadcastDoc.user_id) {
                const resolved = await this.resolveUserId(broadcastDoc.user_id);
                if (resolved) targetUsers = [resolved];
            } else {
                // Default: all active users
                targetUsers = await User.find({ account_status: "active" }).select("_id email first_name last_name user_type").lean();
            }

            if (!targetUsers.length) {
                broadcastDoc.status = "sent";
                broadcastDoc.sent_at = new Date();
                await broadcastDoc.save();
                return { total: 0, sent: 0, failed: 0 };
            }

            broadcastDoc.status = "processing";
            await broadcastDoc.save();

            const channels = broadcastDoc.channels?.length ? broadcastDoc.channels : ["in_app"];
            let sentCount = 0;
            let failedCount = 0;

            for (const user of targetUsers) {
                try {
                    // Create recipient notification
                    const userNotif = new Notification({
                        notification_code: await this.generateCode("NOT"),
                        batch_id: broadcastDoc.notification_code,
                        user_id: user._id,
                        sender_id: adminId,
                        receiver_type: user.user_type || "customer",
                        audience: broadcastDoc.audience,
                        title: broadcastDoc.title,
                        message: broadcastDoc.message,
                        category: broadcastDoc.category || "PROMOTION",
                        notification_type: broadcastDoc.notification_type || "promotion",
                        channels: channels,
                        channel: channels[0],
                        priority: broadcastDoc.priority || "normal",
                        status: "sent",
                        sent_at: new Date(),
                        action_url: broadcastDoc.action_url,
                        action_label: broadcastDoc.action_label,
                        is_broadcast: true,
                        metadata: broadcastDoc.metadata || {}
                    });
                    await userNotif.save();

                    // Process each channel
                    for (const ch of channels) {
                        let status = "sent";
                        let failureReason = null;

                        if (ch === "email") {
                            if (user.email) {
                                try {
                                    const emailRes = await emailHelper.sendEmail({
                                        to: user.email,
                                        subject: broadcastDoc.title,
                                        text: broadcastDoc.message,
                                        html: this.generateStyledEmailHtml({
                                            title: broadcastDoc.title,
                                            message: broadcastDoc.message,
                                            actionUrl: broadcastDoc.action_url,
                                            actionLabel: broadcastDoc.action_label,
                                            priority: broadcastDoc.priority
                                        })
                                    });
                                    if (!emailRes.success) {
                                        status = "failed";
                                        failureReason = emailRes.error;
                                    }
                                } catch (err) {
                                    status = "failed";
                                    failureReason = err.message;
                                }
                            } else {
                                status = "failed";
                                failureReason = "User has no email";
                            }
                        } else if (ch === "push" || ch === "in_app") {
                            status = "delivered";
                        }

                        await NotificationLog.create({
                            notification_id: userNotif._id,
                            notification_code: userNotif.notification_code,
                            recipient_id: user._id,
                            recipient_email: user.email,
                            recipient_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                            channel: ch,
                            category: broadcastDoc.category,
                            notification_type: broadcastDoc.notification_type,
                            priority: broadcastDoc.priority,
                            status: status,
                            sent_at: new Date(),
                            delivered_at: status === "delivered" ? new Date() : null,
                            failure_reason: failureReason
                        });
                    }

                    sentCount++;
                } catch (err) {
                    failedCount++;
                    logger.error(`Failed to dispatch broadcast to user ${user._id}:`, err);
                }
            }

            broadcastDoc.status = failedCount > 0 && sentCount === 0 ? "failed" : failedCount > 0 ? "partially_failed" : "sent";
            broadcastDoc.sent_at = new Date();
            await broadcastDoc.save();

            return { total: targetUsers.length, sent: sentCount, failed: failedCount };
        } catch (error) {
            logger.error("dispatchBroadcast failed:", error);
            broadcastDoc.status = "failed";
            broadcastDoc.error_message = error.message;
            await broadcastDoc.save();
            throw error;
        }
    }

    /**
     * Process scheduled broadcasts whose scheduled_for <= now
     */
    async processScheduledBroadcasts() {
        try {
            const now = new Date();
            const scheduledList = await Notification.find({
                status: "scheduled",
                scheduled_for: { $lte: now },
                is_deleted: false
            }).limit(20);

            if (!scheduledList.length) return 0;

            logger.info(`NotificationEngine: Processing ${scheduledList.length} scheduled broadcasts...`);

            for (const item of scheduledList) {
                await this.dispatchBroadcast(item, item.sender_id);
            }

            return scheduledList.length;
        } catch (err) {
            logger.error("processScheduledBroadcasts error:", err);
            return 0;
        }
    }

    /**
     * Start background scheduler for scheduled notifications
     */
    startScheduler(intervalMs = 60000) {
        if (this.schedulerInterval) return;
        this.schedulerInterval = setInterval(() => {
            this.processScheduledBroadcasts();
        }, intervalMs);
        logger.info("NotificationEngine background scheduler started");
    }

    stopScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }

    /**
     * System Alerts: Automatically generate technical / business system alerts
     */
    async createSystemAlert({
        alertType,
        title,
        description,
        severity = "high",
        source = "backend",
        errorDetails = {}
    }) {
        try {
            const alertCode = await this.generateCode("ALT");

            const alert = new SystemAlert({
                alert_code: alertCode,
                title,
                description,
                severity,
                alert_type: alertType,
                source,
                error_details: errorDetails,
                status: "active"
            });

            await alert.save();

            // Find Super Admins to notify immediately
            const superAdmins = await User.find({
                user_type: "super_admin",
                account_status: "active"
            }).select("_id email first_name last_name");

            for (const admin of superAdmins) {
                await this.sendEvent({
                    event: "CRITICAL_SYSTEM_ALERT",
                    recipientId: admin._id,
                    category: "SYSTEM_ALERT",
                    notificationType: "critical_system_alert",
                    priority: severity === "critical" ? "critical" : "high",
                    referenceId: alert._id,
                    referenceModel: "SystemAlert",
                    actionUrl: "/admin/notifications/system-alerts",
                    actionLabel: "View Alert Center",
                    customTitle: `[SYSTEM ALERT] ${title}`,
                    customMessage: `${description} (Severity: ${severity.toUpperCase()}, Source: ${source})`,
                    channels: ["in_app", "email"]
                });
            }

            return alert;
        } catch (err) {
            logger.error("createSystemAlert failed:", err);
            return null;
        }
    }

    /**
     * Generate branded responsive HTML email template
     */
    generateStyledEmailHtml({ title, message, actionUrl, actionLabel, priority }) {
        const isCritical = priority === "critical";
        const accentColor = isCritical ? "#dc2626" : "#2563eb";

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 28px 36px; background-color: #0f172a; border-bottom: 3px solid ${accentColor};">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td>
                                                <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">ZYVENTO</span>
                                                <span style="font-size: 13px; color: #94a3b8; margin-left: 8px;">Marketplace</span>
                                            </td>
                                            ${isCritical ? '<td align="right"><span style="background-color: #ef4444; color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 12px; text-transform: uppercase;">Critical Alert</span></td>' : ""}
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style="padding: 36px 36px 28px 36px;">
                                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.4;">${title}</h1>
                                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6; white-space: pre-line;">${message}</p>
                                    ${
                                        actionUrl
                                            ? `
                                    <div style="margin: 32px 0 16px 0;">
                                        <a href="${actionUrl}" style="background-color: ${accentColor}; color: #ffffff; padding: 12px 28px; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; display: inline-block;">
                                            ${actionLabel || "View Details"}
                                        </a>
                                    </div>
                                    `
                                            : ""
                                    }
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 24px 36px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
                                    <p style="margin: 0 0 4px 0;">This is an automated system notification from Zyvento Marketplace.</p>
                                    <p style="margin: 0;">To update your notification preferences, visit your account settings.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;
    }
}

module.exports = new NotificationEngine();
