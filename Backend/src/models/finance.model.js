// Finance schema - Manages enterprise company income and expenses
// Amazon-Grade General Ledger with multi-stream tracking, tax reconciliation, and audit log
const mongoose = require("mongoose");

const finance_schema = new mongoose.Schema(
    {
        entry_code: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        }, // e.g. FIN-202609-123456

        entry_type: {
            type: String,
            enum: ["income", "expense"],
            required: true,
            index: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        net_amount: {
            type: Number,
            default: function () {
                return typeof this.amount === 'number' ? (this.amount - (this.tax_amount || 0)) : 0;
            }
        },

        tax_rate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        tax_amount: {
            type: Number,
            default: 0,
            min: 0
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        party_name: {
            type: String,
            default: "",
            trim: true
        },

        payment_method: {
            type: String,
            enum: [
                "bank_transfer",
                "upi",
                "credit_card",
                "gateway",
                "cash",
                "escrow",
                "other"
            ],
            default: "bank_transfer"
        },

        payment_reference: {
            type: String,
            default: "",
            trim: true
        }, // UTR / Transaction / Cheque ID

        status: {
            type: String,
            enum: ["completed", "pending", "reconciled", "cancelled"],
            default: "completed",
            index: true
        },

        description: {
            type: String,
            default: "",
            trim: true
        },

        notes: {
            type: String,
            default: "",
            trim: true
        },

        entry_date: {
            type: Date,
            default: Date.now,
            index: true
        },

        // Link to other modules
        reference_type: {
            type: String,
            enum: ["order", "payment", "transaction", "seller_payout", "manual"],
            default: "manual"
        },

        reference_id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        reference_code: {
            type: String,
            default: ""
        },

        // Audit fields
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        updated_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        deleted_at: {
            type: Date,
            default: null,
            index: true
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

finance_schema.index({ entry_type: 1, entry_date: -1 });
finance_schema.index({ status: 1, entry_date: -1 });
finance_schema.index({ category: 1 });

module.exports = mongoose.model("Finance", finance_schema);