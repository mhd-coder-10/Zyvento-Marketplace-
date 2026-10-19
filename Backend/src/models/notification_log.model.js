// Notification Delivery Log schema - Tracks notification lifecycle per recipient & channel
// Lifecycle: Created -> Scheduled -> Processing -> Sent -> Delivered -> Read -> Clicked or Failed

const mongoose = require("mongoose");

const notification_log_schema = new mongoose.Schema(
    {
        notification_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Notification",
            required: true,
            index: true
        },

        notification_code: {
            type: String,
            index: true,
            trim: true
        },

        recipient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
            default: null
        },

        recipient_email: {
            type: String,
            trim: true,
            default: null
        },

        recipient_name: {
            type: String,
            trim: true,
            default: null
        },

        channel: {
            type: String,
            enum: ["in_app", "push", "email"],
            required: true,
            index: true
        },

        category: {
            type: String,
            index: true
        },

        notification_type: {
            type: String,
            index: true
        },

        priority: {
            type: String,
            enum: ["critical", "high", "normal", "low", "medium"],
            default: "normal"
        },

        status: {
            type: String,
            enum: ["pending", "processing", "sent", "delivered", "read", "clicked", "failed"],
            default: "pending",
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

        read_at: {
            type: Date,
            default: null
        },

        clicked_at: {
            type: Date,
            default: null
        },

        failure_reason: {
            type: String,
            default: null
        },

        retry_count: {
            type: Number,
            default: 0
        },

        last_retry_at: {
            type: Date,
            default: null
        },

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

notification_log_schema.index({ notification_id: 1, channel: 1, recipient_id: 1 });
notification_log_schema.index({ status: 1, created_at: -1 });
notification_log_schema.index({ channel: 1, status: 1 });
notification_log_schema.index({ created_at: -1 });

module.exports = mongoose.model("NotificationLog", notification_log_schema);
