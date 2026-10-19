// Default Notification Templates Seed Definitions
// Contains standard marketplace notification templates with dynamic variables

const NotificationTemplate = require("../../models/notification_template.model");
const logger = require("../../utils/logger");

const DEFAULT_TEMPLATES = [
    // ORDER CATEGORY
    {
        template_code: "TMPL_ORDER_PLACED",
        name: "Order Placed Notification",
        description: "Sent to customer upon successful order placement",
        category: "ORDER",
        notification_type: "order_placed",
        title_template: "Order Placed Successfully - #{{order_id}}",
        body_template: "Hi {{customer_name}}, your order #{{order_id}} for ₹{{amount}} has been placed and is being processed.",
        email_subject_template: "Your Zyvento Order #{{order_id}} Confirmation",
        action_url_template: "/orders/{{order_id}}",
        action_label_template: "Track Your Order",
        channels: ["in_app", "email", "push"],
        default_priority: "high",
        variables: ["customer_name", "order_id", "amount"],
        is_system: true
    },
    {
        template_code: "TMPL_ORDER_NEW_SELLER",
        name: "New Seller Order Alert",
        description: "Sent to seller when an item from their store is ordered",
        category: "ORDER",
        notification_type: "new_order_seller",
        title_template: "New Order Received - #{{order_id}}",
        body_template: "Hi {{seller_name}}, you received a new order #{{order_id}} for {{product_name}} (Qty: {{quantity}}) from {{customer_name}}.",
        email_subject_template: "New Order Received: #{{order_id}}",
        action_url_template: "/seller/orders/{{order_id}}",
        action_label_template: "Process Order",
        channels: ["in_app", "email", "push"],
        default_priority: "high",
        variables: ["seller_name", "order_id", "product_name", "quantity", "customer_name"],
        is_system: true
    },
    {
        template_code: "TMPL_ORDER_CONFIRMED",
        name: "Order Confirmed Notification",
        description: "Sent to customer when seller confirms order",
        category: "ORDER",
        notification_type: "order_confirmed",
        title_template: "Order Confirmed - #{{order_id}}",
        body_template: "Hi {{customer_name}}, your order #{{order_id}} has been confirmed by the seller.",
        email_subject_template: "Order #{{order_id}} Confirmed",
        action_url_template: "/orders/{{order_id}}",
        channels: ["in_app", "email"],
        default_priority: "normal",
        variables: ["customer_name", "order_id"],
        is_system: true
    },
    {
        template_code: "TMPL_ORDER_PACKED",
        name: "Order Packed Notification",
        description: "Sent to customer when order is packed",
        category: "ORDER",
        notification_type: "order_packed",
        title_template: "Order Packed - #{{order_id}}",
        body_template: "Hi {{customer_name}}, your order #{{order_id}} has been packed and is ready for pickup.",
        email_subject_template: "Order #{{order_id}} is Packed",
        action_url_template: "/orders/{{order_id}}",
        channels: ["in_app", "email"],
        default_priority: "normal",
        variables: ["customer_name", "order_id"],
        is_system: true
    },
    {
        template_code: "TMPL_ORDER_SHIPPED",
        name: "Order Shipped Notification",
        description: "Sent to customer when courier dispatches order",
        category: "ORDER",
        notification_type: "order_shipped",
        title_template: "Order Shipped - #{{order_id}}",
        body_template: "Hi {{customer_name}}, your order #{{order_id}} has been shipped via tracking ID: {{tracking_id}}.",
        email_subject_template: "Your Order #{{order_id}} Has Shipped!",
        action_url_template: "/order-tracking?tracking={{tracking_id}}",
        action_label_template: "Track Shipment",
        channels: ["in_app", "email", "push"],
        default_priority: "high",
        variables: ["customer_name", "order_id", "tracking_id"],
        is_system: true
    },
    {
        template_code: "TMPL_ORDER_OUT_FOR_DELIVERY",
        name: "Out For Delivery Notification",
        description: "Sent to customer on delivery day",
        category: "ORDER",
        notification_type: "out_for_delivery",
        title_template: "Out for Delivery - #{{order_id}}",
        body_template: "Hi {{customer_name}}, your package for order #{{order_id}} is out for delivery today!",
        email_subject_template: "Out for Delivery Today: Order #{{order_id}}",
        action_url_template: "/orders/{{order_id}}",
        channels: ["in_app", "push", "email"],
        default_priority: "high",
        variables: ["customer_name", "order_id"],
        is_system: true
    },
    {
        template_code: "TMPL_ORDER_DELIVERED",
        name: "Order Delivered Notification",
        description: "Sent to customer upon successful package delivery",
        category: "ORDER",
        notification_type: "order_delivered",
        title_template: "Order Delivered - #{{order_id}}",
        body_template: "Hi {{customer_name}}, your order #{{order_id}} has been delivered. Thank you for shopping with Zyvento!",
        email_subject_template: "Delivered: Order #{{order_id}}",
        action_url_template: "/orders/{{order_id}}",
        action_label_template: "Rate & Review Products",
        channels: ["in_app", "email"],
        default_priority: "normal",
        variables: ["customer_name", "order_id"],
        is_system: true
    },
    {
        template_code: "TMPL_ORDER_CANCELLED",
        name: "Order Cancelled Notification",
        description: "Sent to customer and seller when order is cancelled",
        category: "ORDER",
        notification_type: "order_cancelled",
        title_template: "Order Cancelled - #{{order_id}}",
        body_template: "Order #{{order_id}} has been cancelled. If any payment was made, refund processing will begin immediately.",
        email_subject_template: "Order #{{order_id}} Cancellation Notice",
        action_url_template: "/orders/{{order_id}}",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["customer_name", "order_id"],
        is_system: true
    },

    // PAYMENT & REFUND CATEGORY
    {
        template_code: "TMPL_PAYMENT_SUCCESSFUL",
        name: "Payment Successful Notification",
        description: "Sent when customer payment is verified",
        category: "FINANCE",
        notification_type: "payment_successful",
        title_template: "Payment Received - ₹{{amount}}",
        body_template: "Your payment of ₹{{amount}} for order #{{order_id}} has been successfully processed.",
        email_subject_template: "Payment Receipt for Order #{{order_id}}",
        action_url_template: "/orders/{{order_id}}",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["customer_name", "amount", "order_id"],
        is_system: true
    },
    {
        template_code: "TMPL_PAYMENT_FAILED",
        name: "Payment Failed Alert",
        description: "Sent to customer and admin when transaction fails",
        category: "FINANCE",
        notification_type: "payment_failed",
        title_template: "Payment Failed for Order #{{order_id}}",
        body_template: "Hi {{customer_name}}, payment of ₹{{amount}} for order #{{order_id}} failed. Please retry to secure your items.",
        email_subject_template: "Payment Alert: Order #{{order_id}}",
        action_url_template: "/checkout?order={{order_id}}",
        action_label_template: "Retry Payment",
        channels: ["in_app", "email", "push"],
        default_priority: "critical",
        variables: ["customer_name", "amount", "order_id"],
        is_system: true
    },
    {
        template_code: "TMPL_REFUND_COMPLETED",
        name: "Refund Completed Notification",
        description: "Sent to customer when refund is credited",
        category: "FINANCE",
        notification_type: "refund_completed",
        title_template: "Refund Processed - ₹{{amount}}",
        body_template: "Hi {{customer_name}}, refund of ₹{{amount}} for order #{{order_id}} has been successfully issued to your source account.",
        email_subject_template: "Refund Credit Notice: Order #{{order_id}}",
        action_url_template: "/orders/{{order_id}}",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["customer_name", "amount", "order_id"],
        is_system: true
    },

    // PRODUCT CATEGORY
    {
        template_code: "TMPL_PRODUCT_APPROVAL_PENDING",
        name: "Product Approval Pending Alert",
        description: "Sent to admin team when seller submits product for approval",
        category: "PRODUCT",
        notification_type: "product_approval_pending",
        title_template: "Product Review Required: {{product_name}}",
        body_template: "Seller {{seller_name}} submitted new product '{{product_name}}' for marketplace catalog approval.",
        email_subject_template: "Pending Product Approval: {{product_name}}",
        action_url_template: "/admin/products",
        action_label_template: "Review Product",
        channels: ["in_app", "email"],
        default_priority: "normal",
        variables: ["product_name", "seller_name"],
        is_system: true
    },
    {
        template_code: "TMPL_PRODUCT_APPROVED",
        name: "Product Approved Notification",
        description: "Sent to seller when product is approved by admin",
        category: "PRODUCT",
        notification_type: "product_approved",
        title_template: "Product Approved: {{product_name}}",
        body_template: "Great news {{seller_name}}! Your product '{{product_name}}' has been approved and is now active in the catalog.",
        email_subject_template: "Product Approved: {{product_name}}",
        action_url_template: "/seller/products",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["seller_name", "product_name"],
        is_system: true
    },
    {
        template_code: "TMPL_PRODUCT_REJECTED",
        name: "Product Rejected Notification",
        description: "Sent to seller with rejection reasoning",
        category: "PRODUCT",
        notification_type: "product_rejected",
        title_template: "Product Rejected: {{product_name}}",
        body_template: "Hi {{seller_name}}, your product '{{product_name}}' could not be approved. Reason: {{rejection_reason}}.",
        email_subject_template: "Product Update: {{product_name}} Review Status",
        action_url_template: "/seller/products",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["seller_name", "product_name", "rejection_reason"],
        is_system: true
    },
    {
        template_code: "TMPL_PRODUCT_LOW_STOCK",
        name: "Low Stock Inventory Warning",
        description: "Sent to seller when item stock falls below threshold",
        category: "PRODUCT",
        notification_type: "low_stock",
        title_template: "Low Stock Warning: {{product_name}}",
        body_template: "Warning {{seller_name}}, inventory for '{{product_name}}' is down to {{remaining_stock}} units. Please restock soon.",
        email_subject_template: "Inventory Alert: Low Stock on {{product_name}}",
        action_url_template: "/seller/inventory",
        action_label_template: "Update Stock",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["seller_name", "product_name", "remaining_stock"],
        is_system: true
    },

    // SELLER CATEGORY
    {
        template_code: "TMPL_SELLER_REGISTRATION",
        name: "New Seller Registration Alert",
        description: "Sent to admin team when new seller registers",
        category: "SELLER",
        notification_type: "seller_registration",
        title_template: "New Seller Registered: {{seller_name}}",
        body_template: "New seller {{seller_name}} ({{business_name}}) has registered and submitted credentials for verification.",
        email_subject_template: "New Seller Application: {{seller_name}}",
        action_url_template: "/admin/sellers",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["seller_name", "business_name"],
        is_system: true
    },
    {
        template_code: "TMPL_SELLER_APPROVED",
        name: "Seller Account Approved",
        description: "Sent to seller when their account is verified",
        category: "SELLER",
        notification_type: "seller_verification",
        title_template: "Seller Account Verified & Approved! 🎉",
        body_template: "Dear {{seller_name}}, your seller profile for {{business_name}} has been verified. You can now start listing your catalog.",
        email_subject_template: "Welcome to Zyvento Seller Network - Approved!",
        action_url_template: "/seller/dashboard",
        action_label_template: "Go to Seller Hub",
        channels: ["in_app", "email"],
        default_priority: "critical",
        variables: ["seller_name", "business_name"],
        is_system: true
    },
    {
        template_code: "TMPL_SELLER_REQUEST_SOLVED",
        name: "Seller Support Request Solved",
        description: "Sent to seller when admin resolves support ticket",
        category: "SELLER",
        notification_type: "seller_request_solved",
        title_template: "Support Request Solved #{{request_id}}",
        body_template: "Hi {{seller_name}}, your support ticket #{{request_id}} has been solved by admin: {{admin_solution}}.",
        email_subject_template: "Resolution: Support Ticket #{{request_id}}",
        action_url_template: "/seller/requests/{{request_id}}",
        channels: ["in_app", "email"],
        default_priority: "high",
        variables: ["seller_name", "request_id", "admin_solution"],
        is_system: true
    },

    // CUSTOMER / PROMOTION
    {
        template_code: "TMPL_COUPON_APPLIED",
        name: "Coupon Applied Notification",
        description: "Sent when customer successfully uses promo coupon",
        category: "CUSTOMER",
        notification_type: "coupon_applied",
        title_template: "Coupon Applied: {{coupon_code}}",
        body_template: "You saved ₹{{discount_amount}} on your cart using promo code {{coupon_code}}!",
        action_url_template: "/cart",
        channels: ["in_app"],
        default_priority: "low",
        variables: ["coupon_code", "discount_amount"],
        is_system: true
    },
    {
        template_code: "TMPL_REVIEW_REMINDER",
        name: "Customer Review Reminder",
        description: "Sent to customer after delivery to solicit review",
        category: "CUSTOMER",
        notification_type: "review_reminder",
        title_template: "How was your {{product_name}}?",
        body_template: "Hi {{customer_name}}, how was your recent purchase of {{product_name}}? Share your feedback with fellow shoppers.",
        email_subject_template: "We'd love your review on {{product_name}}!",
        action_url_template: "/orders/{{order_id}}",
        action_label_template: "Write a Review",
        channels: ["in_app", "email"],
        default_priority: "low",
        variables: ["customer_name", "product_name", "order_id"],
        is_system: true
    }
];

async function seedDefaultTemplates() {
    try {
        for (const tmpl of DEFAULT_TEMPLATES) {
            await NotificationTemplate.findOneAndUpdate(
                { template_code: tmpl.template_code },
                { $setOnInsert: tmpl },
                { upsert: true, returnDocument: 'after' }
            );
        }
        logger.info(`NotificationEngine: Default templates verified/seeded (${DEFAULT_TEMPLATES.length} templates)`);
    } catch (err) {
        logger.error("seedDefaultTemplates error:", err);
    }
}

module.exports = {
    DEFAULT_TEMPLATES,
    seedDefaultTemplates
};
