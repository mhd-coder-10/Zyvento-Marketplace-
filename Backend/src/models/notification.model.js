// Notification schema - User and marketplace-wide notifications
// Supports in-app, push, and email notifications with delivery tracking and soft delete
// Categories: ORDER, PRODUCT, SELLER, CUSTOMER, FINANCE, ADMIN_SYSTEM, PROMOTION, SYSTEM_ALERT
// Related to: user.model.js, notification_log.model.js

const mongoose = require("mongoose");

const notification_schema = new mongoose.Schema(
    {
        // ============ IDENTIFIERS ============
        notification_code: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
            trim: true
        }, // e.g., NOT-123456

        batch_id: {
            type: String,
            sparse: true,
            index: true
        },

        // ============ RELATIONSHIPS ============
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },

        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // ============ AUDIENCE & RECEIVER ============
        receiver_type: {
            type: String,
            enum: ["customer", "seller", "admin", "sub_admin", "super_admin", "all"],
            default: "customer",
            index: true
        },

        audience: {
            type: String,
            enum: [
                "all_customers",
                "all_sellers",
                "seller_employees",
                "all_admins",
                "specific_role",
                "specific_seller",
                "specific_customer",
                "specific_users",
                "individual"
            ],
            default: "individual",
            index: true
        },

        target_role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            default: null
        },

        // ============ NOTIFICATION DETAILS ============
        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        // ============ CATEGORY & TYPE ============
        category: {
            type: String,
            enum: [
                "ORDER",
                "PRODUCT",
                "SELLER",
                "CUSTOMER",
                "FINANCE",
                "ADMIN_SYSTEM",
                "PROMOTION",
                "SYSTEM_ALERT"
            ],
            default: "ORDER",
            index: true
        },

        notification_type: {
            type: String,
            required: true,
            trim: true
        },

        // ============ REFERENCE ============
        reference_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        reference_model: {
            type: String,
            enum: [
                "Order", "OrderItem", "Payment", "Product", "Inventory",
                "Return", "Refund", "Seller", "Coupon", "Role", "Permission",
                "SellerRequest", "CustomerComplaint", "SystemAlert", "Review"
            ],
            default: null
        },

        // ============ CHANNELS ============
        channels: {
            type: [String],
            enum: ["in_app", "push", "email"],
            default: ["in_app"]
        },

        channel: {
            type: String,
            default: "in_app" // Kept for backward compatibility
        },

        // ============ PRIORITY ============
        priority: {
            type: String,
            enum: ["critical", "high", "normal", "low", "medium"],
            default: "normal"
        },

        // ============ STATUS & LIFECYCLE ============
        status: {
            type: String,
            enum: [
                "draft",
                "scheduled",
                "processing",
                "pending",
                "sent",
                "delivered",
                "read",
                "clicked",
                "partially_failed",
                "failed",
                "cancelled",
                "archived"
            ],
            default: "sent"
        },

        scheduled_for: {
            type: Date,
            default: null,
            index: true
        },

        sent_at: {
            type: Date,
            default: null
        },

        delivered_at: {
            type: Date,
            default: null
        },

        is_read: {
            type: Boolean,
            default: false,
            index: true
        },

        read_at: {
            type: Date,
            default: null
        },

        is_clicked: {
            type: Boolean,
            default: false
        },

        clicked_at: {
            type: Date,
            default: null
        },

        retry_count: {
            type: Number,
            default: 0
        },

        error_message: {
            type: String,
            default: null
        },

        // ============ ACTIONS & DEEP LINK ============
        action_url: {
            type: String,
            trim: true,
            default: null
        },

        action_label: {
            type: String,
            trim: true,
            default: null
        },

        // ============ TEMPLATE & SYSTEM FLAGS ============
        template_code: {
            type: String,
            default: null,
            trim: true
        },

        is_broadcast: {
            type: Boolean,
            default: false,
            index: true
        },

        is_automatic: {
            type: Boolean,
            default: false,
            index: true
        },

        is_system_alert: {
            type: Boolean,
            default: false,
            index: true
        },

        alert_severity: {
            type: String,
            enum: ["critical", "high", "medium", "low", null],
            default: null
        },

        // ============ SOFT DELETE ============
        is_deleted: {
            type: Boolean,
            default: false,
            index: true
        },

        deleted_at: {
            type: Date,
            default: null
        },

        // ============ METADATA ============
        metadata: {
            type: Object,
            default: {}
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

// ============ INDEXES ============
notification_schema.index({ user_id: 1, is_read: 1, is_deleted: 1 });
notification_schema.index({ user_id: 1, created_at: -1 });
notification_schema.index({ category: 1, created_at: -1 });
notification_schema.index({ notification_type: 1 });
notification_schema.index({ status: 1 });
notification_schema.index({ priority: 1 });
notification_schema.index({ scheduled_for: 1, status: 1 });
notification_schema.index({ is_deleted: 1, created_at: -1 });
notification_schema.index({ is_broadcast: 1, created_at: -1 });

module.exports = mongoose.model("Notification", notification_schema);