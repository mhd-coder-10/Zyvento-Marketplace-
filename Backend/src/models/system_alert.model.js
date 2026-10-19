// System Alert schema - Tracks automatically generated technical and business alerts
// Independent of manual admin creation; triggered by backend events & health monitors

const mongoose = require("mongoose");

const system_alert_schema = new mongoose.Schema(
    {
        alert_code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        }, // e.g. ALT-982341

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        severity: {
            type: String,
            enum: ["critical", "high", "medium", "low"],
            default: "high",
            index: true
        },

        alert_type: {
            type: String,
            enum: [
                "payment_gateway_failure",
                "email_service_failure",
                "database_service_error",
                "high_payment_failure_rate",
                "cloudinary_upload_failure",
                "critical_system_maintenance",
                "suspicious_activity",
                "system_error",
                "order_fulfillment_delayed"
            ],
            required: true,
            index: true
        },

        status: {
            type: String,
            enum: ["active", "acknowledged", "resolved"],
            default: "active",
            index: true
        },

        source: {
            type: String,
            default: "system",
            trim: true
        }, // e.g. "payment.service", "emailHelper", "auth.controller"

        error_details: {
            type: Object,
            default: {}
        },

        acknowledged_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        acknowledged_at: {
            type: Date,
            default: null
        },

        resolved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        resolved_at: {
            type: Date,
            default: null
        },

        resolution_notes: {
            type: String,
            default: null,
            trim: true
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

system_alert_schema.index({ severity: 1, status: 1 });
system_alert_schema.index({ created_at: -1 });

module.exports = mongoose.model("SystemAlert", system_alert_schema);
