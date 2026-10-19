// Notification Template schema - Reusable templates with dynamic variable interpolation
// Reusable across In-App, Push, and Email channels without duplicating business logic

const mongoose = require("mongoose");

const notification_template_schema = new mongoose.Schema(
    {
        template_code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        }, // e.g. TMPL_ORDER_PLACED, TMPL_PRODUCT_APPROVED

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: "",
            trim: true
        },

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
            required: true,
            index: true
        },

        notification_type: {
            type: String,
            required: true,
            trim: true
        },

        title_template: {
            type: String,
            required: true,
            trim: true
        }, // Supports {{customer_name}}, {{order_id}}, etc.

        body_template: {
            type: String,
            required: true,
            trim: true
        }, // Supports {{customer_name}}, {{product_name}}, etc.

        email_subject_template: {
            type: String,
            default: "",
            trim: true
        },

        action_url_template: {
            type: String,
            default: "",
            trim: true
        },

        action_label_template: {
            type: String,
            default: "View Details",
            trim: true
        },

        channels: {
            type: [String],
            enum: ["in_app", "push", "email"],
            default: ["in_app", "email"]
        },

        default_priority: {
            type: String,
            enum: ["critical", "high", "normal", "low"],
            default: "normal"
        },

        // Recognized variable keys for this template, e.g. ["customer_name", "order_id", "amount"]
        variables: {
            type: [String],
            default: []
        },

        is_system: {
            type: Boolean,
            default: false
        },

        is_active: {
            type: Boolean,
            default: true
        },

        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        updated_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

notification_template_schema.index({ category: 1, notification_type: 1 });
notification_template_schema.index({ is_active: 1 });

module.exports = mongoose.model("NotificationTemplate", notification_template_schema);
