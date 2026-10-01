// Coupon schema - Discount coupons for orders
// Supports percentage/fixed discount, usage limits, expiry


const mongoose = require("mongoose");

const coupon_schema = new mongoose.Schema(
    {
        // ============ COUPON DETAILS ============
        coupon_code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        }, // For URL (e.g., SUMMER20)
        description: {
            type: String,
            trim: true
        },

        // ============ DISCOUNT DETAILS ============
        discount_type: {
            type: String,
            enum: ["percentage", "fixed", "fixed_amount"],
            required: true
        },
        discount_value: {
            type: Number,
            required: true,
            min: 0
        },
        minimum_order_amount: {
            type: Number,
            default: 0,
            min: 0
        },
        maximum_discount: {
            type: Number,
            default: null
        },

        // ============ VALIDITY ============
        start_date: {
            type: Date,
            required: true
        },
        expiry_date: {
            type: Date,
            required: true
        },

        // ============ USAGE LIMITS ============
        usage_limit: {
            type: Number,
            default: null
        },
        per_user_limit: {
            type: Number,
            default: 1
        },
        used_count: {
            type: Number,
            default: 0
        },

        // ============ APPLICABILITY ============
        applicable_to: {
            type: String,
            enum: ["all_products", "specific_categories", "specific_products", "specific_sellers"],
            default: "all_products"
        },
        applicable_categories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        }],
        applicable_products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }],
        applicable_sellers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller"
        }],

        // ============ STATUS ============
        status: {
            type: String,
            enum: ["active", "expired", "disabled", "pending"],
            default: "active"
        },

        // ============ AUDIT ============
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        updated_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // ============ USAGE HISTORY ============
        usage_history: [{
            user_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            order_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order"
            },
            used_at: {
                type: Date,
                default: Date.now
            },
            discount_applied: Number
        }]
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        },
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

coupon_schema.pre('validate', function() {
    if (!this.coupon_code && this.get('code')) {
        this.coupon_code = this.get('code');
    }
});

// Virtual aliases
coupon_schema.virtual('code')
    .get(function() { return this.coupon_code; })
    .set(function(v) { this.coupon_code = v; });

coupon_schema.virtual('discountType')
    .get(function() { return this.discount_type; })
    .set(function(v) { this.discount_type = v; });

coupon_schema.virtual('discountValue')
    .get(function() { return this.discount_value; })
    .set(function(v) { this.discount_value = v; });

coupon_schema.virtual('minOrderAmount')
    .get(function() { return this.minimum_order_amount; })
    .set(function(v) { this.minimum_order_amount = v; });

coupon_schema.virtual('maxDiscountAmount')
    .get(function() { return this.maximum_discount; })
    .set(function(v) { this.maximum_discount = v; });

coupon_schema.virtual('startDate')
    .get(function() { return this.start_date; })
    .set(function(v) { this.start_date = v; });

coupon_schema.virtual('expiryDate')
    .get(function() { return this.expiry_date; })
    .set(function(v) { this.expiry_date = v; });

coupon_schema.virtual('usageLimit')
    .get(function() { return this.usage_limit; })
    .set(function(v) { this.usage_limit = v; });

coupon_schema.virtual('perUserLimit')
    .get(function() { return this.per_user_limit; })
    .set(function(v) { this.per_user_limit = v; });

coupon_schema.virtual('usedCount')
    .get(function() { return this.used_count; })
    .set(function(v) { this.used_count = v; });

// ============ INDEXES ============
coupon_schema.index({ status: 1 });
coupon_schema.index({ expiry_date: 1 });

module.exports = mongoose.model("Coupon", coupon_schema);