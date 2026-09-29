const mongoose = require("mongoose");

const seller_request_schema = new mongoose.Schema(
    {
        request_code: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        seller_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
            index: true
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
            index: true
        },
        request_type: {
            type: String,
            enum: [
                "product_status_change",
                "product_approval",
                "account_support",
                "inventory_query",
                "category_request",
                "other"
            ],
            default: "product_status_change",
            required: true
        },
        requested_status: {
            type: String,
            enum: ["active", "inactive", "suspended", "approved", "none"],
            default: "none"
        },
        reason: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["pending", "read", "in_progress", "solved"],
            default: "pending",
            index: true
        },
        admin_response: {
            type: String,
            default: null,
            trim: true
        },
        responded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        responded_at: {
            type: Date,
            default: null
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
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

seller_request_schema.index({ status: 1, created_at: -1 });
seller_request_schema.index({ seller_id: 1, created_at: -1 });

module.exports = mongoose.model("SellerRequest", seller_request_schema);
