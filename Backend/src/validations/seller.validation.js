// Validation schemas for seller routes
// Validates seller registration, update, documents, approval
// Used in seller.routes.js for request validation

const Joi = require('joi');

const sellerValidation = {
    // ============ SELLER REGISTRATION ============
    sellerRegistration: Joi.object({
        business_name: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
                'string.empty': 'Business name is required',
                'string.min': 'Business name must be at least 2 characters',
                'string.max': 'Business name cannot exceed 100 characters',
            }),

        owner_name: Joi.string()
            .min(2)
            .max(50)
            .required()
            .messages({
                'string.empty': 'Owner name is required',
                'string.min': 'Owner name must be at least 2 characters',
            }),

        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email',
                'string.empty': 'Email is required',
            }),

        mobile_number: Joi.string()
            .pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
            .required()
            .messages({
                'string.pattern.base': 'Please provide a valid mobile number',
                'string.empty': 'Mobile number is required',
            }),

        business_registration_number: Joi.string()
            .required()
            .messages({
                'string.empty': 'Business registration number is required',
            }),

        tax_id: Joi.string()
            .required()
            .messages({
                'string.empty': 'Tax ID is required',
            }),

        business_type: Joi.string()
            .valid('individual', 'company', 'brand', 'partnership')
            .default('individual'),

        gst_number: Joi.string()
            .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid GST number format',
            }),

        pan_number: Joi.string()
            .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Invalid PAN number format',
            }),

        business_address: Joi.object({
            street: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            country: Joi.string().required(),
            zip_code: Joi.string()
                .pattern(/^[0-9]{5,6}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Invalid zip code format',
                }),
        }).required(),

        bank_details: Joi.object({
            account_holder_name: Joi.string().required(),
            bank_name: Joi.string().required(),
            account_number: Joi.string().required(),
            ifsc_code: Joi.string()
                .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Invalid IFSC code format',
                }),
            upi_id: Joi.string()
                .email()
                .optional(),
        }).required(),

        documents: Joi.array()
            .items(
                Joi.object({
                    document_type: Joi.string()
                        .valid(
                            'business_license',
                            'tax_certificate',
                            'identity_proof',
                            'address_proof',
                            'bank_details',
                            'gst_certificate',
                            'pan_card'
                        )
                        .required(),
                    document_url: Joi.string().required(),
                })
            )
            .optional(),
    }),

    // ============ UPDATE SELLER ============
    updateSeller: Joi.object({
        business_name: Joi.string()
            .min(2)
            .max(100)
            .optional(),

        store_name: Joi.string()
            .max(100)
            .allow('', null)
            .optional(),

        tagline: Joi.string()
            .max(200)
            .allow('', null)
            .optional(),

        store_description: Joi.string()
            .max(2000)
            .allow('', null)
            .optional(),

        logo: Joi.string()
            .allow('', null)
            .optional(),

        banner: Joi.string()
            .allow('', null)
            .optional(),

        owner_name: Joi.string()
            .min(2)
            .max(100)
            .optional(),

        mobile_number: Joi.string()
            .allow('', null)
            .optional(),

        email: Joi.string()
            .email()
            .allow('', null)
            .optional(),

        business_type: Joi.string()
            .valid('individual', 'company', 'brand', 'partnership')
            .optional(),

        gst_number: Joi.string()
            .allow('', null)
            .optional(),

        pan_number: Joi.string()
            .allow('', null)
            .optional(),

        tax_id: Joi.string()
            .allow('', null)
            .optional(),

        business_address: Joi.object({
            street: Joi.string().allow('', null).optional(),
            city: Joi.string().allow('', null).optional(),
            state: Joi.string().allow('', null).optional(),
            country: Joi.string().allow('', null).optional(),
            zip_code: Joi.string().allow('', null).optional(),
            postal_code: Joi.string().allow('', null).optional(),
        }).optional(),

        bank_details: Joi.object({
            account_holder_name: Joi.string().allow('', null).optional(),
            bank_name: Joi.string().allow('', null).optional(),
            account_number: Joi.string().allow('', null).optional(),
            ifsc_code: Joi.string().allow('', null).optional(),
            upi_id: Joi.string().allow('', null).optional(),
        }).optional(),

        settings: Joi.object({
            order_processing_time: Joi.number()
                .integer()
                .min(1)
                .max(168)
                .optional(),
            return_policy: Joi.string().allow('', null).optional(),
            fulfillment_type: Joi.string().valid('easy_ship', 'self_ship').optional(),
            default_shipping_fee: Joi.number().min(0).optional(),
            pickup_address: Joi.object({
                street: Joi.string().allow('', null).optional(),
                city: Joi.string().allow('', null).optional(),
                state: Joi.string().allow('', null).optional(),
                postal_code: Joi.string().allow('', null).optional(),
                country: Joi.string().allow('', null).optional(),
            }).optional(),
            vacation_mode: Joi.boolean().optional(),
            shipping_methods: Joi.array()
                .items(
                    Joi.object({
                        name: Joi.string().required(),
                        cost: Joi.number().min(0).required(),
                        estimated_days: Joi.number().integer().min(1).required(),
                    })
                )
                .optional(),
        }).optional(),
    }),

    // ============ SELLER APPROVAL ============
    approveSeller: Joi.object({
        seller_id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid seller ID',
                'string.empty': 'Seller ID is required',
            }),

        notes: Joi.string()
            .optional(),
    }),

    // ============ REJECT SELLER ============
    rejectSeller: Joi.object({
        seller_id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid seller ID',
                'string.empty': 'Seller ID is required',
            }),

        rejection_reason: Joi.string()
            .required()
            .messages({
                'string.empty': 'Rejection reason is required',
            }),
    }),

    // ============ SUSPEND SELLER ============
    suspendSeller: Joi.object({
        seller_id: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required(),

        reason: Joi.string()
            .required()
            .messages({
                'string.empty': 'Suspension reason is required',
            }),
    }),

    // ============ SELLER DOCUMENT ============
    uploadSellerDocument: Joi.object({
        document_type: Joi.string()
            .valid(
                'business_license',
                'tax_certificate',
                'identity_proof',
                'address_proof',
                'bank_details',
                'gst_certificate',
                'pan_card'
            )
            .required()
            .messages({
                'any.only': 'Invalid document type',
                'string.empty': 'Document type is required',
            }),
    }),

    // ============ GET SELLERS (With Filters) ============
    getSellers: Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1),

        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10),

        search: Joi.string()
            .optional(),

        verification_status: Joi.string()
            .valid('pending', 'under_review', 'approved', 'rejected', 'suspended')
            .optional(),

        account_status: Joi.string()
            .valid('active', 'blocked', 'inactive', 'suspended')
            .optional(),

        business_type: Joi.string()
            .valid('individual', 'company', 'brand', 'partnership')
            .optional(),

        sort_by: Joi.string()
            .valid('created_at', 'business_name', 'total_orders', 'total_revenue', 'rating')
            .default('created_at'),

        sort_order: Joi.string()
            .valid('asc', 'desc')
            .default('desc'),
    }),

    // ============ SELLER SETTINGS ============
    updateSellerSettings: Joi.object({
        order_processing_time: Joi.number().integer().min(1).max(168).optional(),
        return_policy: Joi.string().allow('', null).optional(),
        fulfillment_type: Joi.string().valid('easy_ship', 'self_ship').optional(),
        default_shipping_fee: Joi.number().min(0).optional(),
        pickup_address: Joi.object({
            street: Joi.string().allow('', null).optional(),
            city: Joi.string().allow('', null).optional(),
            state: Joi.string().allow('', null).optional(),
            postal_code: Joi.string().allow('', null).optional(),
            country: Joi.string().allow('', null).optional(),
        }).optional(),
        vacation_mode: Joi.boolean().optional(),
    }),

    // ============ DASHBOARD PERIOD ============
    dashboardPeriod: Joi.object({
        period: Joi.string().valid('weekly', 'monthly', 'yearly', '7d', '30d', '12m').default('weekly'),
    }),
};

module.exports = sellerValidation;