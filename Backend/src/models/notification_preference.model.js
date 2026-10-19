// Notification Preferences schema - Controls user notification channels per category
// Rule: Critical/security/system-required notifications MUST NOT be disabled

const mongoose = require("mongoose");

const notification_preference_schema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        user_type: {
            type: String,
            enum: ["customer", "seller", "admin", "sub_admin", "super_admin"],
            default: "customer"
        },

        // Category-level channel preferences
        preferences: {
            // Customer & Seller common
            orders: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true }
            },
            promotions: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: false },
                email: { type: Boolean, default: false }
            },
            refunds: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true }
            },
            // Seller specific
            inventory: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true }
            },
            product_approvals: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true }
            },
            payments: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true }
            },
            seller_requests: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true }
            },
            // Account security (System required — always forced to true)
            account_security: {
                in_app: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true }
            }
        },

        // Global master toggles (non-critical only)
        master_channels: {
            in_app: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            email: { type: Boolean, default: true }
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

/**
 * Checks whether a notification can be sent through a specific channel for this user
 * Ensures critical & security alerts bypass any user opt-outs!
 */
notification_preference_schema.methods.isChannelAllowed = function (category, channel, priority) {
    // 1. Critical notifications are ALWAYS allowed through all requested channels
    if (priority === "critical") {
        return true;
    }

    // 2. System and security categories are mandatory
    if (category === "ADMIN_SYSTEM" || category === "SYSTEM_ALERT" || category === "account_security") {
        return true;
    }

    // 3. In-App is always allowed unless specifically turned off
    if (channel === "in_app") {
        return true;
    }

    // 4. Map high-level category to preference key
    const categoryMap = {
        ORDER: "orders",
        PRODUCT: "product_approvals",
        SELLER: "seller_requests",
        CUSTOMER: "orders",
        FINANCE: "payments",
        PROMOTION: "promotions"
    };

    const key = categoryMap[category] || "orders";
    const categoryPref = this.preferences?.[key];

    if (!categoryPref) return true;

    // Check specific channel setting
    return categoryPref[channel] !== false;
};

module.exports = mongoose.model("NotificationPreference", notification_preference_schema);
